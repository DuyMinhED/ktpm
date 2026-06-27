package com.project.service.impl;

import com.project.dto.response.*;
import com.project.entity.*;
import com.project.repository.*;
import com.project.service.PatientProfileService;
import com.project.util.AppConstants;
import org.junit.jupiter.api.BeforeEach;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DoctorPatientServiceImplTest {

    @Mock
    private PatientRepository patientRepository;
    @Mock
    private HealthMetricRepository healthMetricRepository;
    @Mock
    private PatientProfileService patientProfileService;
    @Mock
    private PrescriptionRepository prescriptionRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private MedicationLogRepository medicationLogRepository;
    @Mock
    private MedicationScheduleRepository medicationScheduleRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DoctorPatientServiceImpl doctorPatientService;

    private Patient samplePatient;
    private HealthMetric sampleMetric;

    @BeforeEach
    void setUp() {
        samplePatient = Patient.builder()
                .id(1L)
                .doctorId(10L)
                .patientCode("P001")
                .fullName("Jane Doe")
                .gender("FEMALE")
                .phone("0987654321")
                .email("jane@example.com")
                .dateOfBirth(LocalDate.now().minusYears(40))
                .treatmentStatus("STABLE")
                .riskLevel("MONITORING")
                .build();

        sampleMetric = HealthMetric.builder()
                .id(100L)
                .metricType(MetricType.BLOOD_SUGAR)
                .value(new BigDecimal("5.6"))
                .unit("mmol/L")
                .measuredAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getMyPatients_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Patient> patientPage = new PageImpl<>(Collections.singletonList(samplePatient));

        when(patientRepository.findByDoctorIdAndFilters(10L, "search", "condition", "risk", pageable))
                .thenReturn(patientPage);

        Page<DoctorPatientResponse> result = doctorPatientService.getMyPatients(10L, "search", "condition", "risk", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Jane Doe", result.getContent().get(0).getFullName());
    }

    @Test
    void getTotalPatientCount_success() {
        when(patientRepository.countByDoctorIdAndIsDeletedFalse(10L)).thenReturn(5L);
        assertEquals(5L, doctorPatientService.getTotalPatientCount(10L));
    }

    @Test
    void getHighRiskCount_success() {
        when(patientRepository.countByDoctorIdAndRiskLevelAndIsDeletedFalse(10L, AppConstants.RISK_HIGH)).thenReturn(2L);
        assertEquals(2L, doctorPatientService.getHighRiskCount(10L));
    }

    @Test
    void getDailyMetricTrend_success() {
        LocalDateTime since = LocalDateTime.now().minusDays(7).withHour(0).withMinute(0).withSecond(0);
        when(healthMetricRepository.findByDoctorIdAndMetricTypeAndSince(eq(10L), eq(MetricType.BLOOD_PRESSURE), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        HealthMetric.builder()
                                .value(new BigDecimal("120"))
                                .measuredAt(LocalDateTime.now())
                                .build()
                ));

        List<Double> trend = doctorPatientService.getDailyMetricTrend(10L, MetricType.BLOOD_PRESSURE, 7);

        assertNotNull(trend);
        assertEquals(7, trend.size());
        assertEquals(120.0, trend.get(6)); // Today's average should be 120.0
    }

    @Test
    void getPatientDetail_success() {
        PatientProfileResponse profile = new PatientProfileResponse();
        profile.setId(1L);

        when(patientProfileService.getPatientProfileById(1L)).thenReturn(profile);
        when(healthMetricRepository.findRecentByPatientId(eq(1L), any(Pageable.class))).thenReturn(List.of(sampleMetric));
        when(prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());
        when(appointmentRepository.findByPatientIdOrderByAppointmentTimeDesc(1L)).thenReturn(Collections.emptyList());

        DoctorPatientDetailResponse detail = doctorPatientService.getPatientDetail(1L);

        assertNotNull(detail);
        assertEquals(1L, detail.getProfile().getId());
        assertEquals(1, detail.getRecentMetrics().size());
        assertEquals(100.0, detail.getAdherenceRate()); // No schedules defaults to 100.0
    }
}
