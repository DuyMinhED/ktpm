package com.project.mapper;

import com.project.dto.response.PrescriptionResponse;
import com.project.entity.Patient;
import com.project.entity.Prescription;
import com.project.entity.PrescriptionItem;
import com.project.entity.PrescriptionStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

public class PrescriptionMapperTest {

    private final PrescriptionMapper mapper = new PrescriptionMapper();

    @Test
    void toResponseDTO_activeStatus_success() {
        Patient patient = Patient.builder()
                .fullName("Nguyen Van A")
                .avatarUrl("http://avatar.url")
                .build();

        Prescription prescription = Prescription.builder()
                .id(1L)
                .prescriptionCode("RX-123")
                .patient(patient)
                .diagnosis("Flu")
                .status(PrescriptionStatus.ACTIVE)
                .items(Arrays.asList(new PrescriptionItem(), new PrescriptionItem()))
                .build();
        prescription.setCreatedAt(LocalDateTime.of(2026, 6, 27, 10, 0));

        PrescriptionResponse response = mapper.toResponseDTO(prescription);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("RX-123", response.getPrescriptionCode());
        assertEquals("Nguyen Van A", response.getPatientName());
        assertEquals("NA", response.getPatientInitial());
        assertEquals("Flu", response.getDiagnosis());
        assertEquals("Active", response.getStatus());
        assertEquals("emerald", response.getColorCode());
        assertEquals("http://avatar.url", response.getPatientAvatarUrl());
        assertEquals(2, response.getMedicationCount());
        assertEquals(LocalDateTime.of(2026, 6, 27, 10, 0), response.getCreatedAt());
    }

    @Test
    void toResponseDTO_expiredStatus_success() {
        Patient patient = Patient.builder()
                .fullName("Tran B")
                .build();

        Prescription prescription = Prescription.builder()
                .patient(patient)
                .status(PrescriptionStatus.EXPIRED)
                .items(Collections.emptyList())
                .build();

        PrescriptionResponse response = mapper.toResponseDTO(prescription);

        assertEquals("Expired", response.getStatus());
        assertEquals("slate", response.getColorCode());
        assertEquals("TB", response.getPatientInitial());
        assertEquals(0, response.getMedicationCount());
    }

    @Test
    void toResponseDTO_cancelledStatus_success() {
        Patient patient = Patient.builder()
                .fullName("Single")
                .build();

        Prescription prescription = Prescription.builder()
                .patient(patient)
                .status(PrescriptionStatus.CANCELLED)
                .build();

        PrescriptionResponse response = mapper.toResponseDTO(prescription);

        assertEquals("Cancelled", response.getStatus());
        assertEquals("red", response.getColorCode());
        assertEquals("S", response.getPatientInitial());
        assertEquals(0, response.getMedicationCount());
    }

    @Test
    void toResponseDTO_pendingRenewalStatus_success() {
        Patient patient = Patient.builder()
                .fullName("   multiple   spaces  here   ")
                .build();

        Prescription prescription = Prescription.builder()
                .patient(patient)
                .status(PrescriptionStatus.PENDING_RENEWAL)
                .build();

        PrescriptionResponse response = mapper.toResponseDTO(prescription);

        assertEquals("Pending Renewal", response.getStatus());
        assertEquals("orange", response.getColorCode());
        assertEquals("MH", response.getPatientInitial());
    }

    @Test
    void toResponseDTO_completedStatus_success() {
        Patient patient = Patient.builder()
                .fullName("")
                .build();

        Prescription prescription = Prescription.builder()
                .patient(patient)
                .status(PrescriptionStatus.COMPLETED)
                .build();

        PrescriptionResponse response = mapper.toResponseDTO(prescription);

        assertEquals("Completed", response.getStatus());
        assertEquals("emerald", response.getColorCode());
        assertEquals("", response.getPatientInitial());
    }

    @Test
    void toResponseDTO_nullName_success() {
        Patient patient = Patient.builder()
                .fullName(null)
                .build();

        Prescription prescription = Prescription.builder()
                .patient(patient)
                .status(PrescriptionStatus.ACTIVE)
                .build();

        PrescriptionResponse response = mapper.toResponseDTO(prescription);

        assertEquals("", response.getPatientInitial());
    }
}
