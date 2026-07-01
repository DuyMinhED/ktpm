package com.project.service.impl;

import com.project.dto.request.CreateAppointmentRequest;
import com.project.dto.request.CreateHealthMetricRequest;
import com.project.dto.request.PrescriptionItemRequest;
import com.project.dto.request.PrescriptionRequest;
import com.project.dto.response.HealthMetricResponse;
import com.project.dto.response.PatientAppointmentResponse;
import com.project.entity.*;
import com.project.repository.*;
import com.project.service.NotificationService;
import com.project.security.CustomUserDetails;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith({MockitoExtension.class, JiraBugSyncExtension.class})
public class CoreBusinessBvaTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClinicRepository clinicRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private HealthMetricRepository healthMetricRepository;

    @Mock
    private PatientAlertRepository patientAlertRepository;

    @Mock
    private SystemConfigRepository systemConfigRepository;

    @InjectMocks
    private PatientAppointmentServiceImpl appointmentService;

    @InjectMocks
    private PatientHealthMetricServiceImpl healthMetricService;

    private static Validator validator;

    private Patient patient;
    private User doctorUser;

    @BeforeAll
    public static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

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

        doctorUser = User.builder()
                .id(2L)
                .fullName("Doctor B")
                .specialization("Cardiology")
                .build();

        // Setup Security Context
        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        lenient().when(userDetails.getId()).thenReturn(100L);

        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    // Helper for mocking appointment save
    private void mockAppointmentDependencies() {
        lenient().when(patientRepository.findByUserId(100L)).thenReturn(Optional.of(patient));
        lenient().when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        lenient().when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appt = invocation.getArgument(0);
            appt.setId(50L);
            return appt;
        });
    }

    // Helper for mocking health metric save
    private void mockHealthMetricDependencies() {
        lenient().when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        lenient().when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        lenient().when(healthMetricRepository.save(any(HealthMetric.class))).thenAnswer(invocation -> {
            HealthMetric metric = invocation.getArgument(0);
            metric.setId(99L);
            metric.setMeasuredAt(LocalDateTime.now());
            return metric;
        });
    }

    // =========================================================================
    // 1. Appointment Dates - BVA Test Cases (TC-BVA-CORE-01 -> TC-BVA-CORE-04)
    // =========================================================================

    @Test
    void testAppointmentTime_MinMinus1_TC_BVA_CORE_01() {
        mockAppointmentDependencies();

        // Min limit is now + 3 hours. So min - 1 minute is now + 2 hours 59 minutes
        LocalDateTime invalidTime = LocalDateTime.now().plusHours(3).minusMinutes(1);

        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .doctorId(2L)
                .appointmentTime(invalidTime)
                .appointmentType("IN_PERSON")
                .reason("Tái khám")
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            appointmentService.create(request);
        }, "Should throw IllegalArgumentException: Appointment time must be at least 3 hours from now");

        assertEquals("Thời gian hẹn phải sau thời điểm hiện tại ít nhất 3 giờ", exception.getMessage());
    }

    @Test
    void testAppointmentTime_Min_TC_BVA_CORE_02() {
        mockAppointmentDependencies();

        // Min limit is now + 3 hours
        LocalDateTime validTime = LocalDateTime.now().plusHours(3);

        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .doctorId(2L)
                .appointmentTime(validTime)
                .appointmentType("IN_PERSON")
                .reason("Tái khám")
                .build();

        PatientAppointmentResponse response = appointmentService.create(request);
        assertNotNull(response);
        assertEquals(50L, response.getId());
    }

    @Test
    void testAppointmentTime_Max_TC_BVA_CORE_03() {
        mockAppointmentDependencies();

        // Max limit is now + 15 days
        LocalDateTime validTime = LocalDateTime.now().plusDays(15);

        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .doctorId(2L)
                .appointmentTime(validTime)
                .appointmentType("IN_PERSON")
                .reason("Tái khám")
                .build();

        PatientAppointmentResponse response = appointmentService.create(request);
        assertNotNull(response);
        assertEquals(50L, response.getId());
    }

    @Test
    void testAppointmentTime_MaxPlus1_TC_BVA_CORE_04() {
        mockAppointmentDependencies();

        // Max limit is now + 15 days. So max + 1 minute is now + 15 days 1 minute
        LocalDateTime invalidTime = LocalDateTime.now().plusDays(15).plusMinutes(1);

        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .doctorId(2L)
                .appointmentTime(invalidTime)
                .appointmentType("IN_PERSON")
                .reason("Tái khám")
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            appointmentService.create(request);
        }, "Should throw IllegalArgumentException: Appointment cannot be scheduled more than 15 days in advance");

        assertEquals("Chỉ được phép đặt lịch hẹn trước tối đa 15 ngày", exception.getMessage());
    }

    // =========================================================================
    // 2. Prescription Quantity/Items - BVA Test Cases (TC-BVA-CORE-05 -> TC-BVA-CORE-06)
    // =========================================================================

    @Test
    void testPrescriptionItems_MinMinus1_TC_BVA_CORE_05() {
        // Min items required is 1. Min - 1 is empty list (0 items)
        PrescriptionRequest request = new PrescriptionRequest();
        request.setPatientId(1L);
        request.setDiagnosis("Đau đầu");
        request.setItems(Collections.emptyList());

        Set<ConstraintViolation<PrescriptionRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Empty medication items should fail validation");
        
        boolean hasExpectedMessage = violations.stream()
                .anyMatch(v -> "At least one medication is required".equals(v.getMessage()));
        assertTrue(hasExpectedMessage, "Should trigger the validation message: At least one medication is required");
    }

    @Test
    void testPrescriptionItems_Min_TC_BVA_CORE_06() {
        // Min items required is 1.
        PrescriptionItemRequest item = new PrescriptionItemRequest();
        item.setMedicationName("Paracetamol");
        item.setDosage("500mg");

        PrescriptionRequest request = new PrescriptionRequest();
        request.setPatientId(1L);
        request.setDiagnosis("Đau đầu");
        request.setItems(Collections.singletonList(item));

        Set<ConstraintViolation<PrescriptionRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "One medication item should pass validation");
    }

    // =========================================================================
    // 3. Health Metric Values - BVA Test Cases (TC-BVA-CORE-07 -> TC-BVA-CORE-10)
    // =========================================================================

    @Test
    void testBloodSugar_MinMinus1_TC_BVA_CORE_07() {
        mockHealthMetricDependencies();

        // BLOOD_SUGAR normal threshold min is 4.0. So min - 1 is 3.9 -> Expected: LOW
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("3.9"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = healthMetricService.recordMetricForPatient(1L, request);
        assertEquals("LOW", response.getStatus());
    }

    @Test
    void testBloodSugar_Min_TC_BVA_CORE_08() {
        mockHealthMetricDependencies();

        // BLOOD_SUGAR normal threshold min is 4.0 -> Expected: NORMAL
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("4.0"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = healthMetricService.recordMetricForPatient(1L, request);
        assertEquals("NORMAL", response.getStatus());
    }

    @Test
    void testBloodSugar_Max_TC_BVA_CORE_09() {
        mockHealthMetricDependencies();

        // BLOOD_SUGAR normal threshold max is 6.0 -> Expected: NORMAL
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("6.0"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = healthMetricService.recordMetricForPatient(1L, request);
        assertEquals("NORMAL", response.getStatus());
    }

    @Test
    void testBloodSugar_MaxPlus1_TC_BVA_CORE_10() {
        mockHealthMetricDependencies();

        // BLOOD_SUGAR normal threshold max is 6.0. So max + 1 is 6.1 -> Expected: BORDERLINE_HIGH
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType(MetricType.BLOOD_SUGAR.name())
                .value(new BigDecimal("6.1"))
                .unit("mmol/L")
                .build();

        HealthMetricResponse response = healthMetricService.recordMetricForPatient(1L, request);
        assertEquals("BORDERLINE_HIGH", response.getStatus());
    }
}
