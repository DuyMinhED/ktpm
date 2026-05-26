package com.project.service.impl;

import com.project.dto.request.CreateUserRequest;
import com.project.dto.request.UpdateUserRequest;
import com.project.dto.response.AdminUserResponse;
import com.project.dto.response.AdminUserStatsResponse;
import com.project.entity.Patient;
import com.project.entity.SystemConfig;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.exception.ResourceNotFoundException;
import com.project.mapper.UserMapper;
import com.project.repository.PatientRepository;
import com.project.repository.SystemConfigRepository;
import com.project.repository.UserRepository;
import com.project.service.AuditService;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminUserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private AuditService auditService;

    @Mock
    private SystemConfigRepository systemConfigRepository;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User sampleUser;
    private SystemConfig mockConfig;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encoded_password")
                .role(UserRole.PATIENT)
                .fullName("Test Patient")
                .status("ACTIVE")
                .clinicId(10L)
                .build();

        mockConfig = SystemConfig.builder()
                .id(1L)
                .specialCharRequired(true)
                .upperNumberRequired(true)
                .build();
    }

    @Test
    void getUserStats_success() {
        when(userRepository.countByIsDeletedFalse()).thenReturn(10L);
        when(userRepository.countByRoleAndIsDeletedFalse(UserRole.ADMIN)).thenReturn(1L);
        when(userRepository.countByRoleAndIsDeletedFalse(UserRole.DOCTOR)).thenReturn(3L);
        when(userRepository.countByRoleAndIsDeletedFalse(UserRole.CLINIC_MANAGER)).thenReturn(2L);
        when(userRepository.countByRoleAndIsDeletedFalse(UserRole.PATIENT)).thenReturn(4L);

        AdminUserStatsResponse stats = adminUserService.getUserStats();

        assertNotNull(stats);
        assertEquals(10L, stats.getTotalUsers());
        assertEquals(1L, stats.getAdminCount());
        assertEquals(3L, stats.getDoctorCount());
        assertEquals(2L, stats.getClinicManagerCount());
        assertEquals(4L, stats.getPatientCount());

        verify(userRepository, times(1)).countByIsDeletedFalse();
    }

    @Test
    void getUsers_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(Collections.singletonList(sampleUser));
        AdminUserResponse response = AdminUserResponse.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test Patient")
                .role("PATIENT")
                .status("Hoạt động")
                .build();

        when(userRepository.findByFilters(any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(userPage);
        when(userMapper.toAdminUserResponse(any(User.class))).thenReturn(response);

        Page<AdminUserResponse> result = adminUserService.getUsers(UserRole.PATIENT, "ACTIVE", 10L, "test", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("test@example.com", result.getContent().get(0).getEmail());
    }

    @Test
    void getUserById_success() {
        AdminUserResponse response = AdminUserResponse.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test Patient")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userMapper.toAdminUserResponse(sampleUser)).thenReturn(response);

        AdminUserResponse result = adminUserService.getUserById(1L);

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void getUserById_notFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> adminUserService.getUserById(1L));
    }

    @Test
    void createUser_success_patient() {
        CreateUserRequest request = new CreateUserRequest();
        request.setFullName("Test Patient");
        request.setEmail("patient@example.com");
        request.setPassword("P@ssword123");
        request.setRole("PATIENT");
        request.setClinicId(10L);

        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(mockConfig));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(patientRepository.save(any(Patient.class))).thenReturn(new Patient());

        AdminUserResponse response = AdminUserResponse.builder()
                .id(1L)
                .email("test@example.com")
                .build();
        when(userMapper.toAdminUserResponse(any(User.class))).thenReturn(response);

        AdminUserResponse result = adminUserService.createUser(request);

        assertNotNull(result);
        verify(patientRepository, times(1)).save(any(Patient.class));
        verify(auditService, times(1)).recordActivity(eq("Tạo mới"), eq("Quản lý người dùng"), anyString(), eq("success"));
    }

    @Test
    void createUser_invalidPassword_shouldThrowException() {
        CreateUserRequest request = new CreateUserRequest();
        request.setFullName("Test Patient");
        request.setEmail("patient@example.com");
        request.setPassword("123"); // Too short
        request.setRole("PATIENT");

        assertThrows(IllegalArgumentException.class, () -> adminUserService.createUser(request));
    }

    @Test
    void createUser_missingSpecialChar_shouldThrowException() {
        CreateUserRequest request = new CreateUserRequest();
        request.setFullName("Test Patient");
        request.setEmail("patient@example.com");
        request.setPassword("Password123"); // No special character
        request.setRole("PATIENT");

        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(mockConfig));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> adminUserService.createUser(request));
        assertTrue(exception.getMessage().contains("ký tự đặc biệt"));
    }

    @Test
    void updateUser_success() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Updated Name");
        request.setEmail("updated@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        AdminUserResponse response = AdminUserResponse.builder()
                .id(1L)
                .email("updated@example.com")
                .fullName("Updated Name")
                .build();
        when(userMapper.toAdminUserResponse(any(User.class))).thenReturn(response);

        AdminUserResponse result = adminUserService.updateUser(1L, request);

        assertNotNull(result);
        assertEquals("Updated Name", result.getFullName());
        verify(auditService, times(1)).recordActivity(eq("Cập nhật"), eq("Quản lý người dùng"), anyString(), eq("success"));
    }

    @Test
    void toggleUserStatus_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminUserService.toggleUserStatus(1L);

        assertEquals("INACTIVE", sampleUser.getStatus());
        verify(userRepository, times(1)).save(sampleUser);
        verify(auditService, times(1)).recordActivity(eq("Đổi trạng thái"), eq("Quản lý người dùng"), anyString(), eq("warning"));
    }

    @Test
    void deleteUser_success_patient() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(patientRepository.findByUserIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(new Patient()));

        adminUserService.deleteUser(1L);

        assertTrue(sampleUser.isDeleted());
        verify(userRepository, times(1)).save(sampleUser);
        verify(patientRepository, times(1)).save(any(Patient.class));
        verify(auditService, times(1)).recordActivity(eq("Xóa"), eq("Quản lý người dùng"), anyString(), eq("danger"));
    }
}
