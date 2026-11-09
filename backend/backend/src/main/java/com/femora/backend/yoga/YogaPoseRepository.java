package com.femora.backend.yoga;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface YogaPoseRepository extends JpaRepository<YogaPose, Long> {
    List<YogaPose> findByCategory(String category);
    List<YogaPose> findByChakra(String chakra);
    List<YogaPose> findByCategoryAndChakra(String category, String chakra);
}