package com.femora.backend.product;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** One "View on ..." button for a product: which store, and the link that opens in a new tab. */
@Embeddable
public class StoreLink {

    private String platform; // "Amazon", "Flipkart", "1mg", "Apollo Pharmacy", ...

    @Column(length = 1000)
    private String url;

    public StoreLink() {
    }

    public StoreLink(String platform, String url) {
        this.platform = platform;
        this.url = url;
    }

    public String getPlatform() {
        return platform;
    }

    public String getUrl() {
        return url;
    }
}