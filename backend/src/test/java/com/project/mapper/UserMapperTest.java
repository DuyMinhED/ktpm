package com.project.mapper;

import com.project.dto.response.AdminUserResponse;
import com.project.entity.Clinic;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.repository.ClinicRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserMapperTest {

    @Mock
    private ClinicRepository clinicRepository;

    @InjectMocks
    private UserMapper userMapper;

    private User sampleUser;
    private Clinic sampleClinic;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .fullName("Nguyen Van A")
                .email("nva@example.com")
                .phone("0987654321")
                .role(UserRole.DOCTOR)
                .clinicId(10L)
                .status("ACTIVE")
                .licenseNumber("12345-CCHN")
                .degree("MD")
                .bio("Cardiologist")
                .licenseImageUrl("http://license.url")
                .specialization("Cardiology")
                .experience("10 years")
                .build();

        sampleClinic = Clinic.builder()
                .id(10L)
                .name("Heart Clinic")
                .phone("0241234567")
                .status("ACTIVE")
                .build();
    }

    @Test
    void toAdminUserResponse_activeUserAndClinic_success() {
        when(clinicRepository.findById(10L)).thenReturn(Optional.of(sampleClinic));

        AdminUserResponse response = userMapper.toAdminUserResponse(sampleUser);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Nguyen Van A", response.getFullName());
        assertEquals("nva@example.com", response.getEmail());
        assertEquals("0987654321", response.getPhone());
        assertEquals("DOCTOR", response.getRole());
        assertEquals("Bác sĩ", response.getRoleName());
        assertEquals("Heart Clinic", response.getClinicName());
        assertEquals("0241234567", response.getClinicPhone());
        assertEquals("Hoạt động", response.getStatus());
        assertEquals("12345-CCHN", response.getLicenseNumber());
    }

    @Test
    void toAdminUserResponse_inactiveClinic_shouldShowInactiveStatus() {
        sampleClinic.setStatus("INACTIVE");
        when(clinicRepository.findById(10L)).thenReturn(Optional.of(sampleClinic));

        AdminUserResponse response = userMapper.toAdminUserResponse(sampleUser);

        assertNotNull(response);
        assertEquals("Ngưng hoạt động", response.getStatus());
    }

    @Test
    void toAdminUserResponse_inactiveUser_shouldShowInactiveStatus() {
        sampleUser.setStatus("INACTIVE");
        when(clinicRepository.findById(10L)).thenReturn(Optional.of(sampleClinic));

        AdminUserResponse response = userMapper.toAdminUserResponse(sampleUser);

        assertNotNull(response);
        assertEquals("Ngưng hoạt động", response.getStatus());
    }

    @Test
    void toAdminUserResponse_nullClinicId_success() {
        sampleUser.setClinicId(null);

        AdminUserResponse response = userMapper.toAdminUserResponse(sampleUser);

        assertNotNull(response);
        assertNull(response.getClinicName());
        assertNull(response.getClinicPhone());
        assertEquals("Hoạt động", response.getStatus());
        verify(clinicRepository, never()).findById(anyLong());
    }

    @Test
    void mapRoleName_translations() {
        assertEquals("Quản trị viên", userMapper.mapRoleName(UserRole.ADMIN));
        assertEquals("Bác sĩ", userMapper.mapRoleName(UserRole.DOCTOR));
        assertEquals("Quản lý phòng khám", userMapper.mapRoleName(UserRole.CLINIC_MANAGER));
        assertEquals("Bệnh nhân", userMapper.mapRoleName(UserRole.PATIENT));
        assertEquals("Thành viên", userMapper.mapRoleName(null));
    }
}
