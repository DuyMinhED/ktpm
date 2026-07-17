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

    @Test
    void getMonitoringCount_success() {
        when(patientRepository.countByDoctorIdAndRiskLevelAndIsDeletedFalse(10L, AppConstants.RISK_MONITORING))
                .thenReturn(3L);

        assertEquals(3L, doctorPatientService.getMonitoringCount(10L));
    }

    @Test
    void getDailyMetricTrend_averagesRoundsAndKeepsEmptyDays() {
        when(healthMetricRepository.findByDoctorIdAndMetricTypeAndSince(eq(10L), eq(MetricType.BLOOD_SUGAR),
                any(LocalDateTime.class)))
                .thenReturn(List.of(
                        metric(MetricType.BLOOD_SUGAR, "5.11", null, LocalDateTime.now()),
                        metric(MetricType.BLOOD_SUGAR, "5.28", null, LocalDateTime.now()),
                        metric(MetricType.BLOOD_SUGAR, "6.0", null, LocalDateTime.now().minusDays(2))));

        List<Double> trend = doctorPatientService.getDailyMetricTrend(10L, MetricType.BLOOD_SUGAR, 3);

        assertEquals(3, trend.size());
        assertEquals(6.0, trend.get(0));
        assertNull(trend.get(1));
        assertEquals(5.2, trend.get(2));
    }

    @Test
    void getMyPatients_mapsLatestMetricBranchesAndIncreasingTrend() {
        Patient patient = patient(1L)
                .riskLevel(null)
                .address("123 Main")
                .identityCard("ID123")
                .occupation("Engineer")
                .ethnicity("Kinh")
                .healthInsuranceNumber("HI123")
                .profileStatus("COMPLETE")
                .clinicalNotes("Follow closely")
                .heightCm(new BigDecimal("165.5"))
                .weightKg(new BigDecimal("60.2"))
                .bloodType("O+")
                .build();
        Pageable pageable = PageRequest.of(0, 10);
        when(patientRepository.findByDoctorIdAndFilters(10L, "", "", "", pageable))
                .thenReturn(new PageImpl<>(List.of(patient)));
        when(healthMetricRepository.findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(1L,
                MetricType.BLOOD_SUGAR)).thenReturn(Optional.of(metric(MetricType.BLOOD_SUGAR, "8.0", null, LocalDateTime.now())));
        when(healthMetricRepository.findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(1L,
                MetricType.BLOOD_PRESSURE)).thenReturn(Optional.of(metric(MetricType.BLOOD_PRESSURE, "120", "80", LocalDateTime.now())));
        when(healthMetricRepository.findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(1L,
                MetricType.HEART_RATE)).thenReturn(Optional.of(metric(MetricType.HEART_RATE, "72", null, LocalDateTime.now())));
        when(healthMetricRepository.findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(1L,
                MetricType.SPO2)).thenReturn(Optional.of(metric(MetricType.SPO2, "98", null, LocalDateTime.now())));
        when(healthMetricRepository.findRecentByPatientId(eq(1L), any(Pageable.class)))
                .thenReturn(List.of(metric(MetricType.BLOOD_SUGAR, "8.0", null, LocalDateTime.of(2026, 7, 3, 9, 30))));
        when(healthMetricRepository.findTop2ByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(1L,
                MetricType.BLOOD_SUGAR)).thenReturn(List.of(
                        metric(MetricType.BLOOD_SUGAR, "8.0", null, LocalDateTime.now()),
                        metric(MetricType.BLOOD_SUGAR, "7.0", null, LocalDateTime.now().minusDays(1))));

        DoctorPatientResponse response = doctorPatientService.getMyPatients(10L, null, null, null, pageable)
                .getContent()
                .get(0);

        assertEquals("8.0 mmol/L", response.getLatestGlucose());
        assertEquals("120/80 mmHg", response.getLatestBp());
        assertEquals("72 bpm", response.getLatestHeartRate());
        assertEquals("98 %", response.getLatestSpo2());
        assertEquals("text-rose-500", response.getTrendColor());
        assertEquals("O+", response.getBloodType());
        assertEquals(new BigDecimal("165.5"), response.getHeightCm());
    }

    @Test
    void getMyPatients_mapsDecreasingTrendAndMissingBloodPressureSecondary() {
        Pageable pageable = PageRequest.of(0, 10);
        when(patientRepository.findByDoctorIdAndFilters(10L, "", "", "", pageable))
                .thenReturn(new PageImpl<>(List.of(samplePatient)));
        when(healthMetricRepository.findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(1L,
                MetricType.BLOOD_PRESSURE)).thenReturn(Optional.of(metric(MetricType.BLOOD_PRESSURE, "118", null, LocalDateTime.now())));
        when(healthMetricRepository.findTop2ByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(1L,
                MetricType.BLOOD_SUGAR)).thenReturn(List.of(
                        metric(MetricType.BLOOD_SUGAR, "5.4", null, LocalDateTime.now()),
                        metric(MetricType.BLOOD_SUGAR, "6.3", null, LocalDateTime.now().minusDays(1))));

        DoctorPatientResponse response = doctorPatientService.getMyPatients(10L, null, null, null, pageable)
                .getContent()
                .get(0);

        assertEquals("118/? mmHg", response.getLatestBp());
        assertEquals("text-emerald-500", response.getTrendColor());
    }

    @Test
    void getMyPatients_mapsStableHighAndNormalTrendBoundaries() {
        Pageable pageable = PageRequest.of(0, 10);
        when(patientRepository.findByDoctorIdAndFilters(10L, "", "", "", pageable))
                .thenReturn(new PageImpl<>(List.of(samplePatient, patient(2L).build())));
        when(healthMetricRepository.findTop2ByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(1L,
                MetricType.BLOOD_SUGAR)).thenReturn(List.of(
                        metric(MetricType.BLOOD_SUGAR, "7.5", null, LocalDateTime.now()),
                        metric(MetricType.BLOOD_SUGAR, "7.2", null, LocalDateTime.now().minusDays(1))));
        when(healthMetricRepository.findTop2ByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(2L,
                MetricType.BLOOD_SUGAR)).thenReturn(List.of(
                        metric(MetricType.BLOOD_SUGAR, "6.0", null, LocalDateTime.now()),
                        metric(MetricType.BLOOD_SUGAR, "5.8", null, LocalDateTime.now().minusDays(1))));

        List<DoctorPatientResponse> responses = doctorPatientService.getMyPatients(10L, null, null, null, pageable)
                .getContent();

        assertEquals("text-amber-600", responses.get(0).getTrendColor());
        assertEquals("text-sky-500", responses.get(1).getTrendColor());
    }

    @Test
    void getMyPatients_metricRepositoriesThrow_fallsBackToDefaults() {
        Patient patient = patient(1L)
                .dateOfBirth(null)
                .build();
        Pageable pageable = PageRequest.of(0, 10);
        when(patientRepository.findByDoctorIdAndFilters(10L, "", "", "", pageable))
                .thenReturn(new PageImpl<>(List.of(patient)));
        when(healthMetricRepository.findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(anyLong(), any()))
                .thenThrow(new RuntimeException("metric store down"));
        when(healthMetricRepository.findRecentByPatientId(eq(1L), any(Pageable.class)))
                .thenThrow(new RuntimeException("recent down"));
        when(healthMetricRepository.findTop2ByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(1L,
                MetricType.BLOOD_SUGAR)).thenThrow(new RuntimeException("trend down"));

        DoctorPatientResponse response = doctorPatientService.getMyPatients(10L, null, null, null, pageable)
                .getContent()
                .get(0);

        assertEquals(0, response.getAge());
        assertEquals("N/A", response.getLatestGlucose());
        assertEquals("N/A", response.getLatestBp());
        assertEquals("N/A", response.getLatestHeartRate());
        assertEquals("N/A", response.getLatestSpo2());
        assertEquals("text-slate-400", response.getTrendColor());
    }

    @Test
    void getPatientDetail_mapsHistoryAndCalculatesPartialAdherence() {
        PatientProfileResponse profile = new PatientProfileResponse();
        profile.setId(1L);
        Prescription prescription = prescription();
        Appointment appointment = appointment();
        when(patientProfileService.getPatientProfileById(1L)).thenReturn(profile);
        when(healthMetricRepository.findRecentByPatientId(eq(1L), any(Pageable.class))).thenReturn(List.of(sampleMetric));
        when(prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(prescription));
        when(appointmentRepository.findByPatientIdOrderByAppointmentTimeDesc(1L)).thenReturn(List.of(appointment));
        when(userRepository.findById(10L)).thenReturn(Optional.of(User.builder().fullName("Dr Smith").build()));
        when(medicationLogRepository.findByPatientIdAndCreatedAtBetween(eq(1L), any(LocalDateTime.class),
                any(LocalDateTime.class))).thenReturn(List.of(
                        MedicationLog.builder().status(AppConstants.MED_STATUS_TAKEN).build(),
                        MedicationLog.builder().status(AppConstants.MED_STATUS_MISSED).build(),
                        MedicationLog.builder().status(AppConstants.MED_STATUS_TAKEN).build()));
        when(medicationScheduleRepository.findByPatientIdAndIsActiveTrue(1L)).thenReturn(List.of(
                MedicationSchedule.builder().medicationName("A").build(),
                MedicationSchedule.builder().medicationName("B").build()));

        DoctorPatientDetailResponse detail = doctorPatientService.getPatientDetail(1L);

        assertEquals(1, detail.getPrescriptionHistory().size());
        assertEquals("Dr Smith", detail.getPrescriptionHistory().get(0).getDoctorName());
        assertEquals("Med A", detail.getPrescriptionHistory().get(0).getItems().get(0).getMedicationName());
        assertEquals(1, detail.getAppointmentHistory().size());
        assertEquals("ONLINE", detail.getAppointmentHistory().get(0).getAppointmentType());
        assertEquals(100.0 / 7.0, detail.getAdherenceRate(), 0.0001);
    }

    @Test
    void getPatientDetail_adherenceRepositoryThrows_returnsZeroAndUnknownDoctor() {
        PatientProfileResponse profile = new PatientProfileResponse();
        profile.setId(1L);
        Prescription prescription = prescription();
        prescription.setCreatedAt(null);
        when(patientProfileService.getPatientProfileById(1L)).thenReturn(profile);
        when(healthMetricRepository.findRecentByPatientId(eq(1L), any(Pageable.class))).thenReturn(Collections.emptyList());
        when(prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(prescription));
        when(appointmentRepository.findByPatientIdOrderByAppointmentTimeDesc(1L)).thenReturn(Collections.emptyList());
        when(userRepository.findById(10L)).thenReturn(Optional.empty());
        when(medicationLogRepository.findByPatientIdAndCreatedAtBetween(eq(1L), any(LocalDateTime.class),
                any(LocalDateTime.class))).thenThrow(new RuntimeException("logs down"));

        DoctorPatientDetailResponse detail = doctorPatientService.getPatientDetail(1L);

        assertEquals("N/A", detail.getPrescriptionHistory().get(0).getDoctorName());
        assertNull(detail.getPrescriptionHistory().get(0).getCreatedDate());
        assertEquals(0.0, detail.getAdherenceRate());
    }

    private HealthMetric metric(MetricType type, String value, String secondary, LocalDateTime measuredAt) {
        return HealthMetric.builder()
                .id(100L)
                .metricType(type)
                .value(new BigDecimal(value))
                .valueSecondary(secondary == null ? null : new BigDecimal(secondary))
                .unit(type == MetricType.BLOOD_PRESSURE ? "mmHg" : "mmol/L")
                .status("NORMAL")
                .notes("note")
                .measuredAt(measuredAt)
                .build();
    }

    private Patient.PatientBuilder patient(Long id) {
        return Patient.builder()
                .id(id)
                .doctorId(10L)
                .patientCode("P00" + id)
                .fullName("Jane Doe")
                .gender("FEMALE")
                .phone("0987654321")
                .email("jane@example.com")
                .dateOfBirth(LocalDate.now().minusYears(40))
                .treatmentStatus("STABLE")
                .riskLevel("MONITORING");
    }

    private Prescription prescription() {
        Prescription prescription = Prescription.builder()
                .id(20L)
                .prescriptionCode("RX20")
                .doctorId(10L)
                .diagnosis("Diagnosis")
                .status(PrescriptionStatus.ACTIVE)
                .build();
        prescription.setCreatedAt(LocalDateTime.of(2026, 7, 1, 8, 0));
        prescription.addItem(PrescriptionItem.builder()
                .id(21L)
                .medicationName("Med A")
                .dosage("1 pill")
                .usageInstructions("After meal")
                .build());
        return prescription;
    }

    private Appointment appointment() {
        return Appointment.builder()
                .id(30L)
                .patient(samplePatient)
                .appointmentTime(LocalDateTime.of(2026, 7, 3, 10, 0))
                .endTime(LocalDateTime.of(2026, 7, 3, 10, 30))
                .type("ONLINE")
                .status(AppointmentStatus.SCHEDULED)
                .location("Room 1")
                .reason("Follow up")
                .meetingLink("https://meet.example")
                .diagnosisSummary("Stable")
                .doctorName("Dr Smith")
                .doctorSpecialty("Endocrinology")
                .doctorAvatarUrl("avatar.png")
                .build();
    }
}
