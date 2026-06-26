package com.project.service.impl;

import com.project.dto.request.LogMedicationRequest;
import com.project.entity.MedicationSchedule;
import com.project.entity.Notification;
import com.project.entity.Patient;
import com.project.entity.Prescription;
import com.project.entity.PrescriptionStatus;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.MedicationLogRepository;
import com.project.repository.MedicationScheduleRepository;
import com.project.repository.NotificationRepository;
import com.project.repository.PatientRepository;
import com.project.repository.PrescriptionRepository;
import com.project.util.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class PatientPrescriptionServiceImplTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private MedicationScheduleRepository medicationScheduleRepository;

    @Mock
    private MedicationLogRepository medicationLogRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private PatientPrescriptionServiceImpl patientPrescriptionService;

    private Patient currentPatient;
    private Patient otherPatient;
    private MedicationSchedule schedule;
    private Prescription prescription;
    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    @BeforeEach
    void setUp() {
        currentPatient = Patient.builder()
                .id(100L)
                .userId(1L)
                .fullName("Nguyen Van A")
                .build();

        otherPatient = Patient.builder()
                .id(200L)
                .userId(2L)
                .fullName("Tran Thi B")
                .build();

        schedule = MedicationSchedule.builder()
                .id(50L)
                .patient(currentPatient)
                .medicationName("Metformin")
                .dosage("500mg")
                .build();

        prescription = Prescription.builder()
                .id(10L)
                .doctorId(2L)
                .patient(currentPatient)
                .prescriptionCode("#RX-5678")
                .status(PrescriptionStatus.ACTIVE)
                .build();

        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    // --- logMedication (TC-WB-LM) ---

    @Test
    void logMedication_userNotAuthenticated_throwsException() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.empty());

        LogMedicationRequest request = LogMedicationRequest.builder()
                .scheduleId(50L)
                .status("TAKEN")
                .build();

        assertThrows(ResourceNotFoundException.class, () -> patientPrescriptionService.logMedication(request));
        verify(medicationLogRepository, never()).save(any());
    }

    @Test
    void logMedication_scheduleNotFound_throwsException() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));
        when(medicationScheduleRepository.findById(999L)).thenReturn(Optional.empty());

        LogMedicationRequest request = LogMedicationRequest.builder()
                .scheduleId(999L)
                .status("TAKEN")
                .build();

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> patientPrescriptionService.logMedication(request));
        assertTrue(ex.getMessage().contains("Schedule not found: 999"));
        verify(medicationLogRepository, never()).save(any());
    }

    @Test
    void logMedication_unauthorizedPatient_throwsException() {
        schedule.setPatient(otherPatient);

        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));
        when(medicationScheduleRepository.findById(50L)).thenReturn(Optional.of(schedule));

        LogMedicationRequest request = LogMedicationRequest.builder()
                .scheduleId(50L)
                .status("TAKEN")
                .build();

        assertThrows(RuntimeException.class, () -> patientPrescriptionService.logMedication(request));
        verify(medicationLogRepository, never()).save(any());
    }

    @Test
    void logMedication_success() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));
        when(medicationScheduleRepository.findById(50L)).thenReturn(Optional.of(schedule));

        LogMedicationRequest request = LogMedicationRequest.builder()
                .scheduleId(50L)
                .status("TAKEN")
                .notes("Taken after breakfast")
                .build();

        patientPrescriptionService.logMedication(request);

        verify(medicationLogRepository, times(1)).save(argThat(log ->
                log.getSchedule().getId().equals(50L)
                        && log.getPatient().getId().equals(100L)
                        && "TAKEN".equals(log.getStatus())
                        && "Taken after breakfast".equals(log.getNotes())
                        && log.getTakenAt() != null));
    }

    // --- requestRefill (TC-WB-RR) ---

    @Test
    void requestRefill_prescriptionNotFound_throwsException() {
        when(prescriptionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> patientPrescriptionService.requestRefill(999L));
        verify(prescriptionRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void requestRefill_success() {
        when(prescriptionRepository.findById(10L)).thenReturn(Optional.of(prescription));

        patientPrescriptionService.requestRefill(10L);

        assertEquals(PrescriptionStatus.PENDING_RENEWAL, prescription.getStatus());
        verify(prescriptionRepository, times(1)).save(prescription);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(captor.capture());
        Notification savedNotification = captor.getValue();
        assertEquals(2L, savedNotification.getUserId());
        assertEquals("Yêu cầu tái cấp thuốc", savedNotification.getTitle());
        assertTrue(savedNotification.getMessage().contains("Nguyen Van A"));
        assertTrue(savedNotification.getMessage().contains("#RX-5678"));
        assertEquals("/doctor/patients/100", savedNotification.getTargetUrl());
    }
}
