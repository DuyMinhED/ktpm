package com.project.repository;

import com.project.entity.MedicalService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicalServiceRepository extends JpaRepository<MedicalService, Long> {
    List<MedicalService> findByStatus(String status);
    List<MedicalService> findByCategory(String category);
    List<MedicalService> findByClinicId(Long clinicId);

    @org.springframework.data.jpa.repository.Query("SELECT ms FROM MedicalService ms WHERE ms.clinicId IS NULL OR ms.clinicId = :clinicId")
    List<MedicalService> findAllGlobalAndByClinicId(@org.springframework.data.repository.query.Param("clinicId") Long clinicId);
}
