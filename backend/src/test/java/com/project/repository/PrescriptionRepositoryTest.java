package com.project.repository;

import com.project.entity.Patient;
import com.project.entity.Prescription;
import com.project.entity.PrescriptionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
public class PrescriptionRepositoryTest {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private PatientRepository patientRepository;

    private Patient patientA;
    private Patient patientB;
    private Prescription prescription1;
    private Prescription prescription2;
    private Prescription prescription3;

    @BeforeEach
    void setUp() {
        prescriptionRepository.deleteAll();
        patientRepository.deleteAll();

        patientA = Patient.builder()
                .userId(10L)
                .fullName("Nguyen Van A")
                .phone("0123456789")
                .gender("MALE")
                .build();
        patientA = patientRepository.save(patientA);

        patientB = Patient.builder()
                .userId(11L)
                .fullName("Tran Thi B")
                .phone("0987654321")
                .gender("FEMALE")
                .build();
        patientB = patientRepository.save(patientB);

        prescription1 = Prescription.builder()
                .prescriptionCode("RX-1111")
                .doctorId(100L)
                .patient(patientA)
                .diagnosis("Sot sieu vi")
                .status(PrescriptionStatus.ACTIVE)
                .build();
        prescription1.setCreatedAt(LocalDateTime.now().minusDays(1));
        prescription1 = prescriptionRepository.save(prescription1);

        prescription2 = Prescription.builder()
                .prescriptionCode("RX-2222")
                .doctorId(100L)
                .patient(patientB)
                .diagnosis("Cao huyet ap")
                .status(PrescriptionStatus.COMPLETED)
                .build();
        prescription2.setCreatedAt(LocalDateTime.now());
        prescription2 = prescriptionRepository.save(prescription2);

        prescription3 = Prescription.builder()
                .prescriptionCode("RX-3333")
                .doctorId(200L)
                .patient(patientA)
                .diagnosis("Dau da day")
                .status(PrescriptionStatus.PENDING_RENEWAL)
                .build();
        prescription3.setCreatedAt(LocalDateTime.now().plusDays(1));
        prescription3 = prescriptionRepository.save(prescription3);
    }

    @Test
    void findByDoctorIdAndSearchTerm_byPatientName_success() {
        Page<Prescription> result = prescriptionRepository.findByDoctorIdAndSearchTerm(
                100L, "nguyen", PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("RX-1111", result.getContent().get(0).getPrescriptionCode());
    }

    @Test
    void findByDoctorIdAndSearchTerm_byCode_success() {
        Page<Prescription> result = prescriptionRepository.findByDoctorIdAndSearchTerm(
                100L, "2222", PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("RX-2222", result.getContent().get(0).getPrescriptionCode());
    }

    @Test
    void findByDoctorIdAndStatus_success() {
        Page<Prescription> result = prescriptionRepository.findByDoctorIdAndStatus(
                100L, PrescriptionStatus.ACTIVE, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("RX-1111", result.getContent().get(0).getPrescriptionCode());
    }

    @Test
    void findByDoctorId_success() {
        Page<Prescription> result = prescriptionRepository.findByDoctorId(
                100L, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
    }

    @Test
    void countByDoctorId_success() {
        long count = prescriptionRepository.countByDoctorId(100L);
        assertEquals(2, count);

        long countNotExist = prescriptionRepository.countByDoctorId(999L);
        assertEquals(0, countNotExist);
    }

    @Test
    void countByDoctorIdAndStatus_success() {
        long countActive = prescriptionRepository.countByDoctorIdAndStatus(100L, PrescriptionStatus.ACTIVE);
        assertEquals(1, countActive);

        long countCompleted = prescriptionRepository.countByDoctorIdAndStatus(100L, PrescriptionStatus.COMPLETED);
        assertEquals(1, countCompleted);

        long countCancelled = prescriptionRepository.countByDoctorIdAndStatus(100L, PrescriptionStatus.CANCELLED);
        assertEquals(0, countCancelled);
    }

    @Test
    void findByPatientIdAndStatus_success() {
        List<Prescription> result = prescriptionRepository.findByPatientIdAndStatus(
                patientA.getId(), PrescriptionStatus.ACTIVE);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("RX-1111", result.get(0).getPrescriptionCode());
    }

    @Test
    void findByPatientIdAndStatusNot_success() {
        List<Prescription> result = prescriptionRepository.findByPatientIdAndStatusNot(
                patientA.getId(), PrescriptionStatus.ACTIVE);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("RX-3333", result.get(0).getPrescriptionCode());
    }

    @Test
    void findByPatientIdOrderByCreatedAtDesc_success() {
        List<Prescription> result = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientA.getId());

        assertNotNull(result);
        assertEquals(2, result.size());
        // prescription3 is newer (plusDays(1)) than prescription1 (minusDays(1))
        assertEquals("RX-3333", result.get(0).getPrescriptionCode());
        assertEquals("RX-1111", result.get(1).getPrescriptionCode());
    }
}
