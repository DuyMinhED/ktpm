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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
public class PrescriptionServiceTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private NotificationService notificationService;

    private PrescriptionMapper prescriptionMapper = new PrescriptionMapper();

    private PrescriptionServiceImpl prescriptionService;

    private Patient samplePatient;
    private Prescription samplePrescription;
    private PrescriptionItem samplePrescriptionItem;
    private PrescriptionRequest sampleRequest;
    private PrescriptionItemRequest sampleItemRequest;

    @BeforeEach
    void setUp() {
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
                .avatarUrl("avatar.png")
                .build();

        samplePrescriptionItem = PrescriptionItem.builder()
                .id(1L)
                .medicationName("Paracetamol")
                .dosage("500mg")
                .usageInstructions("Uong sau khi an")
                .build();

        samplePrescription = Prescription.builder()
                .id(1L)
                .prescriptionCode("RX-1234")
                .doctorId(2L)
                .patient(samplePatient)
                .diagnosis("Sot sieu vi")
                .status(PrescriptionStatus.ACTIVE)
                .notes("Nghi ngoi nhieu")
                .items(new ArrayList<>(Collections.singletonList(samplePrescriptionItem)))
                .build();
        samplePrescriptionItem.setPrescription(samplePrescription);

        sampleItemRequest = new PrescriptionItemRequest();
        sampleItemRequest.setMedicationName("Paracetamol");
        sampleItemRequest.setDosage("500mg");
        sampleItemRequest.setUsageInstructions("Uong sau khi an");

        sampleRequest = new PrescriptionRequest();
        sampleRequest.setPatientId(1L);
        sampleRequest.setDiagnosis("Sot sieu vi");
        sampleRequest.setNotes("Nghi ngoi nhieu");
        sampleRequest.setItems(Collections.singletonList(sampleItemRequest));
    }

    @Test
    void getDoctorPrescriptions_searchNotEmpty_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Prescription> page = new PageImpl<>(Collections.singletonList(samplePrescription));
        when(prescriptionRepository.findByDoctorIdAndSearchTerm(eq(2L), eq("Nguyen"), eq(pageable))).thenReturn(page);

        Page<PrescriptionResponse> result = prescriptionService.getDoctorPrescriptions(2L, "Nguyen", null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Nguyen Van A", result.getContent().get(0).getPatientName());
        assertEquals("Active", result.getContent().get(0).getStatus());
        verify(prescriptionRepository, times(1)).findByDoctorIdAndSearchTerm(any(), any(), any());
    }

    @Test
    void getDoctorPrescriptions_statusNotEmptyAndNotAll_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Prescription> page = new PageImpl<>(Collections.singletonList(samplePrescription));
        when(prescriptionRepository.findByDoctorIdAndStatus(eq(2L), eq(PrescriptionStatus.ACTIVE), eq(pageable))).thenReturn(page);

        Page<PrescriptionResponse> result = prescriptionService.getDoctorPrescriptions(2L, null, "ACTIVE", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(prescriptionRepository, times(1)).findByDoctorIdAndStatus(any(), any(), any());
    }

    @Test
    void getDoctorPrescriptions_default_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Prescription> page = new PageImpl<>(Collections.singletonList(samplePrescription));
        when(prescriptionRepository.findByDoctorId(eq(2L), eq(pageable))).thenReturn(page);

        Page<PrescriptionResponse> result = prescriptionService.getDoctorPrescriptions(2L, null, "ALL", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(prescriptionRepository, times(1)).findByDoctorId(any(), any());
    }

    @Test
    void getPrescriptionStats_success() {
        when(prescriptionRepository.countByDoctorId(2L)).thenReturn(10L);
        when(prescriptionRepository.countByDoctorIdAndStatus(2L, PrescriptionStatus.ACTIVE)).thenReturn(5L);
        when(prescriptionRepository.countByDoctorIdAndStatus(2L, PrescriptionStatus.PENDING_RENEWAL)).thenReturn(2L);
        when(prescriptionRepository.countByDoctorIdAndStatus(2L, PrescriptionStatus.COMPLETED)).thenReturn(3L);

        PrescriptionStatsResponse result = prescriptionService.getPrescriptionStats(2L);

        assertNotNull(result);
        assertEquals(10, result.getTotalPrescriptions());
        assertEquals(5, result.getActivePrescriptions());
        assertEquals(2, result.getPendingRenewals());
        assertEquals(3, result.getCompletedPrescriptions());
        assertEquals(30.0, result.getRecoveryRate());
    }

    @Test
    void createPrescription_success() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(prescriptionRepository.save(any(Prescription.class))).thenReturn(samplePrescription);

        PrescriptionResponse result = prescriptionService.createPrescription(2L, sampleRequest);

        assertNotNull(result);
        assertEquals("Nguyen Van A", result.getPatientName());
        verify(patientRepository, times(1)).findById(1L);
        verify(prescriptionRepository, times(1)).save(any(Prescription.class));
        verify(notificationService, times(1)).sendNotification(eq(100L), any(), any(), eq("prescription"), eq("/patient/profile"));
    }

    @Test
    void createPrescription_patientNotFound_throwsException() {
        when(patientRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> prescriptionService.createPrescription(2L, sampleRequest));
        verify(prescriptionRepository, never()).save(any(Prescription.class));
    }

    @Test
    void cancelPrescription_success() {
        when(prescriptionRepository.findById(1L)).thenReturn(Optional.of(samplePrescription));
        when(prescriptionRepository.save(any(Prescription.class))).thenReturn(samplePrescription);

        prescriptionService.cancelPrescription(1L, 2L);

        assertEquals(PrescriptionStatus.CANCELLED, samplePrescription.getStatus());
        verify(prescriptionRepository, times(1)).findById(1L);
        verify(prescriptionRepository, times(1)).save(samplePrescription);
    }

    @Test
    void cancelPrescription_unauthorized_throwsException() {
        when(prescriptionRepository.findById(1L)).thenReturn(Optional.of(samplePrescription));

        assertThrows(RuntimeException.class, () -> prescriptionService.cancelPrescription(1L, 99L));
        verify(prescriptionRepository, never()).save(any(Prescription.class));
    }

    @Test
    void cancelPrescription_notFound_throwsException() {
        when(prescriptionRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> prescriptionService.cancelPrescription(1L, 2L));
        verify(prescriptionRepository, never()).save(any(Prescription.class));
    }
}
