package com.femora.backend.symptom;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SymptomCheckHistoryRepository extends JpaRepository<SymptomCheckHistory, Long> {

    List<SymptomCheckHistory> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}