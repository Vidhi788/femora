package com.femora.backend.product;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

/** A comfort or wellness item. "category" is the kit it belongs to, "tier" is the group inside the kit. */
@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** The kit: period_survival, pcos_wellness, period_skin, yoga_relaxation, ... or back_pain, general, skin */
    @Column(nullable = false)
    private String category;

    @Column(length = 300)
    private String description;

    /** Group inside a kit, e.g. "Must-have", "Comfort", "Optional". Null for plain lists. */
    private String tier;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_store_link", joinColumns = @JoinColumn(name = "product_id"))
    private List<StoreLink> links = new ArrayList<>();

    public Product() {
    }

    public Product(String name, String category, String description, String tier, List<StoreLink> links) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.tier = tier;
        this.links = new ArrayList<>(links);
    }

    public Product(String name, String category, String description, List<StoreLink> links) {
        this(name, category, description, null, links);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public String getTier() {
        return tier;
    }

    public List<StoreLink> getLinks() {
        return links;
    }
}