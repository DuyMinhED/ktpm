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
                .doctorCount(5)
                .patientCount(50)
                .highRiskPatientCount(3)
                .build();
        entityManager.persistAndFlush(sampleClinic);
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
        assertTrue(sum >= 5);
    }

    @Test
    @DisplayName("sumPatientCount → returns sum")
    void sumPatientCount() {
        long sum = clinicRepository.sumPatientCount();
        assertTrue(sum >= 50);
    }

    @Test
    @DisplayName("sumHighRiskPatientCount → returns sum")
    void sumHighRiskPatientCount() {
        long sum = clinicRepository.sumHighRiskPatientCount();
        assertTrue(sum >= 3);
    }

    @Test
    @DisplayName("findByManagerId → returns clinics for manager")
    void findByManagerId() {
        List<Clinic> result = clinicRepository.findByManagerId(9999L);
        assertTrue(result.isEmpty());
    }
}