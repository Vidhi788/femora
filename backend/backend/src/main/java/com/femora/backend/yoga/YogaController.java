package com.femora.backend.yoga;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/yoga")
public class YogaController {

    private final YogaPoseRepository repo;

    public YogaController(YogaPoseRepository repo) {
        this.repo = repo;
    }

    // GET /api/yoga                          -> all poses
    // GET /api/yoga?category=PCOS            -> one category
    // GET /api/yoga?category=PCOS&chakra=HEART
    @GetMapping
    public List<YogaPose> list(@RequestParam(required = false) String category,
                               @RequestParam(required = false) String chakra) {
        if (category != null && chakra != null) {
            return repo.findByCategoryAndChakra(category.toUpperCase(), chakra.toUpperCase());
        }
        if (category != null) return repo.findByCategory(category.toUpperCase());
        if (chakra != null) return repo.findByChakra(chakra.toUpperCase());
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<YogaPose> one(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}