package com.project.service.impl;

import com.project.dto.request.PrescriptionItemRequest;
import com.project.dto.request.PrescriptionRequest;
import com.project.dto.response.PrescriptionResponse;
import com.project.dto.response.PrescriptionStatsResponse;
import com.project.entity.Patient;
import com.project.entity.Prescription;
import com.project.entity.PrescriptionItem;
import com.project.entity.PrescriptionStatus;
import com.project.exception.ResourceNotFoundException;
import com.project.mapper.PrescriptionMapper;
import com.project.repository.PatientRepository;
import com.project.repository.PrescriptionRepository;
import com.project.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PrescriptionServiceImplTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private NotificationService notificationService;

    // Use a real instance of PrescriptionMapper to avoid Mockito Inline issues under Java 24
    private PrescriptionMapper prescriptionMapper;

    private PrescriptionServiceImpl prescriptionService;

    private Patient samplePatient;
    private Prescription samplePrescription;
    private PrescriptionRequest sampleRequest;

    @BeforeEach
    void setUp() {
        prescriptionMapper = new PrescriptionMapper();
        prescriptionService = new PrescriptionServiceImpl(
                prescriptionRepository,
                patientRepository,
                prescriptionMapper,
                notificationService
        );

        samplePatient = Patient.builder()
                .id(1L)
                .userId(100L)
                .fullName("Nguyen Van A")
                .avatarUrl("avatar_url")
                .build();

        samplePrescription = Prescription.builder()
                .id(10L)
                .doctorId(2L)
                .patient(samplePatient)
                .diagnosis("Cold")
                .status(PrescriptionStatus.ACTIVE)
                .notes("Take rest")
                .prescriptionCode("#RX-1234")
                .build();
        samplePrescription.setCreatedAt(LocalDateTime.now());

        sampleRequest = new PrescriptionRequest();
        sampleRequest.setPatientId(1L);
sampleRequest.setDiagnosis("Cold");
        sampleRequest.setNotes("Take rest");
        
        PrescriptionItemRequest itemRequest = new PrescriptionItemRequest();
        itemRequest.setMedicationName("Paracetamol");
        itemRequest.setDosage("500mg");
        itemRequest.setUsageInstructions("Take twice a day");
        sampleRequest.setItems(List.of(itemRequest));
    }

    @Test
    void getDoctorPrescriptions_withSearch_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Prescription> page = new PageImpl<>(Collections.singletonList(samplePrescription));

        when(prescriptionRepository.findByDoctorIdAndSearchTerm(2L, "Nguyen", pageable)).thenReturn(page);

        Page<PrescriptionResponse> result = prescriptionService.getDoctorPrescriptions(2L, "Nguyen", null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Nguyen Van A", result.getContent().get(0).getPatientName());
        assertEquals("#RX-1234", result.getContent().get(0).getPrescriptionCode());
        verify(prescriptionRepository, times(1)).findByDoctorIdAndSearchTerm(2L, "Nguyen", pageable);
        verify(prescriptionRepository, never()).findByDoctorIdAndStatus(any(), any(), any());
        verify(prescriptionRepository, never()).findByDoctorId(any(), any());
    }

    @Test
    void getDoctorPrescriptions_withStatus_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Prescription> page = new PageImpl<>(Collections.singletonList(samplePrescription));

        when(prescriptionRepository.findByDoctorIdAndStatus(2L, PrescriptionStatus.ACTIVE, pageable)).thenReturn(page);

        Page<PrescriptionResponse> result = prescriptionService.getDoctorPrescriptions(2L, "", "ACTIVE", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Nguyen Van A", result.getContent().get(0).getPatientName());
        verify(prescriptionRepository, times(1)).findByDoctorIdAndStatus(2L, PrescriptionStatus.ACTIVE, pageable);
        verify(prescriptionRepository, never()).findByDoctorIdAndSearchTerm(any(), any(), any());
        verify(prescriptionRepository, never()).findByDoctorId(any(), any());
    }

    @Test
    void getDoctorPrescriptions_all_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Prescription> page = new PageImpl<>(Collections.singletonList(samplePrescription));

        when(prescriptionRepository.findByDoctorId(2L, pageable)).thenReturn(page);

        Page<PrescriptionResponse> result1 = prescriptionService.getDoctorPrescriptions(2L, null, "ALL", pageable);
        Page<PrescriptionResponse> result2 = prescriptionService.getDoctorPrescriptions(2L, "", "", pageable);

        assertNotNull(result1);
        assertNotNull(result2);
        verify(prescriptionRepository, times(2)).findByDoctorId(2L, pageable);
    }

    @Test
    void getPrescriptionStats_success() {
when(prescriptionRepository.countByDoctorId(2L)).thenReturn(10L);
        when(prescriptionRepository.countByDoctorIdAndStatus(2L, PrescriptionStatus.ACTIVE)).thenReturn(5L);
        when(prescriptionRepository.countByDoctorIdAndStatus(2L, PrescriptionStatus.PENDING_RENEWAL)).thenReturn(2L);
        when(prescriptionRepository.countByDoctorIdAndStatus(2L, PrescriptionStatus.COMPLETED)).thenReturn(3L);

        PrescriptionStatsResponse stats = prescriptionService.getPrescriptionStats(2L);

        assertNotNull(stats);
        assertEquals(10, stats.getTotalPrescriptions());
        assertEquals(5, stats.getActivePrescriptions());
        assertEquals(2, stats.getPendingRenewals());
        assertEquals(3, stats.getCompletedPrescriptions());
        assertEquals(30.0, stats.getRecoveryRate()); // (3/10) * 100
    }

    @Test
    void getPrescriptionStats_zeroTotal_success() {
        when(prescriptionRepository.countByDoctorId(2L)).thenReturn(0L);

        PrescriptionStatsResponse stats = prescriptionService.getPrescriptionStats(2L);

        assertNotNull(stats);
        assertEquals(0, stats.getTotalPrescriptions());
        assertEquals(0.0, stats.getRecoveryRate());
    }

    @Test
    void createPrescription_patientNotFound_throwsException() {
        when(patientRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> prescriptionService.createPrescription(2L, sampleRequest));
        verify(prescriptionRepository, never()).save(any());
        verify(notificationService, never()).sendNotification(any(), any(), any(), any(), any());
    }

    @Test
    void createPrescription_withPatientUserId_success() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(prescriptionRepository.save(any(Prescription.class))).thenReturn(samplePrescription);

        PrescriptionResponse response = prescriptionService.createPrescription(2L, sampleRequest);

        assertNotNull(response);
        assertEquals("#RX-1234", response.getPrescriptionCode());
        verify(prescriptionRepository, times(1)).save(any(Prescription.class));
        verify(notificationService, times(1)).sendNotification(
                eq(100L),
                contains("Đơn thuốc mới:"),
                anyString(),
                eq("prescription"),
                eq("/patient/profile")
        );
    }

    @Test
    void createPrescription_nullPatientUserId_success() {
        samplePatient.setUserId(null);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(prescriptionRepository.save(any(Prescription.class))).thenReturn(samplePrescription);

        PrescriptionResponse response = prescriptionService.createPrescription(2L, sampleRequest);

        assertNotNull(response);
        verify(prescriptionRepository, times(1)).save(any(Prescription.class));
verify(notificationService, never()).sendNotification(any(), any(), any(), any(), any());
    }

    @Test
    void cancelPrescription_success() {
        when(prescriptionRepository.findById(10L)).thenReturn(Optional.of(samplePrescription));

        prescriptionService.cancelPrescription(10L, 2L);

        assertEquals(PrescriptionStatus.CANCELLED, samplePrescription.getStatus());
        verify(prescriptionRepository, times(1)).save(samplePrescription);
    }

    @Test
    void cancelPrescription_notFound_throwsException() {
        when(prescriptionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> prescriptionService.cancelPrescription(99L, 2L));
        verify(prescriptionRepository, never()).save(any());
    }

    @Test
    void cancelPrescription_unauthorized_throwsException() {
        when(prescriptionRepository.findById(10L)).thenReturn(Optional.of(samplePrescription));

        assertThrows(RuntimeException.class, () -> prescriptionService.cancelPrescription(10L, 999L));
        verify(prescriptionRepository, never()).save(any());
    }
}