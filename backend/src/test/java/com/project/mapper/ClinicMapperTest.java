package com.project.mapper;

import com.project.dto.response.AdminClinicResponse;
import com.project.dto.response.ClinicDashboardResponse;
import com.project.entity.Clinic;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ClinicMapperTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private ClinicMapper clinicMapper;

    @Test
    @DisplayName("toGrowthStats → returns hardcoded growth data")
    void toGrowthStats() {
        ClinicDashboardResponse.GrowthStatsDto result = clinicMapper.toGrowthStats();

        assertNotNull(result);
        assertEquals("+12.5%", result.getGrowth());
        assertEquals("180 ca/tháng", result.getAverage());
        assertEquals("Tháng 3 (224 ca)", result.getPeakMonth());
    }

    @Test
    @DisplayName("toAdminClinicResponse — manager found by managerId")
    void toAdminClinicResponse_managerFound() {
        Clinic clinic = Clinic.builder()
                .id(1L).clinicCode("PK001").name("Clinic A")
                .address("HCM").phone("028123").status("ACTIVE").managerId(10L)
                .build();

        User manager = User.builder()
                .id(10L).fullName("Manager A").email("manager@abc.com").build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(manager));
        when(userRepository.countByRoleAndClinicIdAndIsDeletedFalse(UserRole.DOCTOR, 1L)).thenReturn(5L);
        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(100L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(3L);

        AdminClinicResponse response = clinicMapper.toAdminClinicResponse(clinic);

        assertEquals("Manager A", response.getManagerName());
        assertEquals("manager@abc.com", response.getManagerEmail());
        assertEquals(5, response.getDoctorCount());
        assertEquals(100, response.getPatientCount());
        assertEquals(3, response.getHighRiskPatientCount());
    }

    @Test
    @DisplayName("toAdminClinicResponse — managerId null, fallback to role query")
    void toAdminClinicResponse_managerIdNull_fallbackQuery() {
        Clinic clinic = Clinic.builder()
                .id(1L).clinicCode("PK002").name("Clinic B")
                .status("ACTIVE").managerId(null)
                .build();

        User fallbackManager = User.builder()
                .id(20L).fullName("Fallback Manager").email("fallback@abc.com").build();

        when(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(1L, UserRole.CLINIC_MANAGER))
                .thenReturn(List.of(fallbackManager));
        when(userRepository.countByRoleAndClinicIdAndIsDeletedFalse(UserRole.DOCTOR, 1L)).thenReturn(0L);
        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(0L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(0L);

        AdminClinicResponse response = clinicMapper.toAdminClinicResponse(clinic);

        assertEquals("Fallback Manager", response.getManagerName());
        assertEquals("fallback@abc.com", response.getManagerEmail());
    }

    @Test
    @DisplayName("toAdminClinicResponse — manager deleted, fallback to role query")
    void toAdminClinicResponse_managerDeleted_fallback() {
        Clinic clinic = Clinic.builder()
                .id(1L).clinicCode("PK003").name("Clinic C")
                .status("ACTIVE").managerId(10L)
                .build();

        User deletedManager = User.builder()
                .id(10L).fullName("Deleted").email("deleted@abc.com").build();
        deletedManager.setDeleted(true);

        when(userRepository.findById(10L)).thenReturn(Optional.of(deletedManager));
        when(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(1L, UserRole.CLINIC_MANAGER))
                .thenReturn(Collections.emptyList());
        when(userRepository.countByRoleAndClinicIdAndIsDeletedFalse(UserRole.DOCTOR, 1L)).thenReturn(0L);
        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(0L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(0L);

        AdminClinicResponse response = clinicMapper.toAdminClinicResponse(clinic);

        assertNull(response.getManagerName());
        assertNull(response.getManagerEmail());
    }

    @Test
    @DisplayName("toAdminClinicResponse — no manager at all")
    void toAdminClinicResponse_noManager() {
        Clinic clinic = Clinic.builder()
                .id(1L).clinicCode("PK004").name("Clinic D")
                .status("ACTIVE").managerId(10L)
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.empty());
        when(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(1L, UserRole.CLINIC_MANAGER))
                .thenReturn(Collections.emptyList());
        when(userRepository.countByRoleAndClinicIdAndIsDeletedFalse(UserRole.DOCTOR, 1L)).thenReturn(0L);
        when(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).thenReturn(0L);
        when(patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(eq(1L), anyString())).thenReturn(0L);

        AdminClinicResponse response = clinicMapper.toAdminClinicResponse(clinic);

        assertNull(response.getManagerName());
        assertNull(response.getManagerEmail());
    }
}