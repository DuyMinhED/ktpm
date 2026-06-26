package com.project.service.impl;

import com.project.dto.response.RiskAlertResponse;
import com.project.entity.Appointment;
import com.project.entity.HealthMetric;
import com.project.entity.Patient;
import com.project.entity.PatientAlert;
import com.project.entity.User;
import com.project.repository.AppointmentRepository;
import com.project.repository.HealthMetricRepository;
import com.project.repository.PatientAlertRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
    private RiskAlertServiceImpl riskAlertService;

    @Test
    void dismissAlert_nullId_doesNothing() {
        riskAlertService.dismissAlert(null);
        verifyNoInteractions(patientAlertRepository);
    }

    @Test
    void dismissAlert_alertNotFound_doesNotSave() {
        when(patientAlertRepository.findById(999L)).thenReturn(Optional.empty());

        riskAlertService.dismissAlert(999L);

        verify(patientAlertRepository, times(1)).findById(999L);
        verify(patientAlertRepository, never()).save(any());
    }

    @Test
    void dismissAlert_alertFound_setsDismissedAndSaves() {
        PatientAlert alert = new PatientAlert();
        alert.setId(1L);
        alert.setDismissed(false);

        when(patientAlertRepository.findById(1L)).thenReturn(Optional.of(alert));
        when(patientAlertRepository.save(any(PatientAlert.class))).thenReturn(alert);

        riskAlertService.dismissAlert(1L);

        assertTrue(alert.isDismissed());
        verify(patientAlertRepository, times(1)).findById(1L);
        verify(patientAlertRepository, times(1)).save(alert);
    }

    @Test
    void markAlertAsRead_nullId_doesNothing() {
        riskAlertService.markAlertAsRead(null);
        verifyNoInteractions(patientAlertRepository);
    }

    @Test
    void markAlertAsRead_alertNotFound_doesNotSave() {
        when(patientAlertRepository.findById(999L)).thenReturn(Optional.empty());

        riskAlertService.markAlertAsRead(999L);

        verify(patientAlertRepository, times(1)).findById(999L);
        verify(patientAlertRepository, never()).save(any());
    }

    @Test
    void markAlertAsRead_alertFound_setsReadAndSaves() {
        PatientAlert alert = new PatientAlert();
        alert.setId(1L);
        alert.setRead(false);

        when(patientAlertRepository.findById(1L)).thenReturn(Optional.of(alert));
        when(patientAlertRepository.save(any(PatientAlert.class))).thenReturn(alert);

        riskAlertService.markAlertAsRead(1L);

        assertTrue(alert.isRead());
        verify(patientAlertRepository, times(1)).findById(1L);
        verify(patientAlertRepository, times(1)).save(alert);
    }

    @Test
    void getHighRiskPatients_returnsMappedItems() {
        Long clinicId = 1L;
        Pageable pageable = PageRequest.of(0, 10);

        Patient patient = Patient.builder()
                .id(100L)
                .fullName("John Doe")
                .patientCode("P100")
                .riskLevel("Rủi ro cao")
                .doctorId(2L)
                .build();

        Page<Patient> patientsPage = new PageImpl<>(List.of(patient), pageable, 1);
        when(patientRepository.findByClinicIdAndFilters(eq(clinicId), isNull(), isNull(), eq("Rủi ro cao"), isNull(), isNull(), eq(pageable)))
                .thenReturn(patientsPage);

        // Mocks for mapping helper
        when(healthMetricRepository.findRecentByPatientId(eq(100L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());
        when(userRepository.findById(2L))
                .thenReturn(Optional.of(User.builder().fullName("Dr. Smith").build()));
        when(appointmentRepository.findNextAppointmentsByPatient(eq(clinicId), eq(100L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());
        when(patientAlertRepository.countUnreadAlertsByPatientId(100L))
                .thenReturn(3);

        Page<RiskAlertResponse.RiskPatientItem> result = riskAlertService.getHighRiskPatients(clinicId, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        RiskAlertResponse.RiskPatientItem item = result.getContent().get(0);
        assertEquals(100L, item.getPatientId());
        assertEquals("John Doe", item.getFullName());
        assertEquals("Dr. Smith", item.getDoctorName());
        assertEquals(3, item.getAlertCount());
    }

    @Test
    void getRiskAlertDashboard_emptyPatients_returnsZeroSummary() {
        Long clinicId = 1L;

        when(patientRepository.countByClinicIdAndIsDeletedFalse(clinicId)).thenReturn(0L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(clinicId, "Rủi ro cao")).thenReturn(0L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(clinicId, "Trung bình")).thenReturn(0L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(clinicId, "Ổn định")).thenReturn(0L);
        when(healthMetricRepository.findPatientIdsInClinicWithNoMetricsSince(eq(clinicId), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        when(appointmentRepository.countOverdueByClinicId(eq(clinicId), any(LocalDateTime.class)))
                .thenReturn(0L);

        Page<Patient> emptyPatientsPage = new PageImpl<>(Collections.emptyList());
        when(patientRepository.findByClinicIdAndFilters(eq(clinicId), isNull(), isNull(), eq("Rủi ro cao"), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(emptyPatientsPage);
        when(patientAlertRepository.findRecentAlertsByClinic(eq(clinicId), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        RiskAlertResponse dashboard = riskAlertService.getRiskAlertDashboard(clinicId);

        assertNotNull(dashboard);
        assertEquals(0, dashboard.getSummary().getTotalPatients());
        assertEquals(0.0, dashboard.getSummary().getHighRiskPercentage());
        assertTrue(dashboard.getHighRiskPatients().isEmpty());
        assertTrue(dashboard.getRecentAlerts().isEmpty());
    }

    @Test
    void getRiskAlertDashboard_withData_returnsFullResponse() {
        Long clinicId = 1L;

        when(patientRepository.countByClinicIdAndIsDeletedFalse(clinicId)).thenReturn(10L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(clinicId, "Rủi ro cao")).thenReturn(3L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(clinicId, "Trung bình")).thenReturn(5L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(clinicId, "Ổn định")).thenReturn(2L);
        when(healthMetricRepository.findPatientIdsInClinicWithNoMetricsSince(eq(clinicId), any(LocalDateTime.class)))
                .thenReturn(List.of(100L, 101L));
        when(appointmentRepository.countOverdueByClinicId(eq(clinicId), any(LocalDateTime.class)))
                .thenReturn(4L);

        // High risk patient (doctor assigned, overdue appointment, has health metric)
        Patient highRiskPatient1 = Patient.builder()
                .id(100L)
                .fullName("John Doe")
                .patientCode("P100")
                .riskLevel("Rủi ro cao")
                .doctorId(2L)
                .build();

        // High risk patient (no doctor, no next appointment, no health metric)
        Patient highRiskPatient2 = Patient.builder()
                .id(101L)
                .fullName("Jane Doe")
                .patientCode("P101")
                .riskLevel("Rủi ro cao")
                .doctorId(null)
                .build();

        Page<Patient> highRiskPage = new PageImpl<>(List.of(highRiskPatient1, highRiskPatient2));
        when(patientRepository.findByClinicIdAndFilters(eq(clinicId), isNull(), isNull(), eq("Rủi ro cao"), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(highRiskPage);

        // Mocking for highRiskPatient1 mapping helper
        HealthMetric metric1 = HealthMetric.builder()
                .status("CRITICAL")
                .measuredAt(LocalDateTime.now().minusDays(1))
                .build();
        when(healthMetricRepository.findRecentByPatientId(eq(100L), any(Pageable.class)))
                .thenReturn(List.of(metric1));
        when(userRepository.findById(2L))
                .thenReturn(Optional.of(User.builder().fullName("Dr. Smith").build()));
        Appointment app1 = Appointment.builder()
                .appointmentTime(LocalDateTime.now().minusHours(2)) // Overdue!
                .build();
        when(appointmentRepository.findNextAppointmentsByPatient(eq(clinicId), eq(100L), any(Pageable.class)))
                .thenReturn(List.of(app1));
        when(patientAlertRepository.countUnreadAlertsByPatientId(100L))
                .thenReturn(5);

        // Mocking for highRiskPatient2 mapping helper
        when(healthMetricRepository.findRecentByPatientId(eq(101L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());
        // doctor is null, so userRepository.findById(null) is not called.
        when(appointmentRepository.findNextAppointmentsByPatient(eq(clinicId), eq(101L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());
        when(patientAlertRepository.countUnreadAlertsByPatientId(101L))
                .thenReturn(0);

        // Mocking recent alerts
        PatientAlert alert = PatientAlert.builder()
                .id(10L)
                .patient(highRiskPatient1)
                .alertType("HEALTH_WARNING")
                .severity("CRITICAL")
                .title("SPO2 Low")
                .message("SPO2 dropped below 90%")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        when(patientAlertRepository.findRecentAlertsByClinic(eq(clinicId), any(Pageable.class)))
                .thenReturn(List.of(alert));

        // Execute service call
        RiskAlertResponse dashboard = riskAlertService.getRiskAlertDashboard(clinicId);

        // Assertions
        assertNotNull(dashboard);
        assertEquals(10L, dashboard.getSummary().getTotalPatients());
        assertEquals(30.0, dashboard.getSummary().getHighRiskPercentage()); // (3 * 100) / 10
        assertEquals(2L, dashboard.getSummary().getUnmonitoredCount());
        assertEquals(4L, dashboard.getSummary().getOverdueAppointments());

        assertEquals(2, dashboard.getHighRiskPatients().size());

        // Assert highRiskPatient1
        RiskAlertResponse.RiskPatientItem item1 = dashboard.getHighRiskPatients().get(0);
        assertEquals(100L, item1.getPatientId());
        assertEquals("John Doe", item1.getFullName());
        assertEquals("CRITICAL", item1.getLastMetricStatus());
        assertEquals("Dr. Smith", item1.getDoctorName());
        assertTrue(item1.isAppointmentOverdue());
        assertEquals(5, item1.getAlertCount());

        // Assert highRiskPatient2
        RiskAlertResponse.RiskPatientItem item2 = dashboard.getHighRiskPatients().get(1);
        assertEquals(101L, item2.getPatientId());
        assertEquals("Jane Doe", item2.getFullName());
        assertEquals("Chưa có dữ liệu", item2.getLastMetricStatus());
        assertEquals("Chưa phân công", item2.getDoctorName());
        assertFalse(item2.isAppointmentOverdue());
        assertEquals(0, item2.getAlertCount());

        // Assert recent alerts mapping
        assertEquals(1, dashboard.getRecentAlerts().size());
        var alertItem = dashboard.getRecentAlerts().get(0);
        assertEquals(10L, alertItem.getAlertId());
        assertEquals(100L, alertItem.getPatientId());
        assertEquals("John Doe", alertItem.getPatientName());
        assertEquals("HEALTH_WARNING", alertItem.getAlertType());
    }
}
