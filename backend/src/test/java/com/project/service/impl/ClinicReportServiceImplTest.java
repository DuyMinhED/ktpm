package com.project.service.impl;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.project.dto.response.ClinicReportResponse;
import com.project.entity.AppointmentStatus;
import com.project.entity.Patient;
import com.project.repository.AppointmentRepository;
import com.project.repository.PatientRepository;

@ExtendWith(MockitoExtension.class)
public class ClinicReportServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private ClinicReportServiceImpl service;

    // =========================================================================
    // getClinicReport()
    // =========================================================================

    @Test
    @DisplayName("getClinicReport — with appointments → real adherence rate")
    void getClinicReport_withAppointments() {
        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(50L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(5L);
        when(appointmentRepository.countByClinicIdAndCreatedAtAfter(eq(1L), any())).thenReturn(100L);
        when(appointmentRepository.countByClinicIdAndStatusAndCreatedAtAfter(eq(1L), eq(AppointmentStatus.COMPLETED), any())).thenReturn(80L);
        when(patientRepository.countRiskDistributionByCondition(1L)).thenReturn(Collections.emptyList());

        ClinicReportResponse response = service.getClinicReport(1L, "month");

        assertNotNull(response);
        assertEquals(1L, response.getClinicId());
        assertEquals(50L, response.getSummary().getTotalPatients());
        assertEquals(5L, response.getSummary().getHighRiskPatients());
        assertEquals(80.0, response.getSummary().getAdherenceRate(), 0.1);
    }

    @Test
    @DisplayName("getClinicReport — no appointments → fallback adherence 85%")
    void getClinicReport_noAppointments_fallbackAdherence() {
        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(10L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(0L);
        when(appointmentRepository.countByClinicIdAndCreatedAtAfter(eq(1L), any())).thenReturn(0L);
        when(appointmentRepository.countByClinicIdAndStatusAndCreatedAtAfter(eq(1L), eq(AppointmentStatus.COMPLETED), any())).thenReturn(0L);
        when(patientRepository.countRiskDistributionByCondition(1L)).thenReturn(Collections.emptyList());

        ClinicReportResponse response = service.getClinicReport(1L, "month");

        assertEquals(85.0, response.getSummary().getAdherenceRate(), 0.1);
    }

    @Test
    @DisplayName("getClinicReport — with risk distributions ≤ 3 → no 'Khác' category")
    void getClinicReport_fewDistributions() {
        List<Object[]> riskData = new java.util.ArrayList<>();
        riskData.add(new Object[]{"Tiểu đường", "HIGH", 5L});
        riskData.add(new Object[]{"Tiểu đường", "STABLE", 10L});
        riskData.add(new Object[]{"Huyết áp", "MODERATE", 8L});

        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(23L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(5L);
        when(appointmentRepository.countByClinicIdAndCreatedAtAfter(eq(1L), any())).thenReturn(50L);
        when(appointmentRepository.countByClinicIdAndStatusAndCreatedAtAfter(eq(1L), eq(AppointmentStatus.COMPLETED), any())).thenReturn(40L);
        when(patientRepository.countRiskDistributionByCondition(1L)).thenReturn(riskData);

        ClinicReportResponse response = service.getClinicReport(1L, "month");

        assertNotNull(response.getRiskDistributions());
        assertTrue(response.getRiskDistributions().size() <= 3);
        assertFalse(response.getRiskDistributions().stream().anyMatch(d -> "Khác".equals(d.getDiseaseName())));
    }

    @Test
    @DisplayName("getClinicReport — with risk distributions > 3 → 'Khác' category added")
    void getClinicReport_manyDistributions_otherCategory() {
        List<Object[]> riskData = new java.util.ArrayList<>();
        riskData.add(new Object[]{"Tiểu đường", "HIGH", 10L});
        riskData.add(new Object[]{"Huyết áp", "STABLE", 8L});
        riskData.add(new Object[]{"Tim mạch", "MODERATE", 6L});
        riskData.add(new Object[]{"Phổi", "HIGH", 4L});
        riskData.add(new Object[]{"Thận", "STABLE", 2L});

        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(30L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(14L);
        when(appointmentRepository.countByClinicIdAndCreatedAtAfter(eq(1L), any())).thenReturn(10L);
        when(appointmentRepository.countByClinicIdAndStatusAndCreatedAtAfter(eq(1L), eq(AppointmentStatus.COMPLETED), any())).thenReturn(8L);
        when(patientRepository.countRiskDistributionByCondition(1L)).thenReturn(riskData);

        ClinicReportResponse response = service.getClinicReport(1L, "month");

        assertEquals(4, response.getRiskDistributions().size());
        assertTrue(response.getRiskDistributions().stream().anyMatch(d -> "Khác".equals(d.getDiseaseName())));
    }

    @Test
    @DisplayName("getClinicReport — null condition in risk data → mapped to 'Khác'")
    void getClinicReport_nullCondition() {
        List<Object[]> riskData = new java.util.ArrayList<>();
        riskData.add(new Object[]{null, "HIGH", 3L});

        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(3L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(3L);
        when(appointmentRepository.countByClinicIdAndCreatedAtAfter(eq(1L), any())).thenReturn(0L);
        when(appointmentRepository.countByClinicIdAndStatusAndCreatedAtAfter(eq(1L), eq(AppointmentStatus.COMPLETED), any())).thenReturn(0L);
        when(patientRepository.countRiskDistributionByCondition(1L)).thenReturn(riskData);

        ClinicReportResponse response = service.getClinicReport(1L, "month");

        assertTrue(response.getRiskDistributions().stream().anyMatch(d -> "Khác".equals(d.getDiseaseName())));
    }

    // =========================================================================
    // getDiseaseDetailReport()
    // =========================================================================

    @Test
    @DisplayName("getDiseaseDetailReport → returns condition details")
    void getDiseaseDetailReport() {
        Patient patient = Patient.builder()
                .id(1L).fullName("Nguyen A").chronicCondition("Tiểu đường").build();

        Page<Patient> patientPage = new PageImpl<>(List.of(patient));
        when(patientRepository.findByClinicIdAndFilters(eq(1L), isNull(), eq("Tiểu đường"), anyString(), isNull(), isNull(), any(PageRequest.class)))
                .thenReturn(patientPage);
        when(patientRepository.countPatientsByDoctorIds(1L)).thenReturn(Collections.emptyList());

        Map<String, Object> result = service.getDiseaseDetailReport(1L, "Tiểu đường");

        assertNotNull(result);
        assertEquals("Tiểu đường", result.get("condition"));
        assertNotNull(result.get("topRiskPatients"));
    }

    @Test
    @DisplayName("getDiseaseDetailReport — no patients → empty lists")
    void getDiseaseDetailReport_noPatients() {
        Page<Patient> emptyPage = new PageImpl<>(Collections.emptyList());
        when(patientRepository.findByClinicIdAndFilters(eq(1L), isNull(), eq("Unknown"), anyString(), isNull(), isNull(), any(PageRequest.class)))
                .thenReturn(emptyPage);
        when(patientRepository.countPatientsByDoctorIds(1L)).thenReturn(Collections.emptyList());

        Map<String, Object> result = service.getDiseaseDetailReport(1L, "Unknown");

        assertEquals("Unknown", result.get("condition"));
        assertTrue(((List<?>) result.get("topRiskPatients")).isEmpty());
    }
}