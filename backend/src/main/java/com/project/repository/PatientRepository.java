package com.project.repository;

import com.project.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    List<Patient> findByDoctorId(Long doctorId);

    Optional<Patient> findByUserId(Long userId);

    Optional<Patient> findByUserIdAndIsDeletedFalse(Long userId);

    Optional<Patient> findByPatientCodeAndIsDeletedFalse(String patientCode);

    List<Patient> findByClinicId(Long clinicId);

    @Query("SELECT p FROM Patient p WHERE p.isDeleted = false AND (:clinicId IS NULL OR p.clinicId = :clinicId) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(p.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:condition IS NULL OR :condition = 'Tất cả bệnh lý' OR :condition = '' OR p.chronicCondition = :condition) AND " +
           "(:riskLevel IS NULL OR :riskLevel = 'Mức độ rủi ro' OR :riskLevel = '' OR p.riskLevel = :riskLevel) AND " +
           "(:status IS NULL OR :status = 'Tất cả trạng thái' OR :status = '' OR p.profileStatus = :status) AND " +
           "(:doctor IS NULL OR :doctor = 'Tất cả bác sĩ' OR :doctor = '' OR p.doctorId IN (SELECT u.id FROM User u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :doctor, '%')))) " +
           "ORDER BY p.id DESC")
    Page<Patient> findByClinicIdAndFilters(Long clinicId, String keyword, String condition, String riskLevel, String status, String doctor, Pageable pageable);
    
    long countByClinicIdAndIsDeletedFalse(Long clinicId);
    long countByClinicIdAndRiskLevelAndIsDeletedFalse(Long clinicId, String riskLevel);
    long countByClinicIdAndChronicConditionAndIsDeletedFalse(Long clinicId, String condition);
    long countByCreatedAtBetweenAndIsDeletedFalse(java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByClinicIdAndCreatedAtBetweenAndIsDeletedFalse(Long clinicId, java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByClinicIdAndRiskLevelAndCreatedAtBetweenAndIsDeletedFalse(Long clinicId, String riskLevel, java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByDoctorIdAndIsDeletedFalse(Long doctorId);
    long countByRiskLevelAndIsDeletedFalse(String riskLevel);
    long countByClinicIdAndTreatmentStatusAndIsDeletedFalse(Long clinicId, String treatmentStatus);

    @Query("SELECT p.chronicCondition, COUNT(p) FROM Patient p WHERE p.clinicId = :clinicId AND p.isDeleted = false GROUP BY p.chronicCondition")
    List<Object[]> countPatientsByChronicCondition(Long clinicId);

    @Query("SELECT p.riskLevel, COUNT(p) FROM Patient p WHERE p.clinicId = :clinicId AND p.isDeleted = false GROUP BY p.riskLevel")
    List<Object[]> countPatientsByRiskLevel(Long clinicId);

    @Query("SELECT p.doctorId, COUNT(p) FROM Patient p WHERE p.clinicId = :clinicId AND p.isDeleted = false GROUP BY p.doctorId")
    List<Object[]> countPatientsByDoctorIds(Long clinicId);

    @Query("SELECT p.doctorId, COUNT(p) FROM Patient p WHERE p.clinicId = :clinicId AND p.riskLevel = :riskLevel AND p.isDeleted = false GROUP BY p.doctorId")
    List<Object[]> countHighRiskPatientsByDoctorIds(Long clinicId, String riskLevel);

    @org.springframework.data.jpa.repository.Query(value = "SELECT CAST(p.created_at AS date), COUNT(p.id) FROM patients p WHERE p.clinic_id = :clinicId AND p.is_deleted = false AND p.created_at >= :startDate GROUP BY CAST(p.created_at AS date)", nativeQuery = true)
    List<Object[]> countDailyPatients(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);

    @org.springframework.data.jpa.repository.Query(value = "SELECT CAST(p.created_at AS date), COUNT(p.id) FROM patients p WHERE p.clinic_id = :clinicId AND p.risk_level = :riskLevel AND p.is_deleted = false AND p.created_at >= :startDate GROUP BY CAST(p.created_at AS date)", nativeQuery = true)
    List<Object[]> countDailyHighRiskPatients(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, @org.springframework.data.repository.query.Param("riskLevel") String riskLevel, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);

    @org.springframework.data.jpa.repository.Query(value = "SELECT EXTRACT(YEAR FROM p.created_at), EXTRACT(MONTH FROM p.created_at), COUNT(p.id) FROM patients p WHERE p.clinic_id = :clinicId AND p.is_deleted = false AND p.created_at >= :startDate GROUP BY EXTRACT(YEAR FROM p.created_at), EXTRACT(MONTH FROM p.created_at)", nativeQuery = true)
    List<Object[]> countMonthlyPatients(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);

    @org.springframework.data.jpa.repository.Query(value = "SELECT EXTRACT(YEAR FROM p.created_at), EXTRACT(MONTH FROM p.created_at), COUNT(p.id) FROM patients p WHERE p.clinic_id = :clinicId AND p.risk_level = :riskLevel AND p.is_deleted = false AND p.created_at >= :startDate GROUP BY EXTRACT(YEAR FROM p.created_at), EXTRACT(MONTH FROM p.created_at)", nativeQuery = true)
    List<Object[]> countMonthlyHighRiskPatients(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, @org.springframework.data.repository.query.Param("riskLevel") String riskLevel, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);

    long countByDoctorIdAndRiskLevelAndIsDeletedFalse(Long doctorId, String riskLevel);

    @Query("SELECT p FROM Patient p WHERE p.isDeleted = false AND p.doctorId = :doctorId AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(p.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:condition IS NULL OR :condition = '' OR :condition = 'Tất cả bệnh lý' OR p.chronicCondition = :condition) AND " +
           "(:riskLevel IS NULL OR :riskLevel = '' OR :riskLevel = 'Mọi mức độ' OR p.riskLevel = :riskLevel) " +
           "ORDER BY p.id DESC")
    Page<Patient> findByDoctorIdAndFilters(Long doctorId, String keyword, String condition, String riskLevel, Pageable pageable);

    List<Patient> findByDoctorIdAndRiskLevelAndIsDeletedFalse(Long doctorId, String riskLevel);

    @Query("SELECT p.riskLevel, COUNT(p) FROM Patient p WHERE p.doctorId = :doctorId AND p.isDeleted = false GROUP BY p.riskLevel")
    List<Object[]> countPatientsByRiskLevelForDoctor(Long doctorId);

    @Query("SELECT p.chronicCondition, p.riskLevel, COUNT(p) FROM Patient p WHERE p.clinicId = :clinicId AND p.isDeleted = false GROUP BY p.chronicCondition, p.riskLevel")
    List<Object[]> countRiskDistributionByCondition(Long clinicId);

    List<Patient> findByDoctorIdAndIsDeletedFalse(Long doctorId);
}
