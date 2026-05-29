package com.project.controller;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.PrescriptionItemRequest;
import com.project.dto.request.PrescriptionRequest;
import com.project.dto.response.PrescriptionResponse;
import com.project.dto.response.PrescriptionStatsResponse;
import com.project.security.CustomUserDetailsService;
import com.project.security.JwtAuthenticationEntryPoint;
import com.project.security.JwtAuthenticationFilter;
import com.project.security.JwtTokenProvider;
import com.project.service.PrescriptionService;
import com.project.util.SecurityUtils;

@WebMvcTest(controllers = PrescriptionController.class, excludeAutoConfiguration = { SecurityAutoConfiguration.class })
@AutoConfigureMockMvc(addFilters = false)
public class PrescriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PrescriptionService prescriptionService;

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

    private MockedStatic<SecurityUtils> mockedSecurityUtils;
    private PrescriptionResponse sampleResponse;
    private PrescriptionStatsResponse sampleStatsResponse;
    private PrescriptionRequest sampleRequest;
    private PrescriptionItemRequest sampleItemRequest;

    @BeforeEach
    void setUp() {
        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(2L));

        sampleResponse = PrescriptionResponse.builder()
                .id(1L)
                .prescriptionCode("RX-1234")
                .patientName("Nguyen Van A")
                .patientInitial("NA")
                .diagnosis("Sot sieu vi")
                .status("Active")
                .colorCode("emerald")
                .medicationCount(1)
                .createdAt(LocalDateTime.now())
                .build();

        sampleStatsResponse = PrescriptionStatsResponse.builder()
                .totalPrescriptions(10)
                .activePrescriptions(5)
                .pendingRenewals(2)
                .completedPrescriptions(3)
                .recoveryRate(30.0)
                .build();

        sampleItemRequest = new PrescriptionItemRequest();
        sampleItemRequest.setMedicationName("Paracetamol");
        sampleItemRequest.setDosage("500mg");
        sampleItemRequest.setUsageInstructions("Uong sau khi an");

        sampleRequest = new PrescriptionRequest();
        sampleRequest.setPatientId(1L);
        sampleRequest.setDiagnosis("Sot sieu vi");
        sampleRequest.setNotes("Nghi ngoi nhieu");
        sampleRequest.setItems(Collections.singletonList(sampleItemRequest));
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    @Test
    void getPrescriptions_success() throws Exception {
        when(prescriptionService.getDoctorPrescriptions(eq(2L), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(sampleResponse)));

        mockMvc.perform(get("/api/v1/doctor/prescriptions")
                        .param("search", "Nguyen")
                        .param("status", "ACTIVE")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Fetched successfully"))
                .andExpect(jsonPath("$.data.content[0].prescriptionCode").value("RX-1234"))
                .andExpect(jsonPath("$.data.content[0].patientName").value("Nguyen Van A"));
    }

    @Test
    void getStats_success() throws Exception {
        when(prescriptionService.getPrescriptionStats(2L)).thenReturn(sampleStatsResponse);

        mockMvc.perform(get("/api/v1/doctor/prescriptions/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Stats fetched successfully"))
                .andExpect(jsonPath("$.data.totalPrescriptions").value(10))
                .andExpect(jsonPath("$.data.activePrescriptions").value(5));
    }

    @Test
    void createPrescription_success() throws Exception {
        when(prescriptionService.createPrescription(eq(2L), any(PrescriptionRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Prescription created successfully"))
                .andExpect(jsonPath("$.data.prescriptionCode").value("RX-1234"));
    }

    @Test
    void createPrescription_validationFailed_missingPatient() throws Exception {
        sampleRequest.setPatientId(null);

        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createPrescription_validationFailed_blankDiagnosis() throws Exception {
        sampleRequest.setDiagnosis("  ");

        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createPrescription_validationFailed_emptyItems() throws Exception {
        sampleRequest.setItems(Collections.emptyList());

        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest());
    }
    @Test
    void createPrescription_validationFailed_diagnosisTooLong() throws Exception {
        sampleRequest.setDiagnosis("A".repeat(256));

        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createPrescription_validationFailed_nullItems() throws Exception {
        sampleRequest.setItems(null);

        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isBadRequest());
    }
}
