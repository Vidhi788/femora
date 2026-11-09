package com.femora.backend.hospital;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Keeps only places that are related to women's health: gynaecology, pregnancy and maternity care.
 *
 * Map data rarely says which departments a hospital has, so a place counts as women's health when its
 * name or its "speciality" tag contains one of the words below. If nothing nearby matches, general
 * hospitals are shown instead and clearly labelled, so the person is never left with an empty page.
 */
final class WomenHealthFilter {

    private static final Pattern WOMEN = Pattern.compile(
            "gyn|obstet|matern|prenatal|antenatal|pregnan|midwif|lactation|fertil|ivf|"
                    + "women|woman|ladies|lady|mother|birth|mahila|prasuti|matru|janani",
            Pattern.CASE_INSENSITIVE);

    private static final int MAX_GENERAL = 8;

    private WomenHealthFilter() {
    }

    static List<OsmClient.Facility> apply(List<OsmClient.Facility> all) {
        List<OsmClient.Facility> women = new ArrayList<>();
        for (OsmClient.Facility f : all) {
            if (matches(f)) {
                String label = f.specialties() == null ? "Women's health" : "Women's health · " + f.specialties();
                women.add(relabel(f, label));
            }
        }
        if (!women.isEmpty()) return women;

        List<OsmClient.Facility> general = new ArrayList<>();
        for (OsmClient.Facility f : all) {
            if ("Hospital".equals(f.type())) {
                general.add(relabel(f, "General hospital · ask for the gynaecology department"));
                if (general.size() >= MAX_GENERAL) break;
            }
        }
        return general;
    }

    private static boolean matches(OsmClient.Facility f) {
        String text = f.name() + " " + (f.specialties() == null ? "" : f.specialties());
        return WOMEN.matcher(text).find();
    }

    private static OsmClient.Facility relabel(OsmClient.Facility f, String specialties) {
        return new OsmClient.Facility(f.name(), f.type(), f.address(), f.area(), f.city(), f.state(),
                f.phone(), f.website(), specialties, f.lat(), f.lng());
    }
}
