package com.project.service.impl;

import com.project.dto.response.RiskAlertResponse;
import com.project.entity.Appointment;
import com.project.entity.AppointmentStatus;
import com.project.entity.HealthMetric;
import com.project.entity.MetricType;
import com.project.entity.Patient;
import com.project.entity.PatientAlert;
import com.project.entity.User;
import com.project.repository.AppointmentRepository;
import com.project.repository.HealthMetricRepository;
import com.project.repository.PatientAlertRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RiskAlertServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PatientAlertRepository patientAlertRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private HealthMetricRepository healthMetricRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RiskAlertServiceImpl service;

    @Test
    @DisplayName("getRiskAlertDashboard - aggregates summary and maps high-risk patients and recent alerts")
    void getRiskAlertDashboard_success() {
        Patient patient = patient(1L, 10L, 9L);
        HealthMetric metric = metric(patient, "CRITICAL", LocalDateTime.now().minusHours(2));
        Appointment overdueAppointment = Appointment.builder()
                .id(99L)
                .patient(patient)
                .doctorId(9L)
                .appointmentTime(LocalDateTime.now().minusDays(1))
                .status(AppointmentStatus.SCHEDULED)
                .build();
        PatientAlert alert = alert(7L, patient, false);

        when(patientRepository.countByClinicIdAndIsDeletedFalse(10L)).thenReturn(10L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(10L), any(String.class)))
                .thenReturn(2L, 3L, 5L);
        when(healthMetricRepository.findPatientIdsInClinicWithNoMetricsSince(eq(10L), any(LocalDateTime.class)))
                .thenReturn(List.of(3L, 4L));
        when(appointmentRepository.countOverdueByClinicId(eq(10L), any(LocalDateTime.class))).thenReturn(1L);
        when(patientRepository.findByClinicIdAndFilters(eq(10L), eq(null), eq(null), any(String.class), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(patient)));
        when(healthMetricRepository.findRecentByPatientId(eq(1L), any(Pageable.class))).thenReturn(List.of(metric));
        when(userRepository.findById(9L)).thenReturn(Optional.of(User.builder().id(9L).fullName("Dr. Smith").build()));
        when(appointmentRepository.findNextAppointmentsByPatient(eq(10L), eq(1L), any(Pageable.class)))
                .thenReturn(List.of(overdueAppointment));
        when(patientAlertRepository.countUnreadAlertsByPatientId(1L)).thenReturn(4);
        when(patientAlertRepository.findRecentAlertsByClinic(eq(10L), any(Pageable.class))).thenReturn(List.of(alert));

        RiskAlertResponse response = service.getRiskAlertDashboard(10L);

        assertEquals(10L, response.getSummary().getTotalPatients());
        assertEquals(2L, response.getSummary().getHighRiskCount());
        assertEquals(3L, response.getSummary().getMediumRiskCount());
        assertEquals(5L, response.getSummary().getStableCount());
        assertEquals(2L, response.getSummary().getUnmonitoredCount());
        assertEquals(1L, response.getSummary().getOverdueAppointments());
        assertEquals(20.0, response.getSummary().getHighRiskPercentage());
        assertEquals(1, response.getHighRiskPatients().size());
        assertEquals("Dr. Smith", response.getHighRiskPatients().get(0).getDoctorName());
        assertEquals("CRITICAL", response.getHighRiskPatients().get(0).getLastMetricStatus());
        assertTrue(response.getHighRiskPatients().get(0).isAppointmentOverdue());
        assertEquals(4, response.getHighRiskPatients().get(0).getAlertCount());
        assertEquals(1, response.getRecentAlerts().size());
        assertEquals("Blood pressure", response.getRecentAlerts().get(0).getTitle());
    }

    @Test
    @DisplayName("getRiskAlertDashboard - zero total patients keeps percentage at zero")
    void getRiskAlertDashboard_zeroTotalBoundary() {
        when(patientRepository.countByClinicIdAndIsDeletedFalse(10L)).thenReturn(0L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(10L), any(String.class))).thenReturn(0L);
        when(healthMetricRepository.findPatientIdsInClinicWithNoMetricsSince(eq(10L), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(appointmentRepository.countOverdueByClinicId(eq(10L), any(LocalDateTime.class))).thenReturn(0L);
        when(patientRepository.findByClinicIdAndFilters(eq(10L), eq(null), eq(null), any(String.class), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(patientAlertRepository.findRecentAlertsByClinic(eq(10L), any(Pageable.class))).thenReturn(List.of());

        RiskAlertResponse response = service.getRiskAlertDashboard(10L);

        assertEquals(0.0, response.getSummary().getHighRiskPercentage());
        assertTrue(response.getHighRiskPatients().isEmpty());
        assertTrue(response.getRecentAlerts().isEmpty());
    }

    @Test
    @DisplayName("getHighRiskPatients - maps patient without doctor, metric, or next appointment")
    void getHighRiskPatients_missingOptionalData() {
        Patient patient = patient(2L, 10L, null);
        when(patientRepository.findByClinicIdAndFilters(eq(10L), eq(null), eq(null), any(String.class), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(patient)));
        when(healthMetricRepository.findRecentByPatientId(eq(2L), any(Pageable.class))).thenReturn(List.of());
        when(appointmentRepository.findNextAppointmentsByPatient(eq(10L), eq(2L), any(Pageable.class))).thenReturn(List.of());
        when(patientAlertRepository.countUnreadAlertsByPatientId(2L)).thenReturn(0);

        Page<RiskAlertResponse.RiskPatientItem> page = service.getHighRiskPatients(10L, PageRequest.of(0, 5));

        RiskAlertResponse.RiskPatientItem item = page.getContent().get(0);
        assertEquals(2L, item.getPatientId());
        assertEquals("Chưa phân công", item.getDoctorName());
        assertTrue(item.getLastMetricStatus().contains("Chưa"));
        assertNull(item.getLastMetricDate());
        assertNull(item.getNextAppointment());
        assertFalse(item.isAppointmentOverdue());
    }

    @Test
    @DisplayName("dismissAlert - marks existing alert dismissed and ignores null/missing ids")
    void dismissAlert_boundaries() {
        PatientAlert alert = alert(8L, patient(3L, 10L, null), false);
        when(patientAlertRepository.findById(8L)).thenReturn(Optional.of(alert));
        when(patientAlertRepository.findById(404L)).thenReturn(Optional.empty());

        service.dismissAlert(8L);
        service.dismissAlert(404L);
        service.dismissAlert(null);

        assertTrue(alert.isDismissed());
        verify(patientAlertRepository).save(alert);
        verify(patientAlertRepository, never()).findById(null);
    }

    @Test
    @DisplayName("markAlertAsRead - marks existing alert read and ignores null")
    void markAlertAsRead_boundaries() {
        PatientAlert alert = alert(9L, patient(4L, 10L, null), false);
        when(patientAlertRepository.findById(9L)).thenReturn(Optional.of(alert));

        service.markAlertAsRead(9L);

        assertTrue(alert.isRead());
        verify(patientAlertRepository).save(alert);
    }

    @Test
    @DisplayName("markAlertAsRead - null id does not touch repository")
    void markAlertAsRead_nullId() {
        service.markAlertAsRead(null);

        verifyNoInteractions(patientAlertRepository);
    }

    private static Patient patient(Long id, Long clinicId, Long doctorId) {
        return Patient.builder()
                .id(id)
                .userId(id + 100)
                .clinicId(clinicId)
                .doctorId(doctorId)
                .fullName("Patient " + id)
                .patientCode("P" + id)
                .avatarUrl("avatar-" + id + ".png")
                .phone("090000000" + id)
                .gender("M")
                .chronicCondition("Diabetes")
                .riskLevel("High")
                .build();
    }

    private static HealthMetric metric(Patient patient, String status, LocalDateTime measuredAt) {
        return HealthMetric.builder()
                .id(5L)
                .patient(patient)
                .metricType(MetricType.BLOOD_SUGAR)
                .value(BigDecimal.valueOf(180))
                .unit("mg/dL")
                .status(status)
                .measuredAt(measuredAt)
                .build();
    }

    private static PatientAlert alert(Long id, Patient patient, boolean read) {
        return PatientAlert.builder()
                .id(id)
                .patient(patient)
                .alertType("HEALTH_WARNING")
                .severity("CRITICAL")
                .title("Blood pressure")
                .message("Needs review")
                .isRead(read)
                .isDismissed(false)
                .createdAt(LocalDateTime.of(2026, 7, 2, 10, 0))
                .build();
    }
}
