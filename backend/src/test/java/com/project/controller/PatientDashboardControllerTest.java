package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.PatientAlertResponse;
import com.project.dto.response.PatientDashboardResponse;
import com.project.security.CustomUserDetailsService;
import com.project.security.JwtAuthenticationEntryPoint;
import com.project.security.JwtAuthenticationFilter;
import com.project.security.JwtTokenProvider;
import com.project.service.PatientDashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PatientDashboardController.class, excludeAutoConfiguration = { SecurityAutoConfiguration.class })
@AutoConfigureMockMvc(addFilters = false)
public class PatientDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PatientDashboardService service;

    // Security mocks to prevent Spring context loading issues
    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @MockBean
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private PatientDashboardResponse sampleDashboardResponse;
    private PatientAlertResponse sampleAlertResponse;

    @BeforeEach
    void setUp() {
        sampleDashboardResponse = PatientDashboardResponse.builder()
                .latestAdvice("Hãy tập thể dục đều đặn")
                .build();

        sampleAlertResponse = PatientAlertResponse.builder()
                .id(1L)
                .alertType("HEALTH")
                .severity("HIGH")
                .title("Huyết áp cao")
                .message("Huyết áp tâm thu vượt quá 140 mmHg")
                .isRead(false)
                .build();
    }

    @Test
    void getDashboard_success() throws Exception {
        when(service.getDashboard()).thenReturn(sampleDashboardResponse);

        mockMvc.perform(get("/api/v1/patient/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.latestAdvice").value("Hãy tập thể dục đều đặn"));
    }

    @Test
    void getAlerts_success() throws Exception {
        when(service.getAlerts()).thenReturn(List.of(sampleAlertResponse));

        mockMvc.perform(get("/api/v1/patient/dashboard/alerts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Huyết áp cao"));
    }

    @Test
    void dismissAlert_success() throws Exception {
        doNothing().when(service).dismissAlert(1L);

        mockMvc.perform(put("/api/v1/patient/dashboard/alerts/1/dismiss")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Alert dismissed successfully"));

        verify(service, times(1)).dismissAlert(1L);
    }
}
