package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.CreateUserRequest;
import com.project.dto.request.UpdateUserRequest;
import com.project.dto.response.*;
import com.project.entity.UserRole;
import com.project.security.CustomUserDetailsService;
import com.project.security.JwtAuthenticationEntryPoint;
import com.project.security.JwtAuthenticationFilter;
import com.project.security.JwtTokenProvider;
import com.project.service.AdminClinicService;
import com.project.service.AdminConfigService;
import com.project.service.AdminDashboardService;
import com.project.service.AdminUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminDashboardService adminDashboardService;

    @MockBean
    private AdminClinicService adminClinicService;

    @MockBean
    private AdminUserService adminUserService;

    @MockBean
    private AdminConfigService adminConfigService;

    // Mock Security dependencies to prevent loading real security filter configuration errors
    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    private AdminUserResponse sampleUserResponse;

    @BeforeEach
    void setUp() {
        sampleUserResponse = AdminUserResponse.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test Patient")
                .role("PATIENT")
                .status("Hoạt động")
                .build();
    }

    @Test
    void getDashboardData_success() throws Exception {
        AdminDashboardResponse mockResponse = AdminDashboardResponse.builder().build();
        when(adminDashboardService.getDashboardData("DAY", "Lượng bệnh nhân")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .param("timeRange", "DAY")
                        .param("metric", "Lượng bệnh nhân")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Dashboard data fetched successfully"));

        verify(adminDashboardService, times(1)).getDashboardData("DAY", "Lượng bệnh nhân");
    }

    @Test
    void getClinicStats_success() throws Exception {
        AdminClinicStatsResponse mockStats = AdminClinicStatsResponse.builder()
                .totalClinics(5L)
                .activeClinics(4L)
                .inactiveClinics(1L)
                .build();
        when(adminClinicService.getClinicStats()).thenReturn(mockStats);

        mockMvc.perform(get("/api/v1/admin/clinics/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalClinics").value(5))
                .andExpect(jsonPath("$.data.activeClinics").value(4));

        verify(adminClinicService, times(1)).getClinicStats();
    }

    @Test
    void getUserStats_success() throws Exception {
        AdminUserStatsResponse mockStats = AdminUserStatsResponse.builder()
                .totalUsers(10L)
                .patientCount(5L)
                .doctorCount(3L)
                .build();
        when(adminUserService.getUserStats()).thenReturn(mockStats);

        mockMvc.perform(get("/api/v1/admin/users/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").value(10))
                .andExpect(jsonPath("$.data.doctorCount").value(3));

        verify(adminUserService, times(1)).getUserStats();
    }

    @Test
    void getUsers_success() throws Exception {
        Page<AdminUserResponse> userPage = new PageImpl<>(Collections.singletonList(sampleUserResponse));
        when(adminUserService.getUsers(eq(UserRole.PATIENT), eq("ACTIVE"), eq(10L), eq("test"), any(Pageable.class)))
                .thenReturn(userPage);

        mockMvc.perform(get("/api/v1/admin/users")
                        .param("role", "PATIENT")
                        .param("status", "ACTIVE")
                        .param("clinicId", "10")
                        .param("keyword", "test")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].email").value("test@example.com"));
    }

    @Test
    void getUserById_success() throws Exception {
        when(adminUserService.getUserById(1L)).thenReturn(sampleUserResponse);

        mockMvc.perform(get("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));

        verify(adminUserService, times(1)).getUserById(1L);
    }

    @Test
    void createUser_success() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setFullName("New Doctor");
        request.setEmail("doctor@example.com");
        request.setPassword("P@ssword123");
        request.setRole("DOCTOR");

        when(adminUserService.createUser(any(CreateUserRequest.class))).thenReturn(sampleUserResponse);

        mockMvc.perform(post("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User created successfully"));

        verify(adminUserService, times(1)).createUser(any(CreateUserRequest.class));
    }

    @Test
    void updateUser_success() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Updated Doctor Name");

        when(adminUserService.updateUser(eq(1L), any(UpdateUserRequest.class))).thenReturn(sampleUserResponse);

        mockMvc.perform(put("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User updated successfully"));

        verify(adminUserService, times(1)).updateUser(eq(1L), any(UpdateUserRequest.class));
    }

    @Test
    void toggleUserStatus_success() throws Exception {
        doNothing().when(adminUserService).toggleUserStatus(1L);

        mockMvc.perform(patch("/api/v1/admin/users/1/toggle-status")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User status toggled successfully"));

        verify(adminUserService, times(1)).toggleUserStatus(1L);
    }

    @Test
    void deleteUser_success() throws Exception {
        doNothing().when(adminUserService).deleteUser(1L);

        mockMvc.perform(delete("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User deleted successfully"));

        verify(adminUserService, times(1)).deleteUser(1L);
    }

    @Test
    void getConfig_success() throws Exception {
        SystemConfigResponse mockConfig = SystemConfigResponse.builder()
                .specialCharRequired(true)
                .upperNumberRequired(true)
                .build();
        when(adminConfigService.getConfig()).thenReturn(mockConfig);

        mockMvc.perform(get("/api/v1/admin/config")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.specialCharRequired").value(true));

        verify(adminConfigService, times(1)).getConfig();
    }
}
