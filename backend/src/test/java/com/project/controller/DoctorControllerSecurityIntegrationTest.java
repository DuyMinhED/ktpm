package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.DoctorResponse;
import com.project.security.SecurityService;
import com.project.service.DoctorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DoctorControllerSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DoctorService doctorService;

    @MockBean(name = "securityService")
    private SecurityService securityService;

    private CreateDoctorRequest sampleRequest;
    private DoctorResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleRequest = new CreateDoctorRequest();
        sampleRequest.setName("Dr. John Smith");
        sampleRequest.setEmail("doctor@example.com");
        sampleRequest.setPhone("0123456789");
        sampleRequest.setSpecialty("Cardiology");
        sampleRequest.setLicenseNumber("12345-CCHN");

        sampleResponse = DoctorResponse.builder()
                .id(1L)
                .email("doctor@example.com")
                .fullName("Dr. John Smith")
                .build();
    }

    // ==========================================
    // 1. POST /api/doctors (Create Doctor)
    // ==========================================

    @Test
    void whenCallCreateDoctorWithoutToken_thenUnauthorized() throws Exception {
        mockMvc.perform(post("/api/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isUnauthorized()); // 401 Unauthorized
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void whenAdminCreatesDoctor_thenSuccess() throws Exception {
        when(doctorService.createDoctor(any(CreateDoctorRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenDoctorCreatesDoctor_thenForbidden() throws Exception {
        mockMvc.perform(post("/api/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = {"PATIENT"})
    void whenPatientCreatesDoctor_thenForbidden() throws Exception {
        mockMvc.perform(post("/api/doctors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    // ==========================================
    // 2. PUT /api/doctors/{id} (Update Doctor)
    // ==========================================

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void whenAdminUpdatesDoctor_thenSuccess() throws Exception {
        when(doctorService.updateDoctor(eq(1L), any(CreateDoctorRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenDoctorUpdatesSelf_thenSuccess() throws Exception {
        // Stub security service to allow self-update
        when(securityService.isDoctorSelf(eq(1L))).thenReturn(true);
        when(doctorService.updateDoctor(eq(1L), any(CreateDoctorRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor2@example.com", roles = {"DOCTOR"})
    void whenDoctorUpdatesOtherDoctor_thenForbidden() throws Exception {
        // Stub security service to forbid other-doctor update
        when(securityService.isDoctorSelf(eq(1L))).thenReturn(false);

        mockMvc.perform(put("/api/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = {"PATIENT"})
    void whenPatientUpdatesDoctor_thenForbidden() throws Exception {
        mockMvc.perform(put("/api/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    // ==========================================
    // 3. DELETE /api/doctors/{id} (Delete Doctor)
    // ==========================================

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void whenAdminDeletesDoctor_thenSuccess() throws Exception {
        mockMvc.perform(delete("/api/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenDoctorDeletesDoctor_thenForbidden() throws Exception {
        mockMvc.perform(delete("/api/doctors/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }
}
