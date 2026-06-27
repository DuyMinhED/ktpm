package com.project.service.impl;

import com.project.dto.request.CreateHealthMetricRequest;
import com.project.dto.response.HealthMetricResponse;
import com.project.entity.HealthMetric;
import com.project.entity.MetricType;
import com.project.entity.Patient;
import com.project.repository.ClinicRepository;
import com.project.repository.HealthMetricRepository;
import com.project.repository.PatientAlertRepository;
import com.project.repository.PatientRepository;
import com.project.repository.SystemConfigRepository;
import com.project.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PatientHealthMetricServiceImplTest {

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

    private Patient patient;

    @BeforeEach
    void setUp() {
        patient = Patient.builder()
                .id(1L)
                .userId(100L)
                .fullName("Nguyen Van A")
                .clinicId(10L)
                .doctorId(2L)
                .gender("MALE")
                .riskLevel("STABLE")
                .build();
    }

    private void setupMockSaving() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(healthMetricRepository.save(any(HealthMetric.class))).thenAnswer(invocation -> {
            HealthMetric metric = invocation.getArgument(0);
            metric.setId(99L);
            metric.setMeasuredAt(LocalDateTime.now());
            return metric;
        });
    }

    // =========================================================================
    // 1. BLOOD_SUGAR - EP & BVA Test Cases
    // =========================================================================

    @Test
    void recordMetric_bloodSugar_lowBoundary() {
        setupMockSaving();

        // EP: LOW (<3.9) | BVA: 3.8
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("3.8"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("LOW", response.getStatus());
        verify(patientAlertRepository, times(1)).save(any());
        verify(notificationService, times(1)).sendNotification(eq(2L), any(), any(), eq("warning"), any());
    }

    @Test
    void recordMetric_bloodSugar_normalBoundaryMin() {
        setupMockSaving();

        // EP: NORMAL (3.9 - 6.1) | BVA: 3.9 (min)
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("3.9"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("NORMAL", response.getStatus());
    }

    @Test
    void recordMetric_bloodSugar_normalBoundaryMax() {
        setupMockSaving();

        // EP: NORMAL (3.9 - 6.1) | BVA: 6.1 (max)
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("6.1"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("NORMAL", response.getStatus());
    }

    @Test
    void recordMetric_bloodSugar_borderlineHighBoundaryMin() {
        setupMockSaving();

        // EP: BORDERLINE_HIGH (6.1 < v <= 7.0) | BVA: 6.2
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("6.2"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("BORDERLINE_HIGH", response.getStatus());
    }

    @Test
    void recordMetric_bloodSugar_borderlineHighBoundaryMax() {
        setupMockSaving();

        // EP: BORDERLINE_HIGH (6.1 < v <= 7.0) | BVA: 7.0
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("7.0"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("BORDERLINE_HIGH", response.getStatus());
    }

    @Test
    void recordMetric_bloodSugar_highBoundary() {
        setupMockSaving();

        // EP: HIGH (>7.0) | BVA: 7.1
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("7.1"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("HIGH", response.getStatus());
        verify(patientAlertRepository, times(1)).save(any());
        verify(notificationService, times(1)).sendNotification(eq(2L), any(), any(), eq("warning"), any());
    }

    // =========================================================================
    // 2. HBA1C - EP & BVA Test Cases
    // =========================================================================

    @Test
    void recordMetric_hba1c_normalBoundary() {
        setupMockSaving();

        // EP: NORMAL (<5.7) | BVA: 5.6
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.HBA1C.name())
                .value(new BigDecimal("5.6"))
                .unit("%")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("NORMAL", response.getStatus());
    }

    @Test
    void recordMetric_hba1c_borderlineHighMin() {
        setupMockSaving();

        // EP: BORDERLINE_HIGH (5.7 - 6.4) | BVA: 5.7 (min)
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.HBA1C.name())
                .value(new BigDecimal("5.7"))
                .unit("%")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("BORDERLINE_HIGH", response.getStatus());
    }

    @Test
    void recordMetric_hba1c_borderlineHighMax() {
        setupMockSaving();

        // EP: BORDERLINE_HIGH (5.7 - 6.4) | BVA: 6.4 (max)
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.HBA1C.name())
                .value(new BigDecimal("6.4"))
                .unit("%")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("BORDERLINE_HIGH", response.getStatus());
    }

    @Test
    void recordMetric_hba1c_high() {
        setupMockSaving();

        // EP: HIGH (>6.4) | BVA: 6.5
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.HBA1C.name())
                .value(new BigDecimal("6.5"))
                .unit("%")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("HIGH", response.getStatus());
    }

    // =========================================================================
    // 3. HEART_RATE - EP & BVA Test Cases
    // =========================================================================

    @Test
    void recordMetric_heartRate_low() {
        setupMockSaving();

        // EP: LOW (<60) | BVA: 59
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.HEART_RATE.name())
                .value(new BigDecimal("59"))
                .unit("bpm")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("LOW", response.getStatus());
    }

    @Test
    void recordMetric_heartRate_normalMin() {
        setupMockSaving();

        // EP: NORMAL (60 - 100) | BVA: 60 (min)
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.HEART_RATE.name())
                .value(new BigDecimal("60"))
                .unit("bpm")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("NORMAL", response.getStatus());
    }

    @Test
    void recordMetric_heartRate_normalMax() {
        setupMockSaving();

        // EP: NORMAL (60 - 100) | BVA: 100 (max)
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.HEART_RATE.name())
                .value(new BigDecimal("100"))
                .unit("bpm")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("NORMAL", response.getStatus());
    }

    @Test
    void recordMetric_heartRate_high() {
        setupMockSaving();

        // EP: HIGH (>100) | BVA: 101
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.HEART_RATE.name())
                .value(new BigDecimal("101"))
                .unit("bpm")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("HIGH", response.getStatus());
    }

    // =========================================================================
    // 4. SPO2 - EP & BVA Test Cases
    // =========================================================================

    @Test
    void recordMetric_spo2_low() {
        setupMockSaving();

        // EP: LOW (<90) | BVA: 89
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.SPO2.name())
                .value(new BigDecimal("89"))
                .unit("%")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("LOW", response.getStatus());
    }

    @Test
    void recordMetric_spo2_borderlineLowMin() {
        setupMockSaving();

        // EP: BORDERLINE_LOW (90 - 94) | BVA: 90 (min)
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.SPO2.name())
                .value(new BigDecimal("90"))
                .unit("%")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("BORDERLINE_LOW", response.getStatus());
    }

    @Test
    void recordMetric_spo2_borderlineLowMax() {
        setupMockSaving();

        // EP: BORDERLINE_LOW (90 - 94) | BVA: 93 (max-)
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.SPO2.name())
                .value(new BigDecimal("93"))
                .unit("%")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("BORDERLINE_LOW", response.getStatus());
    }

    @Test
    void recordMetric_spo2_normal() {
        setupMockSaving();

        // EP: NORMAL (>=94) | BVA: 94
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.SPO2.name())
                .value(new BigDecimal("94"))
                .unit("%")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("NORMAL", response.getStatus());
    }

    // =========================================================================
    // 5. BLOOD_PRESSURE - EP & BVA Test Cases
    // =========================================================================

    @Test
    void recordMetric_bloodPressure_normal() {
        setupMockSaving();

        // EP: NORMAL (sys < 120 && dia < 80) | BVA: 119 / 79
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_PRESSURE.name())
                .value(new BigDecimal("119"))
                .valueSecondary(new BigDecimal("79"))
                .unit("mmHg")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("NORMAL", response.getStatus());
    }

    @Test
    void recordMetric_bloodPressure_borderlineHighBoundary() {
        setupMockSaving();

        // EP: BORDERLINE_HIGH (sys <= 140 && dia <= 90) | BVA: 120 / 80
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_PRESSURE.name())
                .value(new BigDecimal("120"))
                .valueSecondary(new BigDecimal("80"))
                .unit("mmHg")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("BORDERLINE_HIGH", response.getStatus());
    }

    @Test
    void recordMetric_bloodPressure_borderlineHighBoundaryMax() {
        setupMockSaving();

        // EP: BORDERLINE_HIGH (sys <= 140 && dia <= 90) | BVA: 140 / 90
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_PRESSURE.name())
                .value(new BigDecimal("140"))
                .valueSecondary(new BigDecimal("90"))
                .unit("mmHg")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("BORDERLINE_HIGH", response.getStatus());
    }

    @Test
    void recordMetric_bloodPressure_highSystolic() {
        setupMockSaving();

        // EP: HIGH (sys > 140 || dia > 90) | BVA: 141 / 90
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_PRESSURE.name())
                .value(new BigDecimal("141"))
                .valueSecondary(new BigDecimal("90"))
                .unit("mmHg")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("HIGH", response.getStatus());
    }

    @Test
    void recordMetric_bloodPressure_highDiastolic() {
        setupMockSaving();

        // EP: HIGH (sys > 140 || dia > 90) | BVA: 140 / 91
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_PRESSURE.name())
                .value(new BigDecimal("140"))
                .valueSecondary(new BigDecimal("91"))
                .unit("mmHg")
                .build();

        HealthMetricResponse response = service.recordMetricForPatient(1L, request);

        assertEquals("HIGH", response.getStatus());
    }
}
