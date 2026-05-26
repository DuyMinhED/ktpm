package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.DoctorResponse;
import com.project.security.CustomUserDetailsService;
import com.project.security.JwtAuthenticationEntryPoint;
import com.project.security.JwtAuthenticationFilter;
import com.project.security.JwtTokenProvider;
import com.project.service.DoctorService;
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
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DoctorController.class, excludeAutoConfiguration = { SecurityAutoConfiguration.class })
@AutoConfigureMockMvc(addFilters = false)
public class DoctorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DoctorService doctorService;

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

    private DoctorResponse sampleDoctorResponse;
    private CreateDoctorRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleDoctorResponse = DoctorResponse.builder()
                .id(1L)
                .email("doctor@example.com")
                .fullName("Dr. John Smith")
                .phone("0123456789")
                .specialization("Cardiology")
                .licenseNumber("12345-CCHN")
                .status("ACTIVE")
                .build();

        sampleRequest = new CreateDoctorRequest();
        sampleRequest.setName("Dr. John Smith");
        sampleRequest.setEmail("doctor@example.com");
        sampleRequest.setPhone("0123456789");
        sampleRequest.setSpecialty("Cardiology");
        sampleRequest.setLicenseNumber("12345-CCHN");
        sampleRequest.setPassword("securePassword123");
    }

    @Test
    void getDoctors_success() throws Exception {
        when(doctorService.getDoctors(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(sampleDoctorResponse)));

        mockMvc.perform(get("/api/doctors")
                        .param("specialty", "Cardiology")
                        .param("keyword", "Smith")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].fullName").value("Dr. John Smith"));
    }

    @Test
    void getDoctorById_success() throws Exception {
        when(doctorService.getDoctorById(1L)).thenReturn(sampleDoctorResponse);

        mockMvc.perform(get("/api/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Dr. John Smith"));
    }

    @Test
    void createDoctor_success() throws Exception {
        when(doctorService.createDoctor(any(CreateDoctorRequest.class))).thenReturn(sampleDoctorResponse);

        mockMvc.perform(post("/api/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Dr. John Smith"));
    }

    @Test
    void createDoctor_validationFailed_invalidEmail() throws Exception {
        sampleRequest.setEmail("invalid-email-format");

        mockMvc.perform(post("/api/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest()); // 400 Bad Request
    }

    @Test
    void createDoctor_validationFailed_blankPhone() throws Exception {
        sampleRequest.setPhone("   ");

        mockMvc.perform(post("/api/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest()); // 400 Bad Request
    }

    @Test
    void createDoctor_validationFailed_blankLicenseNumber() throws Exception {
        sampleRequest.setLicenseNumber("");

        mockMvc.perform(post("/api/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest()); // 400 Bad Request
    }

    @Test
    void updateDoctor_success() throws Exception {
        when(doctorService.updateDoctor(eq(1L), any(CreateDoctorRequest.class))).thenReturn(sampleDoctorResponse);

        mockMvc.perform(put("/api/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Dr. John Smith"));
    }

    @Test
    void deleteDoctor_success() throws Exception {
        doNothing().when(doctorService).deleteDoctor(1L);

        mockMvc.perform(delete("/api/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(doctorService, times(1)).deleteDoctor(1L);
    }
}
