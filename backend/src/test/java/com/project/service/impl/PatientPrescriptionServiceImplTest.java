package com.project.service.impl;

import com.project.dto.request.LogMedicationRequest;
import com.project.dto.response.MedicationScheduleResponse;
import com.project.dto.response.PatientPrescriptionResponse;
import com.project.entity.MedicationLog;
import com.project.entity.MedicationSchedule;
import com.project.entity.Notification;
import com.project.entity.Patient;
import com.project.entity.Prescription;
import com.project.entity.PrescriptionItem;
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
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
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
                .scheduledTime(LocalTime.of(8, 0))
                .frequency("DAILY")
                .instructions("After meal")
                .startDate(LocalDate.now().minusDays(2))
                .endDate(LocalDate.now().plusDays(5))
                .build();

        prescription = Prescription.builder()
                .id(10L)
                .doctorId(2L)
                .patient(currentPatient)
                .prescriptionCode("#RX-5678")
                .diagnosis("Diabetes")
                .status(PrescriptionStatus.ACTIVE)
                .build();
        prescription.setCreatedAt(LocalDateTime.of(2026, 7, 1, 9, 0));
        prescription.addItem(PrescriptionItem.builder()
                .id(77L)
                .medicationName("Metformin")
                .dosage("500mg")
                .usageInstructions("Twice daily")
                .build());

        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    // --- logMedication (TC-WB-LM) ---

    @Test
    void getActivePrescriptions_success_mapsItemsAndCreatedDate() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));
        when(prescriptionRepository.findByPatientIdAndStatus(100L, PrescriptionStatus.ACTIVE))
                .thenReturn(List.of(prescription));

        List<PatientPrescriptionResponse> responses = patientPrescriptionService.getActivePrescriptions();

        assertEquals(1, responses.size());
        PatientPrescriptionResponse response = responses.get(0);
        assertEquals(10L, response.getId());
        assertEquals("#RX-5678", response.getPrescriptionCode());
        assertEquals("Diabetes", response.getDiagnosis());
        assertEquals("ACTIVE", response.getStatus());
        assertEquals(LocalDate.of(2026, 7, 1), response.getCreatedDate());
        assertEquals(1, response.getItems().size());
        assertEquals("Metformin", response.getItems().get(0).getMedicationName());
        assertEquals("Twice daily", response.getItems().get(0).getUsageInstructions());
    }

    @Test
    void getPrescriptionHistory_success_excludesActiveStatus() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));
        prescription.setStatus(PrescriptionStatus.COMPLETED);
        prescription.setCreatedAt(null);
        when(prescriptionRepository.findByPatientIdAndStatusNot(100L, PrescriptionStatus.ACTIVE))
                .thenReturn(List.of(prescription));

        List<PatientPrescriptionResponse> responses = patientPrescriptionService.getPrescriptionHistory();

        assertEquals(1, responses.size());
        assertEquals("COMPLETED", responses.get(0).getStatus());
        assertNull(responses.get(0).getCreatedDate());
        verify(prescriptionRepository).findByPatientIdAndStatusNot(100L, PrescriptionStatus.ACTIVE);
    }

    @Test
    void getTodaySchedule_mapsTakenPendingUpcomingAndRemainingDays() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));

        MedicationSchedule takenSchedule = schedule;
        MedicationSchedule pendingSchedule = MedicationSchedule.builder()
                .id(51L)
                .patient(currentPatient)
                .medicationName("Aspirin")
                .dosage("81mg")
                .scheduledTime(LocalTime.now().minusMinutes(5))
                .frequency("DAILY")
                .instructions("Morning")
                .startDate(LocalDate.now().minusDays(2))
                .endDate(LocalDate.now().minusDays(1))
                .build();
        MedicationSchedule upcomingSchedule = MedicationSchedule.builder()
                .id(52L)
                .patient(currentPatient)
                .medicationName("Vitamin D")
                .dosage("1000IU")
                .scheduledTime(LocalTime.now().plusMinutes(5))
                .frequency("DAILY")
                .instructions("Noon")
                .startDate(LocalDate.now())
                .endDate(null)
                .build();
        MedicationSchedule missedSchedule = MedicationSchedule.builder()
                .id(53L)
                .patient(currentPatient)
                .medicationName("Omega 3")
                .dosage("1 capsule")
                .scheduledTime(LocalTime.now().minusMinutes(10))
                .frequency("DAILY")
                .instructions("Evening")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(2))
                .build();
        MedicationLog takenLog = MedicationLog.builder()
                .id(1L)
                .schedule(takenSchedule)
                .patient(currentPatient)
                .status("TAKEN")
                .takenAt(LocalDateTime.of(2026, 7, 3, 8, 30))
                .build();
        MedicationLog missedLog = MedicationLog.builder()
                .id(2L)
                .schedule(missedSchedule)
                .patient(currentPatient)
                .status("MISSED")
                .build();

        when(medicationScheduleRepository.findByPatientIdAndIsActiveTrueOrderByScheduledTimeAsc(100L))
                .thenReturn(List.of(takenSchedule, pendingSchedule, upcomingSchedule, missedSchedule));
        when(medicationLogRepository.findByPatientIdAndCreatedAtBetween(eq(100L), any(), any()))
                .thenReturn(List.of(takenLog, missedLog));

        List<MedicationScheduleResponse> responses = patientPrescriptionService.getTodaySchedule();

        assertEquals(4, responses.size());
        assertEquals("TAKEN", responses.get(0).getTodayStatus());
        assertEquals("08:30", responses.get(0).getTakenAt());
        assertEquals(5, responses.get(0).getRemainingDays());
        assertEquals("PENDING", responses.get(1).getTodayStatus());
        assertEquals(0, responses.get(1).getRemainingDays());
        assertEquals("UPCOMING", responses.get(2).getTodayStatus());
        assertEquals("PENDING", responses.get(3).getTodayStatus());
        assertNull(responses.get(3).getTakenAt());
    }

    @Test
    void getCurrentPatient_patientProfileNotFound_throwsException() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> patientPrescriptionService.getActivePrescriptions());
    }

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
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(prescriptionRepository.findById(10L)).thenReturn(Optional.of(prescription));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));

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

    @Test
    void requestRefill_otherPatientsPrescription_isDenied() {
        prescription.setPatient(otherPatient);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(prescriptionRepository.findById(10L)).thenReturn(Optional.of(prescription));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));

        assertThrows(AccessDeniedException.class, () -> patientPrescriptionService.requestRefill(10L));

        verify(prescriptionRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void requestRefill_nullPatientPrescription_isDenied() {
        prescription.setPatient(null);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(prescriptionRepository.findById(10L)).thenReturn(Optional.of(prescription));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));

        assertThrows(AccessDeniedException.class, () -> patientPrescriptionService.requestRefill(10L));

        verify(prescriptionRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void requestRefill_inactivePrescription_isRejected() {
        prescription.setStatus(PrescriptionStatus.CANCELLED);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(prescriptionRepository.findById(10L)).thenReturn(Optional.of(prescription));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(currentPatient));

        assertThrows(IllegalStateException.class, () -> patientPrescriptionService.requestRefill(10L));

        verify(prescriptionRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }
}
