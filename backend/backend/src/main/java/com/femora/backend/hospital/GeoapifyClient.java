package com.femora.backend.hospital;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Nearby hospitals and clinics from the Geoapify Places API (free plan, no credit card).
 * Returns the same OsmClient.Facility records, so the rest of the backend does not change.
 * Disabled (enabled() == false) when no key is configured.
 * Note: Geoapify's data is built on OpenStreetMap, so phone numbers can still be missing.
 */
@Component
public class GeoapifyClient {

    private final RestClient http = RestClient.create();
    private final String key;

    public GeoapifyClient(@Value("${femora.geoapify.key:}") String key) {
        this.key = key == null ? "" : key.trim();
    }

    public boolean enabled() {
        return !key.isEmpty();
    }

    /** Up to 50 nearest hospitals and clinics (women's health is filtered afterwards). Throws RestClientException if Geoapify rejects the call. */
    public List<OsmClient.Facility> nearby(double lat, double lng, int radiusMeters) {
        // Geoapify wants longitude first, then latitude.
        String url = String.format(Locale.ROOT,
                "https://api.geoapify.com/v2/places?categories=healthcare.hospital,healthcare.clinic_or_praxis"
                        + "&filter=circle:%.6f,%.6f,%d&bias=proximity:%.6f,%.6f&limit=50&apiKey=%s",
                lng, lat, radiusMeters, lng, lat, key);

        Map<String, Object> json = http.get().uri(URI.create(url)).retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {
                });

        List<OsmClient.Facility> out = new ArrayList<>();
        if (json == null || !(json.get("features") instanceof List<?> features)) return out;

        for (Object f : features) {
            if (!(f instanceof Map<?, ?> feature) || !(feature.get("properties") instanceof Map<?, ?> p)) continue;

            String name = str(p.get("name"));
            if (name == null || !(p.get("lat") instanceof Number la) || !(p.get("lon") instanceof Number lo)) continue;

            boolean hospital = p.get("categories") instanceof List<?> c && c.contains("healthcare.hospital");

            Map<?, ?> contact = p.get("contact") instanceof Map<?, ?> m ? m : Map.of();
            Map<?, ?> raw = p.get("datasource") instanceof Map<?, ?> d && d.get("raw") instanceof Map<?, ?> r
                    ? r : Map.of();

            String phone = first(str(contact.get("phone")), str(raw.get("phone")), str(raw.get("contact:phone")));
            String website = http(first(str(p.get("website")), str(contact.get("website")), str(raw.get("website"))));

            String speciality = str(raw.get("healthcare:speciality"));
            if (speciality != null) speciality = speciality.replace(";", ", ").replace("_", " ");

            String street = join(str(p.get("housenumber")), str(p.get("street")));
            String address = street.isEmpty() ? str(p.get("address_line2")) : street;
            boolean structured = !street.isEmpty();

            out.add(new OsmClient.Facility(name, hospital ? "Hospital" : "Clinic", address,
                    structured ? str(p.get("suburb")) : null, structured ? str(p.get("city")) : null,
                    str(p.get("state")), phone, website, speciality, la.doubleValue(), lo.doubleValue()));
        }
        return out;
    }

    private static String http(String url) {
        if (url == null) return null;
        String u = url.split(";")[0].trim();
        String lower = u.toLowerCase(Locale.ROOT);
        return lower.startsWith("http://") || lower.startsWith("https://") ? u : null;
    }

    private static String first(String... v) {
        for (String s : v) if (s != null) return s.split(";")[0].trim();
        return null;
    }

    private static String join(String a, String b) {
        return ((a == null ? "" : a) + " " + (b == null ? "" : b)).trim();
    }

    private static String str(Object v) {
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }
}