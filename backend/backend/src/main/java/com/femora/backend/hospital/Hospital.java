package com.femora.backend.hospital;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One hospital or clinic in the directory. Femora does not book appointments: users call or open the website. */
@Entity
@Table(name = "hospital")
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String type;       // "Private hospital", "Government hospital", "Clinic" ...

    @Column(length = 300)
    private String address;

    private String area;       // neighbourhood, e.g. "Satellite"
    private String city;
    private String state;

    private Double latitude;   // needed for "near me"; leave null if unknown
    private Double longitude;

    private String phone;      // leave null until you have checked it on the hospital's own website

    @Column(length = 300)
    private String website;

    @Column(length = 300)
    private String specialties;

    public Hospital() {
    }

    public Hospital(String name, String type, String address, String area, String city, String state,
                    Double latitude, Double longitude, String phone, String website, String specialties) {
        this.name = name;
        this.type = type;
        this.address = address;
        this.area = area;
        this.city = city;
        this.state = state;
        this.latitude = latitude;
        this.longitude = longitude;
        this.phone = phone;
        this.website = website;
        this.specialties = specialties;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public String getAddress() { return address; }
    public String getArea() { return area; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getPhone() { return phone; }
    public String getWebsite() { return website; }
    public String getSpecialties() { return specialties; }
}