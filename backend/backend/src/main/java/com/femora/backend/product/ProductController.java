package com.femora.backend.product;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    /** GET /api/products                          -> everything
     *  GET /api/products?category=period_survival -> one kit
     *  Always returned in the order they were added, so tiers stay in order. */
    @GetMapping
    public List<Product> list(@RequestParam(required = false) String category) {
        List<Product> found = (category == null || category.isBlank())
                ? products.findAll()
                : products.findByCategoryIgnoreCase(category.trim());
        return found.stream().sorted(Comparator.comparing(Product::getId)).toList();
    }
}