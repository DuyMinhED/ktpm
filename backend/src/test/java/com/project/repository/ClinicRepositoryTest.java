package com.project.repository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.project.entity.Clinic;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.entity.Patient;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
public class ClinicRepositoryTest {

    @Autowired
    private ClinicRepository clinicRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Clinic sampleClinic;

    @BeforeEach
    void setUp() {
        sampleClinic = Clinic.builder()
                .clinicCode("PK001")
                .name("Phòng khám ABC")
                .address("123 HCM")
                .phone("028123456")
                .status("ACTIVE")
                .build();
        entityManager.persistAndFlush(sampleClinic);

        // Persist related doctor
        User doctor = User.builder()
                .email("doctor@abc.com")
                .password("password")
                .role(UserRole.DOCTOR)
                .fullName("Doctor ABC")
                .clinicId(sampleClinic.getId())
                .build();
        entityManager.persistAndFlush(doctor);

        // Persist related patients
        Patient patient1 = Patient.builder()
                .userId(101L)
                .clinicId(sampleClinic.getId())
                .fullName("Patient High Risk")
                .phone("0901234567")
                .gender("MALE")
                .riskLevel("HIGH")
                .build();
        entityManager.persistAndFlush(patient1);

        Patient patient2 = Patient.builder()
                .userId(102L)
                .clinicId(sampleClinic.getId())
                .fullName("Patient Low Risk")
                .phone("0907654321")
                .gender("MALE")
                .riskLevel("LOW")
                .build();
        entityManager.persistAndFlush(patient2);
    }

    @Test
    @DisplayName("findByClinicCode → found")
    void findByClinicCode_found() {
        Optional<Clinic> result = clinicRepository.findByClinicCode("PK001");
        assertTrue(result.isPresent());
        assertEquals("Phòng khám ABC", result.get().getName());
    }

    @Test
    @DisplayName("findByClinicCode → not found")
    void findByClinicCode_notFound() {
        Optional<Clinic> result = clinicRepository.findByClinicCode("NONEXISTENT");
        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("countClinics → counts non-deleted")
    void countClinics() {
        long count = clinicRepository.countClinics();
        assertTrue(count >= 1);
    }

    @Test
    @DisplayName("countByStatusAndIsDeletedFalse → counts by status")
    void countByStatus() {
        long activeCount = clinicRepository.countByStatusAndIsDeletedFalse("ACTIVE");
        assertTrue(activeCount >= 1);

        long inactiveCount = clinicRepository.countByStatusAndIsDeletedFalse("INACTIVE");
        assertEquals(0, inactiveCount);
    }

    @Test
    @DisplayName("findAllActive → returns non-deleted clinics")
    void findAllActive() {
        List<Clinic> result = clinicRepository.findAllActive();
        assertFalse(result.isEmpty());
        assertTrue(result.stream().allMatch(c -> !c.isDeleted()));
    }

    @Test
    @DisplayName("findByFilters with status → filters correctly")
    void findByFilters_withStatus() {
        Page<Clinic> result = clinicRepository.findByFilters("ACTIVE", null, PageRequest.of(0, 10));
        assertFalse(result.isEmpty());
    }

    @Test
    @DisplayName("findByFilters with name → filters by name")
    void findByFilters_withName() {
        Page<Clinic> result = clinicRepository.findByFilters(null, "%abc%", PageRequest.of(0, 10));
        assertFalse(result.isEmpty());
    }

    @Test
    @DisplayName("sumDoctorCountByActiveStatus → returns sum")
    void sumDoctorCount() {
        long sum = clinicRepository.sumDoctorCountByActiveStatus();
        assertEquals(1, sum);
    }

    @Test
    @DisplayName("sumPatientCount → returns sum")
    void sumPatientCount() {
        long sum = clinicRepository.sumPatientCount();
        assertEquals(2, sum);
    }

    @Test
    @DisplayName("sumHighRiskPatientCount → returns sum")
    void sumHighRiskPatientCount() {
        long sum = clinicRepository.sumHighRiskPatientCount();
        assertEquals(1, sum);
    }

    @Test
    @DisplayName("findByManagerId → returns clinics for manager")
    void findByManagerId() {
        List<Clinic> result = clinicRepository.findByManagerId(9999L);
        assertTrue(result.isEmpty());
    }
}