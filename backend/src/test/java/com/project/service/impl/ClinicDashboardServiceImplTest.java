package com.project.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;

import com.project.dto.request.DoctorCreateAppointmentRequest;
import com.project.dto.request.UpdateClinicRequest;
import com.project.dto.response.ClinicAppointmentResponse;
import com.project.dto.response.ClinicDashboardResponse;
import com.project.dto.response.ClinicResponse;
import com.project.entity.Appointment;
import com.project.entity.AppointmentStatus;
import com.project.entity.Clinic;
import com.project.entity.Notification;
import com.project.entity.Patient;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.AppointmentRepository;
import com.project.repository.ClinicRepository;
import com.project.repository.NotificationRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.service.ClinicalAnalyticsService;
import com.project.util.AppConstants;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ClinicDashboardServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private ClinicalAnalyticsService clinicalAnalyticsService;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ClinicRepository clinicRepository;

    @InjectMocks
    private ClinicDashboardServiceImpl service;

    private Clinic sampleClinic;

    @BeforeEach
    void setUp() {
        sampleClinic = Clinic.builder()
                .id(1L)
                .name("Phòng khám ABC")
                .address("123 HCM")
                .phone("028123456")
                .email("info@abc.com")
                .description("Mô tả")
                .imageUrl("https://img.com/logo.jpg")
                .status("ACTIVE")
                .build();
    }

    // =========================================================================
    // getClinicDetails()
    // =========================================================================

    @Test
    @DisplayName("getClinicDetails — found → returns ClinicResponse")
    void getClinicDetails_found() {
        when(clinicRepository.findById(1L)).thenReturn(Optional.of(sampleClinic));

        ClinicResponse response = service.getClinicDetails(1L);

        assertEquals("Phòng khám ABC", response.getName());
        assertEquals("123 HCM", response.getAddress());
        assertEquals("028123456", response.getPhone());
        assertEquals("info@abc.com", response.getEmail());
    }

    @Test
    @DisplayName("getClinicDetails — not found → RuntimeException")
    void getClinicDetails_notFound() {
        when(clinicRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getClinicDetails(999L));
    }

    // =========================================================================
    // updateClinicDetails()
    // =========================================================================

    @Test
    @DisplayName("updateClinicDetails — valid request → updates all fields")
    void updateClinicDetails_success() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        request.setName("Updated Name");
        request.setAddress("456 HN");
        request.setPhone("024999888");
        request.setEmail("new@abc.com");
        request.setDescription("New desc");
        request.setImageUrl("https://img.com/new.jpg");

        when(clinicRepository.findById(1L)).thenReturn(Optional.of(sampleClinic));

        service.updateClinicDetails(1L, request);

        assertEquals("Updated Name", sampleClinic.getName());
        assertEquals("456 HN", sampleClinic.getAddress());
        assertEquals("024999888", sampleClinic.getPhone());
        verify(clinicRepository).save(sampleClinic);
    }

    @Test
    @DisplayName("updateClinicDetails — clinic not found → exception")
    void updateClinicDetails_notFound() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        when(clinicRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> service.updateClinicDetails(999L, request));
    }

    // =========================================================================
    // updateAppointmentStatus()
    // =========================================================================

    @Test
    @DisplayName("updateAppointmentStatus — doctor belongs to clinic → authorized")
    void updateAppointmentStatus_authorizedByDoctor() {
        Patient patient = Patient.builder().id(1L).userId(1L).fullName("P").phone("0").gender("M").clinicId(1L).build();
        Appointment appointment = Appointment.builder()
                .id(10L).doctorId(5L).patient(patient)
                .status(AppointmentStatus.PENDING).build();

        User doctor = User.builder().id(5L).clinicId(1L).build();

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        assertDoesNotThrow(() -> service.updateAppointmentStatus(1L, 10L, "SCHEDULED"));
        assertEquals(AppointmentStatus.SCHEDULED, appointment.getStatus());
    }

    @Test
    @DisplayName("updateAppointmentStatus — patient belongs to clinic → authorized")
    void updateAppointmentStatus_authorizedByPatient() {
        Patient patient = Patient.builder().id(1L).userId(1L).fullName("P").phone("0").gender("M").clinicId(1L).build();
        Appointment appointment = Appointment.builder()
                .id(10L).doctorId(5L).patient(patient)
                .status(AppointmentStatus.PENDING).build();

        User doctorOtherClinic = User.builder().id(5L).clinicId(99L).build();

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctorOtherClinic));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        assertDoesNotThrow(() -> service.updateAppointmentStatus(1L, 10L, "CANCELLED"));
    }

    @Test
    @DisplayName("updateAppointmentStatus — unauthorized → AccessDeniedException")
    void updateAppointmentStatus_unauthorized() {
        Patient patient = Patient.builder().id(1L).userId(1L).fullName("P").phone("0").gender("M").clinicId(99L).build();
        Appointment appointment = Appointment.builder()
                .id(10L).doctorId(5L).patient(patient)
                .status(AppointmentStatus.PENDING).build();

        User doctorOtherClinic = User.builder().id(5L).clinicId(88L).build();

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctorOtherClinic));

        assertThrows(AccessDeniedException.class, () -> service.updateAppointmentStatus(1L, 10L, "SCHEDULED"));
    }

    @Test
    @DisplayName("updateAppointmentStatus — appointment not found → ResourceNotFoundException")
    void updateAppointmentStatus_notFound() {
        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.updateAppointmentStatus(1L, 999L, "SCHEDULED"));
    }

    @Test
    @DisplayName("updateAppointmentStatus — doctorId null, patient authorized → OK")
    void updateAppointmentStatus_doctorNull_patientAuthorized() {
        Patient patient = Patient.builder().id(1L).userId(1L).fullName("P").phone("0").gender("M").clinicId(1L).build();
        Appointment appointment = Appointment.builder()
                .id(10L).doctorId(null).patient(patient)
                .status(AppointmentStatus.PENDING).build();

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        assertDoesNotThrow(() -> service.updateAppointmentStatus(1L, 10L, "COMPLETED"));
    }

    // =========================================================================
    // getDashboardData()
    // =========================================================================

    @Test
    @DisplayName("getDashboardData - 7d period aggregates charts, diseases, risks and doctor performance")
    void getDashboardData_7d_success() {
        Patient riskPatient = patient(1L, 1L, 5L);
        User doctor = doctor(5L, 1L, "Dr. A");
        String today = LocalDate.now().toString();

        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(20L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString()))
                .thenAnswer(invocation -> AppConstants.RISK_HIGH.equals(invocation.getArgument(1)) ? 4L : 6L);
        when(patientRepository.countPatientsByChronicCondition(1L)).thenReturn(rows(new Object[]{AppConstants.CONDITION_DIABETES, 10L}));
        when(clinicalAnalyticsService.getClinicInsights(1L)).thenReturn(List.of("Insight A"));
        when(appointmentRepository.calculateAverageConsultationTimeByClinic(1L)).thenReturn(25.0);
        when(appointmentRepository.calculateAdherenceRateByClinic(1L)).thenReturn(82.5);
        when(patientRepository.countDailyPatients(eq(1L), any(LocalDateTime.class))).thenReturn(rows(new Object[]{today, 3L}));
        when(patientRepository.countDailyHighRiskPatients(eq(1L), eq(AppConstants.RISK_HIGH), any(LocalDateTime.class))).thenReturn(rows(new Object[]{today, 1L}));
        when(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(1L, UserRole.DOCTOR)).thenReturn(List.of(doctor));
        when(appointmentRepository.countDailyAppointmentsByDoctorIds(eq(List.of(5L)), any(LocalDateTime.class))).thenReturn(rows(new Object[]{today, 5L}));
        when(patientRepository.findByClinicIdAndFilters(eq(1L), eq(null), eq(null), eq(AppConstants.RISK_HIGH), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(riskPatient)));
        when(patientRepository.countByClinicIdAndCreatedAtBetweenAndIsDeletedFalse(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(10L);
        when(patientRepository.countByClinicIdAndRiskLevelAndCreatedAtBetweenAndIsDeletedFalse(eq(1L), eq(AppConstants.RISK_HIGH), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(2L);
        when(patientRepository.countRiskDistributionByCondition(1L)).thenReturn(rows(
                new Object[]{AppConstants.CONDITION_DIABETES, AppConstants.RISK_HIGH, 6L},
                new Object[]{AppConstants.CONDITION_DIABETES, AppConstants.RISK_LOW, 4L}));
        when(patientRepository.countByClinicIdAndTreatmentStatusAndIsDeletedFalse(eq(1L), anyString())).thenReturn(5L);
        when(appointmentRepository.countByDoctorIdAndStatus(5L, AppointmentStatus.PENDING)).thenReturn(7L);

        ClinicDashboardResponse response = service.getDashboardData(1L, "7d");

        assertEquals(20L, response.getTotalPatients());
        assertEquals(4L, response.getHighRiskAlerts());
        assertEquals(6L, response.getPendingFollowUps());
        assertEquals(82.5, response.getAdherenceRate());
        assertEquals(25.0, response.getImprovementRate());
        assertEquals(25.0, response.getAvgConsultationTime());
        assertEquals(7, response.getPatientGrowthChart().size());
        assertEquals(7, response.getDoctorLoadChart().size());
        assertEquals(7, response.getRiskIndexChart().size());
        assertEquals(1, response.getRiskPatients().size());
        assertEquals(1, response.getDiseaseRatios().size());
        assertEquals(1, response.getDiseaseAnalytics().size());
        assertEquals(1, response.getDoctorPerformances().size());
        assertEquals(7, response.getDoctorPerformances().get(0).getLoad());
        assertTrue(response.getPatientGrowth().startsWith("+100"));
        assertNotNull(response.getGrowthStats().getPeakMonth());
    }

    @Test
    @DisplayName("getDashboardData - monthly period handles empty doctors and trend query failures")
    void getDashboardData_monthly_emptyDoctorAndTrendFailure() {
        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(0L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(0L);
        when(patientRepository.countPatientsByChronicCondition(1L)).thenReturn(List.of());
        when(clinicalAnalyticsService.getClinicInsights(1L)).thenReturn(List.of());
        when(appointmentRepository.calculateAverageConsultationTimeByClinic(1L)).thenReturn(0.0);
        when(appointmentRepository.calculateAdherenceRateByClinic(1L)).thenReturn(0.0);
        when(patientRepository.countMonthlyPatients(eq(1L), any(LocalDateTime.class))).thenReturn(rows(new Object[]{2026, 7, 2L}));
        when(patientRepository.countMonthlyHighRiskPatients(eq(1L), eq(AppConstants.RISK_HIGH), any(LocalDateTime.class))).thenReturn(List.of());
        when(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(1L, UserRole.DOCTOR)).thenReturn(List.of());
        when(patientRepository.findByClinicIdAndFilters(eq(1L), eq(null), eq(null), eq(AppConstants.RISK_HIGH), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(patientRepository.countByClinicIdAndCreatedAtBetweenAndIsDeletedFalse(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("trend failed"));
        when(patientRepository.countRiskDistributionByCondition(1L)).thenReturn(List.of());
        when(patientRepository.countByClinicIdAndTreatmentStatusAndIsDeletedFalse(eq(1L), anyString())).thenReturn(0L);

        ClinicDashboardResponse response = service.getDashboardData(1L, "6m");

        assertEquals(0L, response.getTotalPatients());
        assertEquals("0%", response.getHighRiskGrowth());
        assertEquals(6, response.getPatientGrowthChart().size());
        assertTrue(response.getDoctorLoadChart().stream().allMatch(p -> p.getValue() == 0));
        assertTrue(response.getRiskPatients().isEmpty());
        assertTrue(response.getDoctorPerformances().isEmpty());
    }

    // =========================================================================
    // getAppointmentRecords()
    // =========================================================================

    @Test
    @DisplayName("getAppointmentRecords - resolves doctor fallback from user map and patient avatars")
    void getAppointmentRecords_mapsDoctorAndPatientData() {
        Patient patient = patient(1L, 1L, 5L);
        Appointment appointment = Appointment.builder()
                .id(20L)
                .doctorId(5L)
                .doctorName("N/A")
                .patient(patient)
                .appointmentTime(LocalDateTime.of(2026, 7, 4, 9, 0))
                .status(AppointmentStatus.SCHEDULED)
                .type("ONLINE")
                .reason("Follow up")
                .build();
        when(appointmentRepository.findByClinicId(eq(1L), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(appointment)));
        when(userRepository.findAllById(List.of(5L))).thenReturn(List.of(doctor(5L, 1L, "Dr. Fallback")));

        Page<ClinicAppointmentResponse> page = service.getAppointmentRecords(1L, PageRequest.of(0, 10));

        assertEquals(1, page.getTotalElements());
        assertEquals("Patient 1", page.getContent().get(0).getPatientName());
        assertEquals("Dr. Fallback", page.getContent().get(0).getDoctorName());
        assertEquals("ONLINE", page.getContent().get(0).getAppointmentType());
        assertEquals(1L, page.getContent().get(0).getPatientId());
        assertEquals("avatar-1.png", page.getContent().get(0).getPatientAvatarUrl());
    }

    @Test
    @DisplayName("getAppointmentRecords - handles null patient and empty doctor ids")
    void getAppointmentRecords_nullPatient() {
        Appointment appointment = Appointment.builder()
                .id(21L)
                .doctorId(null)
                .doctorName(null)
                .patient(null)
                .appointmentTime(LocalDateTime.of(2026, 7, 4, 9, 0))
                .status(AppointmentStatus.PENDING)
                .type("OFFLINE")
                .build();
        when(appointmentRepository.findByClinicId(eq(1L), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(appointment)));

        Page<ClinicAppointmentResponse> page = service.getAppointmentRecords(1L, PageRequest.of(0, 10));

        assertEquals("N/A", page.getContent().get(0).getPatientName());
        assertEquals("N/A", page.getContent().get(0).getDoctorName());
        assertEquals("", page.getContent().get(0).getPatientAvatarUrl());
    }

    // =========================================================================
    // createAppointment()
    // =========================================================================

    @Test
    @DisplayName("createAppointment - online request assigns first clinic doctor and default meeting link")
    void createAppointment_onlineAssignsDoctor() {
        Patient patient = patient(1L, 1L, null);
        User doctor = doctor(5L, 1L, "Dr. Assigned");
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(1L, UserRole.DOCTOR)).thenReturn(List.of(doctor));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctor));

        service.createAppointment(1L, appointmentRequest(1L, "ONLINE", ""));

        assertEquals(5L, patient.getDoctorId());
        verify(patientRepository).save(patient);
        ArgumentCaptor<Appointment> captor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(captor.capture());
        Appointment saved = captor.getValue();
        assertEquals(5L, saved.getDoctorId());
        assertEquals("Dr. Assigned", saved.getDoctorName());
        assertEquals(AppointmentStatus.SCHEDULED, saved.getStatus());
        assertTrue(saved.getMeetingLink().startsWith("https://"));
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("createAppointment - rejects patient outside clinic and missing clinic doctors")
    void createAppointment_rejectsInvalidClinicOrNoDoctor() {
        Patient outsideClinicPatient = patient(1L, 99L, null);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(outsideClinicPatient));

        assertThrows(AccessDeniedException.class, () -> service.createAppointment(1L, appointmentRequest(1L, "OFFLINE", null)));

        Patient noDoctorPatient = patient(2L, 1L, null);
        when(patientRepository.findById(2L)).thenReturn(Optional.of(noDoctorPatient));
        when(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(1L, UserRole.DOCTOR)).thenReturn(List.of());

        assertThrows(RuntimeException.class, () -> service.createAppointment(1L, appointmentRequest(2L, "OFFLINE", null)));
    }

    // =========================================================================
    // updateAppointment()
    // =========================================================================

    @Test
    @DisplayName("updateAppointment - offline request clears meeting link and notifies patient")
    void updateAppointment_offlineClearsMeetingLink() {
        Patient patient = patient(1L, 1L, 5L);
        Appointment appointment = Appointment.builder()
                .id(30L)
                .patient(patient)
                .doctorId(5L)
                .appointmentTime(LocalDateTime.of(2026, 7, 4, 9, 0))
                .status(AppointmentStatus.PENDING)
                .type("ONLINE")
                .meetingLink("https://old")
                .build();
        when(appointmentRepository.findById(30L)).thenReturn(Optional.of(appointment));

        service.updateAppointment(1L, 30L, appointmentRequest(1L, "OFFLINE", null));

        assertEquals("OFFLINE", appointment.getType());
        assertEquals(AppointmentStatus.SCHEDULED, appointment.getStatus());
        assertEquals(null, appointment.getMeetingLink());
        verify(appointmentRepository).save(appointment);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("updateAppointment - rejects unauthorized or completed appointments")
    void updateAppointment_rejectsUnauthorizedOrCompleted() {
        Appointment unauthorized = Appointment.builder()
                .id(31L)
                .patient(patient(1L, 99L, 5L))
                .doctorId(5L)
                .status(AppointmentStatus.PENDING)
                .build();
        Appointment completed = Appointment.builder()
                .id(32L)
                .patient(patient(2L, 1L, 5L))
                .doctorId(5L)
                .status(AppointmentStatus.COMPLETED)
                .build();

        when(appointmentRepository.findById(31L)).thenReturn(Optional.of(unauthorized));
        when(appointmentRepository.findById(32L)).thenReturn(Optional.of(completed));

        assertThrows(AccessDeniedException.class, () -> service.updateAppointment(1L, 31L, appointmentRequest(1L, "ONLINE", "https://meet")));
        assertThrows(IllegalArgumentException.class, () -> service.updateAppointment(1L, 32L, appointmentRequest(2L, "ONLINE", "https://meet")));
    }

    // =========================================================================
    // batchReschedule()
    // =========================================================================

    @Test
    @DisplayName("batchReschedule - returns zero when no appointments found")
    void batchReschedule_empty() {
        LocalDate source = LocalDate.of(2026, 7, 4);
        LocalDate target = LocalDate.of(2026, 7, 6);
        when(appointmentRepository.findByClinicIdAndDateRangeAndStatuses(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class), any()))
                .thenReturn(List.of());

        assertEquals(0, service.batchReschedule(1L, source, target));
    }

    @Test
    @DisplayName("batchReschedule - shifts start/end time and continues when notification fails")
    void batchReschedule_shiftsAppointmentsAndHandlesNotificationFailure() {
        LocalDate source = LocalDate.of(2026, 7, 4);
        LocalDate target = LocalDate.of(2026, 7, 6);
        Appointment appointment = Appointment.builder()
                .id(40L)
                .patient(patient(1L, 1L, 5L))
                .doctorId(5L)
                .appointmentTime(LocalDateTime.of(2026, 7, 4, 10, 0))
                .endTime(LocalDateTime.of(2026, 7, 4, 10, 30))
                .status(AppointmentStatus.PENDING)
                .build();
        when(appointmentRepository.findByClinicIdAndDateRangeAndStatuses(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class), any()))
                .thenReturn(List.of(appointment));
        doThrow(new RuntimeException("notify failed")).when(notificationRepository).save(any(Notification.class));

        int updated = service.batchReschedule(1L, source, target);

        assertEquals(1, updated);
        assertEquals(LocalDateTime.of(2026, 7, 6, 10, 0), appointment.getAppointmentTime());
        assertEquals(LocalDateTime.of(2026, 7, 6, 10, 30), appointment.getEndTime());
        assertEquals(AppointmentStatus.SCHEDULED, appointment.getStatus());
        verify(appointmentRepository).save(appointment);
    }

    private static Patient patient(Long id, Long clinicId, Long doctorId) {
        return Patient.builder()
                .id(id)
                .userId(id + 100)
                .clinicId(clinicId)
                .doctorId(doctorId)
                .fullName("Patient " + id)
                .phone("090000000" + id)
                .gender("M")
                .avatarUrl("avatar-" + id + ".png")
                .chronicCondition(AppConstants.CONDITION_DIABETES)
                .riskLevel(AppConstants.RISK_HIGH)
                .build();
    }

    private static User doctor(Long id, Long clinicId, String name) {
        return User.builder()
                .id(id)
                .clinicId(clinicId)
                .role(UserRole.DOCTOR)
                .fullName(name)
                .avatarUrl("doctor-" + id + ".png")
                .specialization("Cardiology")
                .build();
    }

    private static DoctorCreateAppointmentRequest appointmentRequest(Long patientId, String type, String meetingLink) {
        return DoctorCreateAppointmentRequest.builder()
                .patientId(patientId)
                .appointmentDate("2026-07-10")
                .appointmentTime("09:30")
                .type(type)
                .notes("Follow up")
                .meetingLink(meetingLink)
                .build();
    }

    private static List<Object[]> rows(Object[]... rows) {
        return List.of(rows);
    }
}
