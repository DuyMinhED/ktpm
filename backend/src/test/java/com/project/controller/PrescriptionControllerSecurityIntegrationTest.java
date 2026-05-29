package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.PrescriptionItemRequest;
import com.project.dto.request.PrescriptionRequest;
import com.project.dto.response.PrescriptionResponse;
import com.project.dto.response.PrescriptionStatsResponse;
import com.project.security.SecurityService;
import com.project.service.PrescriptionService;
import com.project.util.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PrescriptionControllerSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PrescriptionService prescriptionService;

    @MockBean(name = "securityService")
    private SecurityService securityService;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;
    private PrescriptionRequest sampleRequest;
    private PrescriptionItemRequest sampleItemRequest;
    private PrescriptionResponse sampleResponse;
    private PrescriptionStatsResponse sampleStatsResponse;

    @BeforeEach
    void setUp() {
        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(2L));

        sampleItemRequest = new PrescriptionItemRequest();
        sampleItemRequest.setMedicationName("Paracetamol");
        sampleItemRequest.setDosage("500mg");
        sampleItemRequest.setUsageInstructions("Uong sau khi an");

        sampleRequest = new PrescriptionRequest();
        sampleRequest.setPatientId(1L);
        sampleRequest.setDiagnosis("Sot sieu vi");
        sampleRequest.setNotes("Nghi ngoi nhieu");
        sampleRequest.setItems(Collections.singletonList(sampleItemRequest));

        sampleResponse = PrescriptionResponse.builder()
                .id(1L)
                .prescriptionCode("RX-1234")
                .patientName("Nguyen Van A")
                .build();

        sampleStatsResponse = PrescriptionStatsResponse.builder().build();
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    // =========================================================================
    // 1. GET /api/v1/doctor/prescriptions
    // =========================================================================

    @Test
    void whenGetPrescriptionsWithoutToken_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = {"PATIENT"})
    void whenGetPrescriptionsAsPatient_thenForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenGetPrescriptionsAsDoctor_thenSuccess() throws Exception {
        when(prescriptionService.getDoctorPrescriptions(eq(2L), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(sampleResponse)));

        mockMvc.perform(get("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 2. GET /api/v1/doctor/prescriptions/stats
    // =========================================================================

    @Test
    void whenGetStatsWithoutToken_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/prescriptions/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = {"PATIENT"})
    void whenGetStatsAsPatient_thenForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/prescriptions/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenGetStatsAsDoctor_thenSuccess() throws Exception {
        when(prescriptionService.getPrescriptionStats(2L)).thenReturn(sampleStatsResponse);

        mockMvc.perform(get("/api/v1/doctor/prescriptions/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 3. POST /api/v1/doctor/prescriptions
    // =========================================================================

    @Test
    void whenCreatePrescriptionWithoutToken_thenUnauthorized() throws Exception {
        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = {"PATIENT"})
    void whenCreatePrescriptionAsPatient_thenForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenCreatePrescriptionAsDoctorAndCannotAccessPatient_thenForbidden() throws Exception {
        when(securityService.canAccessPatient(1L)).thenReturn(false);

        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenCreatePrescriptionAsDoctorAndCanAccessPatient_thenSuccess() throws Exception {
        when(securityService.canAccessPatient(1L)).thenReturn(true);
        when(prescriptionService.createPrescription(eq(2L), any(PrescriptionRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isOk());
    }
}
