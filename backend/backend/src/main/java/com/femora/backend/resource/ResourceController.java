
package com.femora.backend.resource;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "http://localhost:5173" )
public class ResourceController {

    @GetMapping
    public List<Map<String, String>> getResources() {
        return List.of(
                Map.of(
                        "type", "article",
                        "title", "Understanding your cycle",
                        "description",
                        "A calm introduction to the four phases of a cycle."
                ),
                Map.of(
                        "type", "practice",
                        "title", "Gentle yoga for today",
                        "description",
                        "A short, low-pressure movement routine."
                ),
                Map.of(
                        "type", "wellness",
                        "title", "Hydration made simple",
                        "description",
                        "Small reminders that are easier to keep."
                )
        );
    }
}
