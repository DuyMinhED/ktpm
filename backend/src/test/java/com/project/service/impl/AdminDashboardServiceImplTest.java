package com.project.service.impl;

import com.project.dto.response.AdminDashboardResponse;
import com.project.dto.response.AdminReportsResponse;
import com.project.dto.response.AuditLogResponse;
import com.project.entity.AuditLog;
import com.project.entity.Clinic;
import com.project.entity.UserRole;
import com.project.repository.AppointmentRepository;
import com.project.repository.AuditLogRepository;
import com.project.repository.ClinicRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminDashboardServiceImplTest {

    @Mock
    private ClinicRepository clinicRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private AdminDashboardServiceImpl service;

    @Test
    @DisplayName("getDashboardData - aggregates counters, top clinics, activities and monthly appointment chart")
    void getDashboardData_successWithMonthlyAppointmentChart() {
        Clinic clinic = Clinic.builder()
                .id(1L)
                .clinicCode("CL001")
                .name("Clinic A")
                .phone("0901")
                .status("ACTIVE")
                .build();

        AuditLog log = auditLog("CREATE", "CLINIC", "Created clinic");

        when(userRepository.countByRoleAndIsDeletedFalse(UserRole.PATIENT)).thenReturn(120L);
        when(clinicRepository.countByStatusAndIsDeletedFalse("ACTIVE")).thenReturn(4L);
        when(userRepository.countByRoleAndIsDeletedFalse(UserRole.DOCTOR)).thenReturn(18L);
        when(patientRepository.countByRiskLevelAndIsDeletedFalse(anyString())).thenReturn(7L);
        when(userRepository.countNewUsersBetween(eq(UserRole.PATIENT), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(30L, 15L);
        when(userRepository.countByRoleAndCreatedAtBetweenGroupedByClinic(eq(UserRole.DOCTOR), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(rows(new Object[]{1L, 2L}));

        when(clinicRepository.findByFilters(eq("ACTIVE"), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(clinic)));
        when(userRepository.countByRoleGroupedByClinic(UserRole.DOCTOR))
                .thenReturn(rows(new Object[]{1L, 3L}));
        when(userRepository.countByRoleGroupedByClinic(UserRole.PATIENT))
                .thenReturn(rows(new Object[]{1L, 20L}));
        when(userRepository.countByRoleAndCreatedAtBetweenGroupedByClinic(eq(UserRole.PATIENT), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(rows(new Object[]{1L, 5L}));
        when(auditLogRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(log)));
        when(appointmentRepository.countAllAppointmentsByMonthNative(any(LocalDateTime.class)))
                .thenReturn(rows(new Object[]{"2026-01-01", 3L}, new Object[]{"2026-12-01", 9L}));

        AdminDashboardResponse response = service.getDashboardData("MONTH", "appointments");

        assertEquals(120L, response.getStats().getTotalPatients());
        assertEquals(4L, response.getStats().getActiveClinics());
        assertEquals(18L, response.getStats().getTotalDoctors());
        assertEquals(7L, response.getStats().getHighRiskAlerts());
        assertTrue(response.getStats().getPatientGrowth().startsWith("+100"));
        assertTrue(response.getStats().getDoctorTrend().startsWith("+2"));
        assertEquals(1, response.getClinicPerformances().size());
        assertEquals(20L, response.getClinicPerformances().get(0).getPatientCount());
        assertEquals(3L, response.getClinicPerformances().get(0).getDoctorCount());
        assertEquals(1, response.getRecentActivities().size());
        assertEquals("emerald", response.getRecentActivities().get(0).getColor());
        assertEquals(12, response.getChartData().size());
        assertEquals(3L, response.getChartData().get(0).getValue());
    }

    @Test
    @DisplayName("getDashboardData - handles repository failures with default dashboard")
    void getDashboardData_repositoryFailureFallsBack() {
        when(userRepository.countByRoleAndIsDeletedFalse(UserRole.PATIENT)).thenThrow(new RuntimeException("count failed"));
        when(clinicRepository.countByStatusAndIsDeletedFalse("ACTIVE")).thenThrow(new RuntimeException("clinic failed"));
        when(patientRepository.countByRiskLevelAndIsDeletedFalse(anyString())).thenThrow(new RuntimeException("risk failed"));
        when(userRepository.countNewUsersBetween(eq(UserRole.PATIENT), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("growth failed"));
        when(userRepository.countByRoleAndCreatedAtBetweenGroupedByClinic(eq(UserRole.DOCTOR), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("doctor trend failed"));
        when(clinicRepository.findByFilters(eq("ACTIVE"), eq(null), any(Pageable.class)))
                .thenThrow(new RuntimeException("top clinics failed"));
        when(auditLogRepository.findAll(any(Pageable.class))).thenThrow(new RuntimeException("activities failed"));
        when(userRepository.countNewPatientsByDayNative(any(LocalDateTime.class))).thenThrow(new RuntimeException("chart failed"));

        AdminDashboardResponse response = service.getDashboardData("DAY", "Lượng bệnh nhân");

        assertNotNull(response.getStats());
        assertEquals(0L, response.getStats().getTotalPatients());
        assertEquals("+0%", response.getStats().getPatientGrowth());
        assertTrue(response.getClinicPerformances().isEmpty());
        assertTrue(response.getRecentActivities().isEmpty());
        assertTrue(response.getChartData().isEmpty());
    }

    @Test
    @DisplayName("getReportsData - builds clinic breakdown, performances and analytics")
    void getReportsData_success() {
        Clinic clinicA = Clinic.builder().id(1L).name("Clinic A").status("ACTIVE").build();
        Clinic clinicB = Clinic.builder().id(2L).name("Clinic B").status("ACTIVE").build();

        when(clinicRepository.findAllActive()).thenReturn(List.of(clinicA, clinicB));
        when(userRepository.countByRoleGroupedByClinic(UserRole.PATIENT))
                .thenReturn(rows(new Object[]{1L, 80L}, new Object[]{2L, 20L}));
        when(appointmentRepository.countTotalAppointmentsByClinicNative())
                .thenReturn(rows(new Object[]{1L, 40L}, new Object[]{2L, 10L}));
        when(appointmentRepository.calculateComplianceRateByClinicNative())
                .thenReturn(rows(new Object[]{1L, 95.0}, new Object[]{2L, 70.0}));
        when(appointmentRepository.countNewBookingsByClinicNative(any(LocalDateTime.class)))
                .thenReturn(rows(new Object[]{1L, 8L}, new Object[]{2L, 2L}));
        when(appointmentRepository.calculateAverageConsultationTime()).thenReturn(31.6);
        when(appointmentRepository.countPatientsWithAnyCompletedAppointments()).thenReturn(50L);
        when(appointmentRepository.countPatientsWithMultipleCompletedAppointments()).thenReturn(10L);
        when(appointmentRepository.countPatientsWithRecentCompletedAppointments(any(LocalDateTime.class))).thenReturn(20L);
        when(userRepository.countNewPatientsByMonthNative(any(LocalDateTime.class)))
                .thenReturn(rows(new Object[]{"2026-01-01", 4L}, new Object[]{"2026-12-01", 12L}));

        AdminReportsResponse response = service.getReportsData("MONTH", "ALL");

        assertEquals("32", response.getSummary().getAvgTime());
        assertTrue(response.getSummary().getReturnRate().startsWith("20"));
        assertTrue(response.getSummary().getRetentionRate().startsWith("40"));
        assertEquals("84", response.getSummary().getNps());
        assertEquals(2, response.getClinicBreakdown().size());
        assertEquals("80%", response.getClinicBreakdown().get(0).getPercentage());
        assertEquals(2, response.getClinicPerformances().size());
        assertEquals("+8", response.getClinicPerformances().get(0).getAppointments());
        assertTrue(response.getAnalytics().getReturnRate().startsWith("20"));
        assertFalse(response.getGrowthTrend().isEmpty());
    }

    @Test
    @DisplayName("getReportsData - filters stable and attention-needed clinics by compliance boundary")
    void getReportsData_performanceFilterBoundaries() {
        Clinic stableClinic = Clinic.builder().id(1L).name("Stable").build();
        Clinic attentionClinic = Clinic.builder().id(2L).name("Attention").build();

        when(clinicRepository.findAllActive()).thenReturn(List.of(stableClinic, attentionClinic));
        when(userRepository.countByRoleGroupedByClinic(UserRole.PATIENT)).thenReturn(List.of());
        when(appointmentRepository.countTotalAppointmentsByClinicNative()).thenReturn(List.of());
        when(appointmentRepository.calculateComplianceRateByClinicNative())
                .thenReturn(rows(new Object[]{1L, 75.0}, new Object[]{2L, 74.9}));
        when(appointmentRepository.countNewBookingsByClinicNative(any(LocalDateTime.class))).thenReturn(List.of());
        when(appointmentRepository.calculateAverageConsultationTime()).thenReturn(0.0);
        when(appointmentRepository.countPatientsWithAnyCompletedAppointments()).thenReturn(0L);
        when(appointmentRepository.countPatientsWithMultipleCompletedAppointments()).thenReturn(0L);
        when(appointmentRepository.countPatientsWithRecentCompletedAppointments(any(LocalDateTime.class))).thenReturn(0L);
        when(appointmentRepository.countAllAppointmentsByYearNative(any(LocalDateTime.class))).thenReturn(List.of());
        when(userRepository.countNewPatientsByYearNative(any(LocalDateTime.class))).thenReturn(List.of());

        AdminReportsResponse stable = service.getReportsData("YEAR", "ỔN ĐỊNH");
        AdminReportsResponse attention = service.getReportsData("YEAR", "CẦN LƯU Ý");

        assertEquals(1, stable.getClinicPerformances().size());
        assertEquals("Stable", stable.getClinicPerformances().get(0).getName());
        assertEquals(1, attention.getClinicPerformances().size());
        assertEquals("Attention", attention.getClinicPerformances().get(0).getName());
        assertEquals("77", stable.getSummary().getNps());
    }

    @Test
    @DisplayName("getReportsData - returns empty fallback when report generation fails")
    void getReportsData_failureFallback() {
        when(clinicRepository.findAllActive()).thenThrow(new RuntimeException("db down"));

        AdminReportsResponse response = service.getReportsData("MONTH", "ALL");

        assertEquals("0", response.getSummary().getNps());
        assertEquals("N/A", response.getAnalytics().getPeakMonth());
        assertTrue(response.getClinicBreakdown().isEmpty());
        assertTrue(response.getClinicPerformances().isEmpty());
        assertTrue(response.getGrowthTrend().isEmpty());
    }

    @Test
    @DisplayName("getAuditLogs - maps entity page to response and wraps keyword")
    void getAuditLogs_mapsPage() {
        AuditLog log = auditLog("LOGIN", "USER", "Signed in");
        when(auditLogRepository.findByFilters(eq(null), eq(null), eq("%signed%"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(log)));

        Page<AuditLogResponse> response = service.getAuditLogs("ignored", "ignored", "Signed", PageRequest.of(0, 10));

        assertEquals(1, response.getTotalElements());
        assertEquals("LOGIN", response.getContent().get(0).getAction());
        assertEquals("USER", response.getContent().get(0).getModule());
        assertEquals("Tester", response.getContent().get(0).getUser().getName());
        verify(auditLogRepository).findByFilters(eq(null), eq(null), eq("%signed%"), any(Pageable.class));
    }

    private static AuditLog auditLog(String action, String module, String details) {
        AuditLog log = AuditLog.builder()
                .id(11L)
                .userId(7L)
                .userName("Tester")
                .userAvatar("avatar.png")
                .action(action)
                .module(module)
                .details(details)
                .ipAddress("127.0.0.1")
                .status("success")
                .build();
        log.setCreatedAt(LocalDateTime.of(2026, 7, 2, 9, 30));
        return log;
    }

    private static List<Object[]> rows(Object[]... rows) {
        return List.of(rows);
    }
}
