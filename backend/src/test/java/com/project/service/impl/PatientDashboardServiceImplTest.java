package com.project.service.impl;

import com.project.dto.response.*;
import com.project.entity.Patient;
import com.project.entity.PatientAlert;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.MessageRepository;
import com.project.repository.PatientAlertRepository;
import com.project.repository.PatientRepository;
import com.project.service.*;
import com.project.util.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class PatientDashboardServiceImplTest {

    @Mock
    private PatientProfileService profileService;

    @Mock
    private PatientHealthMetricService healthMetricService;

    @Mock
    private PatientPrescriptionService prescriptionService;

    @Mock
    private PatientAppointmentService appointmentService;

    @Mock
    private PatientMessageService messageService;

    @Mock
    private PatientAlertRepository alertRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private MessageRepository messageRepository;

    @InjectMocks
    private PatientDashboardServiceImpl dashboardService;

    private Patient samplePatient;
    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    @BeforeEach
    void setUp() {
        samplePatient = Patient.builder()
                .id(100L)
                .userId(1L)
                .fullName("John Doe")
                .email("patient@example.com")
                .build();

        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    @Test
    void getDashboard_success() {
        // Setup static mock
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));
        
        PatientProfileResponse profileResponse = PatientProfileResponse.builder().id(100L).fullName("John Doe").build();
        when(profileService.getCurrentPatientProfile()).thenReturn(profileResponse);
        
        when(healthMetricService.getMetricsSummary("WEEK")).thenReturn(Collections.emptyList());
        when(prescriptionService.getTodaySchedule()).thenReturn(Collections.emptyList());
        when(appointmentService.getUpcoming()).thenReturn(Collections.emptyList());
        
        when(alertRepository.findByPatientIdAndIsDismissedFalseOrderByCreatedAtDesc(100L))
                .thenReturn(Collections.emptyList());
        
        when(messageService.getConversations()).thenReturn(Collections.emptyList());

        PatientDashboardResponse response = dashboardService.getDashboard();

        assertNotNull(response);
        assertEquals("John Doe", response.getProfile().getFullName());
        assertTrue(response.getHealthMetrics().isEmpty());
        assertTrue(response.getTodayMedications().isEmpty());
        assertNull(response.getNextAppointment());
        assertTrue(response.getAlerts().isEmpty());
    }

    @Test
    void getAlerts_success() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));

        PatientAlert alert = PatientAlert.builder()
                .id(1L)
                .alertType("HEALTH")
                .severity("HIGH")
                .title("High BP")
                .message("BP is too high")
                .isDismissed(false)
                .patient(samplePatient)
                .build();

        when(alertRepository.findByPatientIdAndIsDismissedFalseOrderByCreatedAtDesc(100L))
                .thenReturn(List.of(alert));

        List<PatientAlertResponse> alerts = dashboardService.getAlerts();

        assertNotNull(alerts);
        assertEquals(1, alerts.size());
        assertEquals("High BP", alerts.get(0).getTitle());
    }

    @Test
    void dismissAlert_success() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));

        PatientAlert alert = PatientAlert.builder()
                .id(1L)
                .alertType("HEALTH")
                .severity("HIGH")
                .title("High BP")
                .message("BP is too high")
                .isDismissed(false)
                .patient(samplePatient)
                .build();

        when(alertRepository.findById(1L)).thenReturn(Optional.of(alert));
        when(alertRepository.save(any(PatientAlert.class))).thenReturn(alert);

        assertDoesNotThrow(() -> dashboardService.dismissAlert(1L));

        assertTrue(alert.isDismissed());
        verify(alertRepository, times(1)).save(alert);
    }

    @Test
    void dismissAlert_notFound() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));

        when(alertRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> dashboardService.dismissAlert(999L));
    }

    @Test
    void dismissAlert_accessDenied() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));

        Patient otherPatient = Patient.builder().id(200L).build();
        PatientAlert alert = PatientAlert.builder()
                .id(1L)
                .patient(otherPatient)
                .build();

        when(alertRepository.findById(1L)).thenReturn(Optional.of(alert));

        assertThrows(org.springframework.security.access.AccessDeniedException.class, 
                () -> dashboardService.dismissAlert(1L));
    }
}
