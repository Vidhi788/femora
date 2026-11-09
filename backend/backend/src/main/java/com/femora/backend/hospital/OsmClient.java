package com.femora.backend.hospital;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Finds hospitals anywhere using free OpenStreetMap services:
 *   - Nominatim turns "Koregaon Park, Pune" into coordinates
 *   - Overpass lists hospitals (and gynaecology clinics) around those coordinates
 *
 * Their public servers are shared volunteer services, so this class follows their rules:
 *   - sends an identifying User-Agent (set femora.osm.user-agent in application.properties, with your email)
 *   - makes at most one Nominatim request per second
 *   - caches answers so the same search does not hit them again
 *   - asks Geoapify first (needs femora.geoapify.key), then several Overpass servers as a backup
 * The screen must show "OpenStreetMap contributors". Data comes from volunteers, so phone
 * numbers are often missing or out of date.
 */
@Component
public class OsmClient {

    private static final Logger log = LoggerFactory.getLogger(OsmClient.class);

    /** Public Overpass servers, tried in order until one answers. */
    private static final List<String> OVERPASS_SERVERS = List.of(
            "https://overpass.private.coffee/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://overpass-api.de/api/interpreter");

    public static class OsmUnavailableException extends RuntimeException {
        public OsmUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public record Place(double lat, double lng, String name) {
    }

    public record Facility(String name, String type, String address, String area, String city, String state,
                           String phone, String website, String specialties, double lat, double lng) {
    }

    private record Timed<T>(T value, long at) {
    }

    private static final long GEO_TTL_MS = 24L * 60 * 60 * 1000;
    private static final long FACILITY_TTL_MS = 6L * 60 * 60 * 1000;

    private final RestClient http;
    private final String country;
    private final GeoapifyClient places;
    private final Map<String, Timed<Place>> geoCache = new ConcurrentHashMap<>();
    private final Map<String, Timed<List<Facility>>> facilityCache = new ConcurrentHashMap<>();
    private long lastNominatimCall = 0;

    public OsmClient(@Value("${femora.osm.user-agent:Femora/1.0 (academic project)}") String userAgent,
                     @Value("${femora.osm.country:in}") String country,
                     GeoapifyClient places) {
        this.places = places;
        HttpClient jdk = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(jdk);
        // Shorter than before, so a stuck server is skipped quickly and the next one is tried.
        factory.setReadTimeout(Duration.ofSeconds(18));

        this.http = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.USER_AGENT, userAgent)
                .build();
        this.country = country == null ? "" : country.trim();
    }

