package com.femora.backend.hospital;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    /** source is "saved" (your own hospital table) or "osm" (live OpenStreetMap data). */
    public record HospitalView(String id, String name, String type, String address, String area, String city,
                               String state, String phone, String website, String specialties,
                               Double distanceKm, Double latitude, Double longitude, String source) {
    }

    public record SearchResponse(List<HospitalView> results, String place, String notice,
                                 Double centerLat, Double centerLng) {
    }

    private static final double SAVED_RADIUS_KM = 30;

    private final HospitalRepository repo;
    private final OsmClient osm;

    public HospitalController(HospitalRepository repo, OsmClient osm) {
        this.repo = repo;
        this.osm = osm;
    }

    /**
     * GET /api/hospitals?q=Koregaon Park Pune        any place: geocoded, then hospitals around it
     * GET /api/hospitals?lat=18.53&lng=73.89         the user's own position
     * Results are your saved hospitals plus live OpenStreetMap hospitals, nearest first, at most 30.
     */
    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String q,
                                  @RequestParam(required = false) Double lat,
                                  @RequestParam(required = false) Double lng) {

        if ((lat == null) != (lng == null)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please send both lat and lng."));
        }
        boolean hasQuery = q != null && !q.isBlank();
        if (lat == null && !hasQuery) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please type a place or use your location."));
        }
        if (lat != null && (lat < -90 || lat > 90 || lng < -180 || lng > 180)) {
            return ResponseEntity.badRequest().body(Map.of("message", "That location is not valid."));
        }

        Double cLat = lat;
        Double cLng = lng;
        String placeLabel = null;
        String notice = null;

        // 1. Typed place -> coordinates
        if (cLat == null) {
            try {
                Optional<OsmClient.Place> place = osm.geocode(q);
                if (place.isPresent()) {
                    cLat = place.get().lat();
                    cLng = place.get().lng();
                    placeLabel = shortName(place.get().name());
                }
            } catch (OsmClient.OsmUnavailableException e) {
                notice = "The place search is busy right now, so only saved hospitals are shown.";
            }
        }

        // 2. No coordinates (not found or lookup busy): fall back to text search in the saved list
        if (cLat == null) {
            List<HospitalView> saved = savedByText(q);
            if (saved.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message",
                        notice != null ? notice + " Please try again in a moment."
                                : "We couldn't find that place. Try the city name or a pincode."));
            }
            return ResponseEntity.ok(new SearchResponse(saved, null, notice, null, null));
        }

        // 3. Saved hospitals around the point
        List<HospitalView> out = new ArrayList<>();
        for (Hospital h : repo.findAll()) {
            if (h.getLatitude() == null || h.getLongitude() == null) continue;
            double d = km(cLat, cLng, h.getLatitude(), h.getLongitude());
            if (d <= SAVED_RADIUS_KM) out.add(savedView(h, d));
        }

        // 4. Live OpenStreetMap hospitals: 10 km first, then 30 km if the area is thin
        try {
            int radiusKm = 10;
            List<OsmClient.Facility> found = osm.nearby(cLat, cLng, radiusKm * 1000);
            if (found.size() < 3) {
                radiusKm = 30;
                found = osm.nearby(cLat, cLng, radiusKm * 1000);
            }
            for (OsmClient.Facility f : found) {
                double d = km(cLat, cLng, f.lat(), f.lng());
                if (d > radiusKm || isDuplicate(out, f)) continue;
                out.add(osmView(f, d));
            }
        } catch (OsmClient.OsmUnavailableException e) {
            notice = "Live hospital data is busy right now, so only saved hospitals are shown. Please try again in a moment.";
        }

        out.sort(Comparator.comparing(HospitalView::distanceKm));
        List<HospitalView> top = out.stream().limit(30).collect(Collectors.toList());
        if (top.isEmpty() && notice == null) {
            notice = "No hospitals found within 30 km. Try a bigger nearby city.";
        }
        return ResponseEntity.ok(new SearchResponse(top, placeLabel, notice, cLat, cLng));
    }

    // ---------------------------------------------------------------- helpers

    private List<HospitalView> savedByText(String q) {
        List<String> words = Stream.of(q.toLowerCase(Locale.ROOT).split("[,\\s]+")).filter(w -> !w.isBlank()).toList();
        return repo.findAll().stream()
                .filter(h -> {
                    String text = Stream.of(h.getName(), h.getAddress(), h.getArea(), h.getCity(), h.getState(), h.getSpecialties())
                            .filter(s -> s != null).collect(Collectors.joining(" ")).toLowerCase(Locale.ROOT);
                    return words.stream().allMatch(text::contains);
                })
                .map(h -> savedView(h, null))
                .sorted(Comparator.comparing(HospitalView::name, String.CASE_INSENSITIVE_ORDER))
                .limit(30)
                .collect(Collectors.toList());
    }

    /** The same hospital can be in both your table and OpenStreetMap. Keep your saved one. */
    private static boolean isDuplicate(List<HospitalView> existing, OsmClient.Facility f) {
        String key = normalise(f.name());
        return existing.stream().anyMatch(v -> "saved".equals(v.source())
                && normalise(v.name()).equals(key)
                && km(v.latitude(), v.longitude(), f.lat(), f.lng()) < 1.0);
    }

    private static String normalise(String name) {
        return name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private static HospitalView savedView(Hospital h, Double distance) {
        return new HospitalView("saved-" + h.getId(), h.getName(), h.getType(), h.getAddress(), h.getArea(),
                h.getCity(), h.getState(), h.getPhone(), h.getWebsite(), h.getSpecialties(), round(distance),
                h.getLatitude(), h.getLongitude(), "saved");
    }

    private static HospitalView osmView(OsmClient.Facility f, double distance) {
        return new HospitalView("osm-" + f.lat() + "," + f.lng(), f.name(), f.type(), f.address(), f.area(),
                f.city(), f.state(), f.phone(), f.website(), f.specialties(), round(distance),
                f.lat(), f.lng(), "osm");
    }

    private static Double round(Double d) {
        return d == null ? null : Math.round(d * 10) / 10.0;
    }

    /** "Koregaon Park, Pune, Maharashtra, 411001, India" -> "Koregaon Park, Pune" */
    private static String shortName(String displayName) {
        String[] parts = displayName.split(",");
        return parts.length <= 2 ? displayName : (parts[0].trim() + ", " + parts[1].trim());
    }

    /** Distance in km between two points on Earth (Haversine). */
    private static double km(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * 6371.0 * Math.asin(Math.sqrt(a));
    }
}
