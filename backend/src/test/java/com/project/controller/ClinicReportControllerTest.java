package com.project.controller;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.project.dto.response.ClinicReportResponse;
import com.project.security.CustomUserDetailsService;
import com.project.security.JwtAuthenticationEntryPoint;
import com.project.security.JwtAuthenticationFilter;
import com.project.security.JwtTokenProvider;
import com.project.service.ClinicReportService;

@WebMvcTest(controllers = ClinicReportController.class, excludeAutoConfiguration = { SecurityAutoConfiguration.class })
@AutoConfigureMockMvc(addFilters = false)
public class ClinicReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClinicReportService clinicReportService;

    // Mock Security dependencies
    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @Test
    void getClinicReport_success() throws Exception {
        Long clinicId = 1L;
        ClinicReportResponse reportResponse = new ClinicReportResponse();
        when(clinicReportService.getClinicReport(clinicId, "30d")).thenReturn(reportResponse);

        mockMvc.perform(get("/v1/clinics/{clinicId}/reports", clinicId)
                .param("period", "30d")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(clinicReportService, times(1)).getClinicReport(clinicId, "30d");
    }

    @Test
    void getDiseaseDetail_success() throws Exception {
        Long clinicId = 1L;
        Map<String, Object> detailResponse = new HashMap<>();
        detailResponse.put("condition", "Hypertension");
        when(clinicReportService.getDiseaseDetailReport(clinicId, "Hypertension")).thenReturn(detailResponse);

        mockMvc.perform(get("/v1/clinics/{clinicId}/reports/disease-detail", clinicId)
                .param("condition", "Hypertension")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.condition").value("Hypertension"));

        verify(clinicReportService, times(1)).getDiseaseDetailReport(clinicId, "Hypertension");
    }
}