    /** Turns a typed place into coordinates. Empty if Nominatim does not know it. */
    public Optional<Place> geocode(String text) {
        String key = text.trim().toLowerCase(Locale.ROOT);
        Timed<Place> hit = geoCache.get(key);
        if (hit != null && System.currentTimeMillis() - hit.at() < GEO_TTL_MS) {
            return Optional.of(hit.value());
        }

        try {
            waitForTurn();
            String url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + enc(text.trim())
                    + (country.isEmpty() ? "" : "&countrycodes=" + enc(country));

            List<Map<String, Object>> rows = http.get().uri(URI.create(url)).retrieve()
                    .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    });
            if (rows == null || rows.isEmpty()) {
                return Optional.empty();
            }
            Map<String, Object> row = rows.get(0);
            Place place = new Place(Double.parseDouble(String.valueOf(row.get("lat"))),
                    Double.parseDouble(String.valueOf(row.get("lon"))), String.valueOf(row.get("display_name")));
            geoCache.put(key, new Timed<>(place, System.currentTimeMillis()));
            return Optional.of(place);

        } catch (RestClientException | NumberFormatException e) {
            throw new OsmUnavailableException("Place lookup failed", e);
        }
    }

    /** Hospitals, plus clinics or doctors tagged gynaecology or obstetrics, within radiusMeters. */
    public List<Facility> nearby(double lat, double lng, int radiusMeters) {
        String key = String.format(Locale.ROOT, "%.3f,%.3f,%d", lat, lng, radiusMeters);
        Timed<List<Facility>> hit = facilityCache.get(key);
        if (hit != null && System.currentTimeMillis() - hit.at() < FACILITY_TTL_MS) {
            return hit.value();
        }

        // 1) Geoapify first: fast, free plan, no card. Skipped if no key is set.
        if (places.enabled()) {
            try {
                List<Facility> found = WomenHealthFilter.apply(places.nearby(lat, lng, radiusMeters));
                if (!found.isEmpty()) {
                    log.info("Geoapify returned {} places", found.size());
                    facilityCache.put(key, new Timed<>(found, System.currentTimeMillis()));
                    return found;
                }
            } catch (RestClientException e) {
                log.warn("Geoapify failed, trying OpenStreetMap: {}", shorten(e.getMessage()));
            }
        }

        // 2) OpenStreetMap Overpass as the backup (free public servers, often busy).
        String query = String.format(Locale.ROOT,
                "[out:json][timeout:15];("
                        + "nwr[\"amenity\"=\"hospital\"](around:%d,%.5f,%.5f);"
                        + "nwr[\"amenity\"~\"^(clinic|doctors)$\"][\"healthcare:speciality\"~\"gyn|obstetric\",i](around:%d,%.5f,%.5f);"
                        + ");out center tags 150;",
                radiusMeters, lat, lng, radiusMeters, lat, lng);
        String body = "data=" + enc(query);

        RestClientException lastError = null;
        for (String server : OVERPASS_SERVERS) {
            try {
                Map<String, Object> json = http.post()
                        .uri(URI.create(server))
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(body)
                        .retrieve()
                        .body(new ParameterizedTypeReference<Map<String, Object>>() {
                        });

                List<Facility> found = new ArrayList<>();
                Object elements = json == null ? null : json.get("elements");
                if (elements instanceof List<?> list) {
                    for (Object o : list) {
                        if (o instanceof Map<?, ?> el) {
                            Facility f = toFacility(el);
                            if (f != null) found.add(f);
                        }
                    }
                }
                log.info("Overpass {} returned {} places", server, found.size());
                List<Facility> shown = WomenHealthFilter.apply(found);
                facilityCache.put(key, new Timed<>(shown, System.currentTimeMillis()));
                return shown;

            } catch (RestClientException e) {
                lastError = e;
                log.warn("Overpass {} failed: {}", server, shorten(e.getMessage()));
            }
        }
        // Every server failed. Nothing is cached, so the next search tries again.
        throw new OsmUnavailableException("Hospital lookup failed", lastError);
    }

    // ---------------------------------------------------------------- helpers

    private Facility toFacility(Map<?, ?> el) {
        if (!(el.get("tags") instanceof Map<?, ?> tags)) return null;
        String name = text(tags, "name");
        if (name == null) return null;

        Number lat = el.get("lat") instanceof Number n ? n : null;
        Number lon = el.get("lon") instanceof Number n ? n : null;
        if ((lat == null || lon == null) && el.get("center") instanceof Map<?, ?> c) {
            lat = c.get("lat") instanceof Number n ? n : null;
            lon = c.get("lon") instanceof Number n ? n : null;
        }
        if (lat == null || lon == null) return null;

        String amenity = text(tags, "amenity");
        String type = "clinic".equals(amenity) ? "Clinic" : "doctors".equals(amenity) ? "Doctor" : "Hospital";

        String street = joinNonNull(" ", text(tags, "addr:housenumber"), text(tags, "addr:street"));
        String address = street.isEmpty() ? orElse(text(tags, "addr:full"), "") : street;
        String area = firstNonNull(text(tags, "addr:suburb"), text(tags, "addr:neighbourhood"), text(tags, "addr:district"));

        String speciality = text(tags, "healthcare:speciality");
        if (speciality != null) {
            speciality = speciality.replace(";", ", ").replace("_", " ");
        }

        return new Facility(name, type, address.isEmpty() ? null : address, area, text(tags, "addr:city"),
                text(tags, "addr:state"),
                cleanPhone(firstNonNull(text(tags, "phone"), text(tags, "contact:phone"), text(tags, "contact:mobile"))),
                cleanWebsite(firstNonNull(text(tags, "website"), text(tags, "contact:website"))),
                speciality, lat.doubleValue(), lon.doubleValue());
    }

    /** Volunteer-entered text can hold anything, so only keep what looks like a phone number. */
    private static String cleanPhone(String raw) {
        if (raw == null) return null;
        String first = raw.split(";")[0].replaceAll("[^0-9+()\\-\\s]", "").trim();
        return first.replaceAll("\\D", "").length() >= 6 ? first : null;
    }

    /** Only http and https links are allowed (never javascript: or anything else). */
    private static String cleanWebsite(String raw) {
        if (raw == null) return null;
        String url = raw.split(";")[0].trim();
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.startsWith("http://") || lower.startsWith("https://")) return url;
        return url.contains(":") || url.contains(" ") || !url.contains(".") ? null : "https://" + url;
    }

    private static String text(Map<?, ?> tags, String key) {
        Object v = tags.get(key);
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }

    private static String firstNonNull(String... values) {
        for (String v : values) if (v != null) return v;
        return null;
    }

    private static String orElse(String v, String fallback) {
        return v == null ? fallback : v;
    }

    private static String joinNonNull(String sep, String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p == null) continue;
            if (sb.length() > 0) sb.append(sep);
            sb.append(p);
        }
        return sb.toString();
    }

    private static String shorten(String s) {
        if (s == null) return "";
        String oneLine = s.replace("\n", " ").replace("<EOL>", " ");
        return oneLine.length() > 160 ? oneLine.substring(0, 160) + "…" : oneLine;
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    /** Nominatim's public server allows at most one request per second. */
    private synchronized void waitForTurn() {
        long wait = 1100 - (System.currentTimeMillis() - lastNominatimCall);
        if (wait > 0) {
            try {
                Thread.sleep(wait);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new OsmUnavailableException("Interrupted", e);
            }
        }
        lastNominatimCall = System.currentTimeMillis();
    }
}