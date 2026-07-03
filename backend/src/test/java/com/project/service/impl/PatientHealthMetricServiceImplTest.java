package com.project.service.impl;

import com.project.dto.request.CreateHealthMetricRequest;
import com.project.dto.response.HealthMetricResponse;
import com.project.dto.response.HealthMetricSummaryResponse;
import com.project.entity.Clinic;
import com.project.entity.HealthMetric;
import com.project.entity.MetricType;
import com.project.entity.Patient;
import com.project.entity.PatientAlert;
import com.project.entity.SystemConfig;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.ClinicRepository;
import com.project.repository.HealthMetricRepository;
import com.project.repository.PatientAlertRepository;
import com.project.repository.PatientRepository;
import com.project.repository.SystemConfigRepository;
import com.project.security.CustomUserDetails;
import com.project.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientHealthMetricServiceImplTest {

    @Mock
    private HealthMetricRepository healthMetricRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PatientAlertRepository patientAlertRepository;

    @Mock
    private SystemConfigRepository systemConfigRepository;

    @Mock
    private ClinicRepository clinicRepository;

    @InjectMocks
    private PatientHealthMetricServiceImpl service;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("create - saves normal metric for current patient without alert")
    void create_normalMetricForCurrentPatient() {
        authenticatePatient(101L);
        Patient patient = patient(1L, 101L, 5L);
        CreateHealthMetricRequest request = request("BLOOD_SUGAR", "5.5", null);
        request.setMeasuredAt(LocalDateTime.of(2026, 7, 3, 8, 0));

        when(patientRepository.findByUserId(101L)).thenReturn(Optional.of(patient));
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(healthMetricRepository.save(any(HealthMetric.class))).thenAnswer(invocation -> {
            HealthMetric metric = invocation.getArgument(0);
            metric.setId(10L);
            return metric;
        });

        HealthMetricResponse response = service.create(request);

        assertEquals(10L, response.getId());
        assertEquals("BLOOD_SUGAR", response.getMetricType());
        assertEquals("NORMAL", response.getStatus());
        assertEquals("mmol/L", response.getUnit());
        assertEquals(LocalDateTime.of(2026, 7, 3, 8, 0), response.getMeasuredAt());
        verify(patientRepository, never()).save(patient);
        verify(notificationService, never()).sendNotification(any(), any(), any(), any(), any());
        verify(patientAlertRepository, never()).save(any(PatientAlert.class));
    }

    @Test
    @DisplayName("recordMetricForPatient - high metric marks risk and notifies doctor, manager and patient")
    void recordMetricForPatient_highMetricCreatesAlerts() {
        Patient patient = patient(1L, 101L, 5L);
        patient.setRiskLevel("STABLE");
        CreateHealthMetricRequest request = request("BLOOD_SUGAR", "9.0", null);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(healthMetricRepository.save(any(HealthMetric.class))).thenAnswer(invocation -> {
            HealthMetric metric = invocation.getArgument(0);
            metric.setId(20L);
            return metric;
        });
        when(clinicRepository.findById(2L)).thenReturn(Optional.of(Clinic.builder().id(2L).managerId(99L).build()));

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("HIGH", response.getStatus());
        assertEquals("HIGH_RISK", patient.getRiskLevel());
        verify(patientRepository).save(patient);
        verify(notificationService).sendNotification(eq(5L), any(), any(), eq("warning"), eq("/doctor/patients/1"));
        verify(notificationService).sendNotification(eq(99L), any(), any(), eq("warning"), eq("/clinic/risk-alerts"));
        ArgumentCaptor<PatientAlert> alertCaptor = ArgumentCaptor.forClass(PatientAlert.class);
        verify(patientAlertRepository).save(alertCaptor.capture());
        assertEquals(patient, alertCaptor.getValue().getPatient());
        assertEquals("HEALTH_WARNING", alertCaptor.getValue().getAlertType());
        assertFalse(alertCaptor.getValue().isRead());
        assertFalse(alertCaptor.getValue().isDismissed());
    }

    @Test
    @DisplayName("recordMetricForPatient - low metric without doctor does not notify")
    void recordMetricForPatient_lowMetricWithoutDoctorOnlyMarksRisk() {
        Patient patient = patient(1L, 101L, null);
        CreateHealthMetricRequest request = request("SPO2", "89", null);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(healthMetricRepository.save(any(HealthMetric.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("LOW", response.getStatus());
        assertEquals("HIGH_RISK", patient.getRiskLevel());
        verify(patientRepository).save(patient);
        verify(notificationService, never()).sendNotification(any(), any(), any(), any(), any());
        verify(patientAlertRepository, never()).save(any(PatientAlert.class));
    }

    @Test
    @DisplayName("recordMetricForPatient - high blood pressure without diastolic skips clinic manager without manager id")
    void recordMetricForPatient_highBloodPressureNoDiastolicNoClinicManager() {
        Patient patient = patient(1L, 101L, 5L);
        CreateHealthMetricRequest request = request("BLOOD_PRESSURE", "150", null);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(healthMetricRepository.save(any(HealthMetric.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(clinicRepository.findById(2L)).thenReturn(Optional.of(Clinic.builder().id(2L).managerId(null).build()));

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("HIGH", response.getStatus());
        verify(notificationService, times(1)).sendNotification(eq(5L), any(), any(), eq("warning"), eq("/doctor/patients/1"));
        verify(patientAlertRepository).save(any(PatientAlert.class));
    }

    @Test
    @DisplayName("recordMetricForPatient - normal metric stabilizes previously high-risk patient")
    void recordMetricForPatient_normalMetricStabilizesHighRiskPatient() {
        Patient patient = patient(1L, 101L, 5L);
        patient.setRiskLevel("HIGH_RISK");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(healthMetricRepository.save(any(HealthMetric.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HealthMetricResponse response = service.recordMetricForPatient(1L, request("HEART_RATE", "80", null));

        assertEquals("NORMAL", response.getStatus());
        assertEquals("STABLE", patient.getRiskLevel());
        verify(patientRepository).save(patient);
    }

    @Test
    @DisplayName("recordMetricForPatient - evaluates boundary statuses and custom config thresholds")
    void recordMetricForPatient_statusBoundaries() {
        Patient patient = patient(1L, 101L, null);
        SystemConfig config = SystemConfig.builder()
                .bpSysThreshold("130")
                .bpDiaThreshold("85")
                .hrThreshold("95")
                .spo2Threshold("94")
                .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(config));
        when(healthMetricRepository.save(any(HealthMetric.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals("LOW", service.recordMetricForPatient(1L, request("BLOOD_SUGAR", "3.9", null)).getStatus());
        assertEquals("BORDERLINE_HIGH", service.recordMetricForPatient(1L, request("BLOOD_SUGAR", "7.2", null)).getStatus());
        assertEquals("NORMAL", service.recordMetricForPatient(1L, request("BLOOD_PRESSURE", "119", null)).getStatus());
        assertEquals("BORDERLINE_HIGH", service.recordMetricForPatient(1L, request("BLOOD_PRESSURE", "119", "80")).getStatus());
        assertEquals("BORDERLINE_HIGH", service.recordMetricForPatient(1L, request("BLOOD_PRESSURE", "130", "85")).getStatus());
        assertEquals("HIGH", service.recordMetricForPatient(1L, request("BLOOD_PRESSURE", "131", "86")).getStatus());
        assertEquals("LOW", service.recordMetricForPatient(1L, request("HEART_RATE", "59", null)).getStatus());
        assertEquals("HIGH", service.recordMetricForPatient(1L, request("HEART_RATE", "96", null)).getStatus());
        assertEquals("NORMAL", service.recordMetricForPatient(1L, request("HBA1C", "5.6", null)).getStatus());
        assertEquals("BORDERLINE_HIGH", service.recordMetricForPatient(1L, request("HBA1C", "6.4", null)).getStatus());
        assertEquals("HIGH", service.recordMetricForPatient(1L, request("HBA1C", "6.5", null)).getStatus());
        assertEquals("BORDERLINE_LOW", service.recordMetricForPatient(1L, request("SPO2", "92", null)).getStatus());
        assertEquals("NORMAL", service.recordMetricForPatient(1L, request("SPO2", "94", null)).getStatus());
    }

    @Test
    @DisplayName("recordMetricForPatient - missing patient throws ResourceNotFoundException")
    void recordMetricForPatient_missingPatient() {
        when(patientRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.recordMetricForPatient(404L, request("BLOOD_SUGAR", "5.5", null)));
    }

    @Test
    @DisplayName("getMetricsSummary - groups latest metrics, chart data, trend and change percentage")
    void getMetricsSummary_groupsLatestTrendAndChange() {
        authenticatePatient(101L);
        Patient patient = patient(1L, 101L, 5L);
        HealthMetric oldSugar = metric(1L, patient, MetricType.BLOOD_SUGAR, "5.0", null, "NORMAL", LocalDateTime.now().minusDays(2));
        HealthMetric newSugar = metric(2L, patient, MetricType.BLOOD_SUGAR, "6.0", null, "NORMAL", LocalDateTime.now().minusDays(1));
        HealthMetric bp = metric(3L, patient, MetricType.BLOOD_PRESSURE, "120", "80", "BORDERLINE_HIGH", LocalDateTime.now().minusHours(2));

        when(patientRepository.findByUserId(101L)).thenReturn(Optional.of(patient));
        when(healthMetricRepository.findByPatientIdAndMeasuredAtBetweenAndIsDeletedFalse(eq(1L), any(), any()))
                .thenReturn(List.of(oldSugar, newSugar, bp));
        when(healthMetricRepository.findRecentByPatientId(eq(1L), any()))
                .thenReturn(List.of(newSugar, bp, oldSugar));

        List<HealthMetricSummaryResponse> summaries = service.getMetricsSummary("MONTH");

        assertEquals(2, summaries.size());
        HealthMetricSummaryResponse sugar = summaries.stream()
                .filter(summary -> "BLOOD_SUGAR".equals(summary.getMetricType()))
                .findFirst()
                .orElseThrow();
        assertEquals(new BigDecimal("6.0"), sugar.getLatestValue());
        assertEquals("UP", sugar.getTrend());
        assertEquals("+20.0%", sugar.getChangePercentage());
        assertEquals(2, sugar.getChartData().size());

        HealthMetricSummaryResponse pressure = summaries.stream()
                .filter(summary -> "BLOOD_PRESSURE".equals(summary.getMetricType()))
                .findFirst()
                .orElseThrow();
        assertEquals("STABLE", pressure.getTrend());
        assertEquals("0%", pressure.getChangePercentage());
    }

    @Test
    @DisplayName("getMetricsSummary - zero previous value keeps change percentage at zero")
    void getMetricsSummary_zeroPreviousChange() {
        authenticatePatient(101L);
        Patient patient = patient(1L, 101L, 5L);
        HealthMetric zero = metric(1L, patient, MetricType.HEART_RATE, "0", null, "LOW", LocalDateTime.now().minusDays(2));
        HealthMetric latest = metric(2L, patient, MetricType.HEART_RATE, "70", null, "NORMAL", LocalDateTime.now().minusDays(1));

        when(patientRepository.findByUserId(101L)).thenReturn(Optional.of(patient));
        when(healthMetricRepository.findByPatientIdAndMeasuredAtBetweenAndIsDeletedFalse(eq(1L), any(), any()))
                .thenReturn(List.of(zero, latest));
        when(healthMetricRepository.findRecentByPatientId(eq(1L), any()))
                .thenReturn(List.of(latest, zero));

        List<HealthMetricSummaryResponse> summaries = service.getMetricsSummary("UNKNOWN");

        assertEquals("0%", summaries.get(0).getChangePercentage());
        assertEquals("UP", summaries.get(0).getTrend());
    }

    @Test
    @DisplayName("getMetricsSummary - supports downward and equal trends over year range")
    void getMetricsSummary_downAndStableTrendsForYear() {
        authenticatePatient(101L);
        Patient patient = patient(1L, 101L, 5L);
        HealthMetric oldHba1c = metric(1L, patient, MetricType.HBA1C, "6.0", null, "BORDERLINE_HIGH", LocalDateTime.now().minusMonths(2));
        HealthMetric latestHba1c = metric(2L, patient, MetricType.HBA1C, "5.0", null, "NORMAL", LocalDateTime.now().minusMonths(1));
        HealthMetric oldSpo2 = metric(3L, patient, MetricType.SPO2, "96", null, "NORMAL", LocalDateTime.now().minusDays(2));
        HealthMetric latestSpo2 = metric(4L, patient, MetricType.SPO2, "96", null, "NORMAL", LocalDateTime.now().minusDays(1));

        when(patientRepository.findByUserId(101L)).thenReturn(Optional.of(patient));
        when(healthMetricRepository.findByPatientIdAndMeasuredAtBetweenAndIsDeletedFalse(eq(1L), any(), any()))
                .thenReturn(List.of(oldHba1c, latestHba1c, oldSpo2, latestSpo2));
        when(healthMetricRepository.findRecentByPatientId(eq(1L), any()))
                .thenReturn(List.of(latestHba1c, latestSpo2, oldHba1c, oldSpo2));

        List<HealthMetricSummaryResponse> summaries = service.getMetricsSummary("YEAR");

        HealthMetricSummaryResponse hba1c = summaries.stream()
                .filter(summary -> "HBA1C".equals(summary.getMetricType()))
                .findFirst()
                .orElseThrow();
        HealthMetricSummaryResponse spo2 = summaries.stream()
                .filter(summary -> "SPO2".equals(summary.getMetricType()))
                .findFirst()
                .orElseThrow();
        assertEquals("DOWN", hba1c.getTrend());
        assertEquals("-16.7%", hba1c.getChangePercentage());
        assertEquals("STABLE", spo2.getTrend());
        assertEquals("0.0%", spo2.getChangePercentage());
    }

    @Test
    @DisplayName("getChartData and getHistory - map current patient's metric data")
    void getChartDataAndHistory_mapResponses() {
        authenticatePatient(101L);
        Patient patient = patient(1L, 101L, 5L);
        HealthMetric metric = metric(1L, patient, MetricType.SPO2, "96", null, "NORMAL", LocalDateTime.now());

        when(patientRepository.findByUserId(101L)).thenReturn(Optional.of(patient));
        when(healthMetricRepository.findByPatientIdAndMetricTypeAndMeasuredAtBetweenAndIsDeletedFalse(eq(1L), eq(MetricType.SPO2), any(), any()))
                .thenReturn(List.of(metric));
        when(healthMetricRepository.findByPatientIdAndIsDeletedFalseOrderByMeasuredAtDesc(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of(metric), PageRequest.of(0, 10), 1));

        List<HealthMetricResponse> chart = service.getChartData("SPO2", "DAY");
        List<HealthMetricResponse> weeklyChart = service.getChartData("SPO2", "WEEK");
        Page<HealthMetricResponse> history = service.getHistory(PageRequest.of(0, 10));

        assertEquals(1, chart.size());
        assertEquals(1, weeklyChart.size());
        assertEquals("SPO2", chart.get(0).getMetricType());
        assertEquals(1, history.getTotalElements());
        assertEquals("NORMAL", history.getContent().get(0).getStatus());
    }

    @Test
    @DisplayName("delete - soft deletes only current patient's metric")
    void delete_softDeletesOwnedMetric() {
        authenticatePatient(101L);
        Patient patient = patient(1L, 101L, 5L);
        HealthMetric metric = metric(10L, patient, MetricType.BLOOD_SUGAR, "5.5", null, "NORMAL", LocalDateTime.now());

        when(patientRepository.findByUserId(101L)).thenReturn(Optional.of(patient));
        when(healthMetricRepository.findById(10L)).thenReturn(Optional.of(metric));

        service.delete(10L);

        assertTrue(metric.isDeleted());
        verify(healthMetricRepository).save(metric);
    }

    @Test
    @DisplayName("delete - rejects missing metric and metric owned by another patient")
    void delete_missingOrUnauthorized() {
        authenticatePatient(101L);
        Patient currentPatient = patient(1L, 101L, 5L);
        Patient otherPatient = patient(2L, 202L, 5L);

        when(patientRepository.findByUserId(101L)).thenReturn(Optional.of(currentPatient));
        when(healthMetricRepository.findById(404L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.delete(404L));

        when(healthMetricRepository.findById(11L))
                .thenReturn(Optional.of(metric(11L, otherPatient, MetricType.BLOOD_SUGAR, "5.5", null, "NORMAL", LocalDateTime.now())));
        assertThrows(AccessDeniedException.class, () -> service.delete(11L));
    }

    @Test
    @DisplayName("current patient lookup - rejects unauthenticated user and missing patient profile")
    void currentPatientLookup_errorPaths() {
        assertThrows(ResourceNotFoundException.class, () -> service.create(request("BLOOD_SUGAR", "5.5", null)));

        authenticatePatient(101L);
        when(patientRepository.findByUserId(101L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getHistory(PageRequest.of(0, 10)));
    }

    private static void authenticatePatient(Long userId) {
        CustomUserDetails principal = CustomUserDetails.builder()
                .id(userId)
                .email("patient@example.com")
                .role("PATIENT")
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private static CreateHealthMetricRequest request(String metricType, String value, String valueSecondary) {
        return CreateHealthMetricRequest.builder()
                .metricType(metricType)
                .value(new BigDecimal(value))
                .valueSecondary(valueSecondary == null ? null : new BigDecimal(valueSecondary))
                .notes("note")
                .build();
    }

    private static Patient patient(Long id, Long userId, Long doctorId) {
        return Patient.builder()
                .id(id)
                .userId(userId)
                .doctorId(doctorId)
                .clinicId(2L)
                .fullName("Patient " + id)
                .phone("090000000" + id)
                .gender("M")
                .riskLevel("STABLE")
                .build();
    }

    private static HealthMetric metric(Long id, Patient patient, MetricType type, String value, String valueSecondary,
                                       String status, LocalDateTime measuredAt) {
        return HealthMetric.builder()
                .id(id)
                .patient(patient)
                .metricType(type)
                .value(new BigDecimal(value))
                .valueSecondary(valueSecondary == null ? null : new BigDecimal(valueSecondary))
                .unit(unit(type))
                .status(status)
                .notes("note")
                .measuredAt(measuredAt)
                .build();
    }

    private static String unit(MetricType type) {
        return switch (type) {
            case BLOOD_SUGAR -> "mmol/L";
            case BLOOD_PRESSURE -> "mmHg";
            case HEART_RATE -> "bpm";
            case HBA1C, SPO2 -> "%";
        };
    }
}
