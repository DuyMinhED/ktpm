package com.project.service.impl;

import com.project.entity.HealthMetric;
import com.project.entity.MetricType;
import com.project.entity.Patient;
import com.project.repository.HealthMetricRepository;
import com.project.repository.PatientRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClinicalAnalyticsServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private HealthMetricRepository healthMetricRepository;

    @InjectMocks
    private ClinicalAnalyticsServiceImpl service;

    @Test
    @DisplayName("getClinicInsights - reports high-risk patients and increasing blood pressure trends")
    void getClinicInsights_reportsHighRiskAndIncreasingBp() {
        Patient patientOne = Patient.builder().id(1L).build();
        Patient patientTwo = Patient.builder().id(2L).build();

        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(10L), anyString())).thenReturn(2L);
        when(healthMetricRepository.findByClinicIdAndMetricTypeAndSince(eq(10L), eq(MetricType.BLOOD_PRESSURE), any()))
                .thenReturn(List.of(
                        metric(patientOne, "120", 3),
                        metric(patientOne, "135", 2),
                        metric(patientTwo, "140", 3),
                        metric(patientTwo, "130", 2)));

        List<String> insights = service.getClinicInsights(10L);

        assertEquals(2, insights.size());
        assertTrue(insights.get(0).contains("2"));
        assertTrue(insights.get(1).contains("1"));
    }

    @Test
    @DisplayName("getClinicInsights - falls back when no issue is detected")
    void getClinicInsights_fallbackWhenNoIssues() {
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(10L), anyString())).thenReturn(0L);
        when(healthMetricRepository.findByClinicIdAndMetricTypeAndSince(eq(10L), eq(MetricType.BLOOD_PRESSURE), any()))
                .thenReturn(List.of(metric(Patient.builder().id(1L).build(), "120", 1)));

        List<String> insights = service.getClinicInsights(10L);

        assertEquals(1, insights.size());
        assertFalse(insights.get(0).isBlank());
    }

    @Test
    @DisplayName("getDoctorInsights - reports high-risk patients and stale metric reminders")
    void getDoctorInsights_reportsHighRiskAndMissingMetrics() {
        when(patientRepository.countByDoctorIdAndRiskLevelAndIsDeletedFalse(eq(5L), anyString())).thenReturn(3L);
        when(healthMetricRepository.findPatientIdsInDoctorWithNoMetricsSince(eq(5L), any()))
                .thenReturn(List.of(1L, 2L));

        List<String> insights = service.getDoctorInsights(5L);

        assertEquals(2, insights.size());
        assertTrue(insights.get(0).contains("3"));
        assertTrue(insights.get(1).contains("2"));
    }

    @Test
    @DisplayName("getDoctorInsights - falls back when no issue is detected")
    void getDoctorInsights_fallbackWhenNoIssues() {
        when(patientRepository.countByDoctorIdAndRiskLevelAndIsDeletedFalse(eq(5L), anyString())).thenReturn(0L);
        when(healthMetricRepository.findPatientIdsInDoctorWithNoMetricsSince(eq(5L), any()))
                .thenReturn(List.of());

        List<String> insights = service.getDoctorInsights(5L);

        assertEquals(1, insights.size());
        assertFalse(insights.get(0).isBlank());
    }

    private static HealthMetric metric(Patient patient, String value, int daysAgo) {
        return HealthMetric.builder()
                .patient(patient)
                .metricType(MetricType.BLOOD_PRESSURE)
                .value(new BigDecimal(value))
                .unit("mmHg")
                .measuredAt(LocalDateTime.now().minusDays(daysAgo))
                .build();
    }
}
