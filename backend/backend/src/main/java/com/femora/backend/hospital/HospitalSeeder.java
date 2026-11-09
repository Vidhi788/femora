package com.femora.backend.hospital;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Adds a few well-known Ahmedabad hospitals the first time the app starts (only if the table is empty).
 *
 * IMPORTANT: this is starter data for the demo.
 *  - The coordinates are APPROXIMATE. Check each one on Google Maps (right-click the place and click the
 *    numbers to copy latitude and longitude) and update the row.
 *  - phone and website are left EMPTY on purpose. Copy them from each hospital's own website, so nobody
 *    calls a wrong number. Until you do, the screen shows "Find phone on Google" for that hospital.
 *
 * To add or fix data, run SQL in MySQL, for example:
 *   UPDATE hospital SET phone='+91 ...', website='https://...' WHERE name='Sterling Hospital';
 *   UPDATE hospital SET latitude=23.05, longitude=72.53 WHERE name='Sterling Hospital';
 *   INSERT INTO hospital (name, type, address, area, city, state, latitude, longitude, phone, website, specialties)
 *   VALUES ('Name', 'Private hospital', 'Street', 'Area', 'City', 'State', 0.0, 0.0, '+91 ...', 'https://...', 'Gynaecology');
 */
@Component
public class HospitalSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(HospitalSeeder.class);

    private final HospitalRepository repo;

    public HospitalSeeder(HospitalRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        if (repo.count() > 0) {
            return;
        }

        repo.save(h("Civil Hospital Ahmedabad", "Government hospital", "Asarwa", "Asarwa", 23.0507, 72.6029));
        repo.save(h("Sterling Hospital", "Private hospital", "Gurukul Road, Memnagar", "Memnagar", 23.0476, 72.5348));
        repo.save(h("Zydus Hospital", "Private hospital", "SG Highway, Thaltej", "Thaltej", 23.0600, 72.5064));
        repo.save(h("SAL Hospital", "Private hospital", "Drive-In Road, Thaltej", "Thaltej", 23.0467, 72.5190));
        repo.save(h("CIMS Hospital", "Private hospital", "Science City Road, Sola", "Sola", 23.0707, 72.5167));
        repo.save(h("Apollo Hospitals International", "Private hospital", "GIDC Bhat", "Bhat", 23.1163, 72.6013));
        repo.save(h("Shalby Hospital", "Private hospital", "SG Highway", "SG Highway", 23.0350, 72.5075));
        repo.save(h("V.S. General Hospital", "Municipal hospital", "Ellisbridge", "Ellisbridge", 23.0215, 72.5644));

        log.info("HospitalSeeder: added 8 starter hospitals. Check coordinates and add phone and website.");
    }

    private static Hospital h(String name, String type, String address, String area, double lat, double lng) {
        return new Hospital(name, type, address, area, "Ahmedabad", "Gujarat", lat, lng, null, null, "Multi-speciality");
    }
}