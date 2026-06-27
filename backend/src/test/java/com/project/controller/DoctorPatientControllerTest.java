package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.response.DoctorPatientDetailResponse;
import com.project.dto.response.DoctorPatientResponse;
import com.project.security.*;
import com.project.service.DoctorPatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DoctorPatientController.class, excludeAutoConfiguration = { SecurityAutoConfiguration.class })
@AutoConfigureMockMvc(addFilters = false)
public class DoctorPatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DoctorPatientService doctorPatientService;

    // Mock Security dependencies to prevent loading real security filter configuration errors
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

    @BeforeEach
    void setUp() {
        // Configure SecurityContext with mock UserDetails
        CustomUserDetails userDetails = CustomUserDetails.builder()
                .id(10L)
                .email("doctor@example.com")
                .password("password")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_DOCTOR")))
                .role("DOCTOR")
                .build();
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void getMyPatients_success() throws Exception {
        DoctorPatientResponse patientResponse = DoctorPatientResponse.builder()
                .id(1L)
                .fullName("Jane Doe")
                .riskLevel("MONITORING")
                .treatmentStatus("STABLE")
                .build();

        when(doctorPatientService.getMyPatients(eq(10L), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(patientResponse)));

        mockMvc.perform(get("/api/v1/doctor/patients")
                        .param("search", "Jane")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].fullName").value("Jane Doe"));
    }

    @Test
    void getStats_success() throws Exception {
        when(doctorPatientService.getTotalPatientCount(10L)).thenReturn(5L);
        when(doctorPatientService.getHighRiskCount(10L)).thenReturn(1L);
        when(doctorPatientService.getMonitoringCount(10L)).thenReturn(2L);

        mockMvc.perform(get("/api/v1/doctor/patients/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalPatients").value(5))
                .andExpect(jsonPath("$.data.highRiskCount").value(1));
    }

    @Test
    void getPatientDetail_success() throws Exception {
        DoctorPatientDetailResponse detailResponse = DoctorPatientDetailResponse.builder()
                .adherenceRate(95.0)
                .build();

        when(doctorPatientService.getPatientDetail(1L)).thenReturn(detailResponse);

        mockMvc.perform(get("/api/v1/doctor/patients/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.adherenceRate").value(95.0));
    }
}
