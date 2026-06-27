package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.LogMedicationRequest;
import com.project.dto.response.MedicationScheduleResponse;
import com.project.dto.response.PatientPrescriptionResponse;
import com.project.security.CustomUserDetailsService;
import com.project.security.JwtAuthenticationEntryPoint;
import com.project.security.JwtAuthenticationFilter;
import com.project.security.JwtTokenProvider;
import com.project.service.PatientPrescriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PatientPrescriptionController.class, excludeAutoConfiguration = { SecurityAutoConfiguration.class })
@AutoConfigureMockMvc(addFilters = false)
public class PatientPrescriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PatientPrescriptionService patientPrescriptionService;

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

    private PatientPrescriptionResponse sampleResponse;
    private MedicationScheduleResponse sampleScheduleResponse;
    private LogMedicationRequest logRequest;

    @BeforeEach
    void setUp() {
        sampleResponse = PatientPrescriptionResponse.builder()
                .id(1L)
                .prescriptionCode("RX-5678")
                .doctorName("Dr. John Smith")
                .diagnosis("Hypertension")
                .status("ACTIVE")
                .createdDate(LocalDate.now())
                .remainingDays(10)
                .completionPercentage(80.0)
                .items(Collections.singletonList(
                        PatientPrescriptionResponse.PrescriptionItemDetail.builder()
                                .id(1L)
                                .medicationName("Amlodipine")
                                .dosage("5mg")
                                .frequency("Daily")
                                .usageInstructions("Uong buoi sang")
                                .category("Cardiovascular")
                                .build()
                ))
                .build();

        sampleScheduleResponse = MedicationScheduleResponse.builder()
                .id(10L)
                .medicationName("Amlodipine")
                .dosage("5mg")
                .scheduledTime(LocalTime.of(8, 0))
                .frequency("Daily")
                .instructions("Uong buoi sang")
                .remainingDays(10)
                .todayStatus("UPCOMING")
                .takenAt(null)
                .build();

        logRequest = LogMedicationRequest.builder()
                .scheduleId(10L)
                .status("TAKEN")
                .notes("Taken on time")
                .build();
    }

    @Test
    void getActive_success() throws Exception {
        when(patientPrescriptionService.getActivePrescriptions()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/v1/patient/prescriptions/active")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Active prescriptions retrieved"))
                .andExpect(jsonPath("$.data[0].prescriptionCode").value("RX-5678"))
                .andExpect(jsonPath("$.data[0].doctorName").value("Dr. John Smith"));

        verify(patientPrescriptionService, times(1)).getActivePrescriptions();
    }

    @Test
    void getHistory_success() throws Exception {
        sampleResponse.setStatus("COMPLETED");
        when(patientPrescriptionService.getPrescriptionHistory()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/v1/patient/prescriptions/history")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Prescription history retrieved"))
                .andExpect(jsonPath("$.data[0].prescriptionCode").value("RX-5678"))
                .andExpect(jsonPath("$.data[0].status").value("COMPLETED"));

        verify(patientPrescriptionService, times(1)).getPrescriptionHistory();
    }

    @Test
    void getTodaySchedule_success() throws Exception {
        when(patientPrescriptionService.getTodaySchedule()).thenReturn(List.of(sampleScheduleResponse));

        mockMvc.perform(get("/api/v1/patient/prescriptions/today-schedule")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Today's schedule retrieved"))
                .andExpect(jsonPath("$.data[0].medicationName").value("Amlodipine"))
                .andExpect(jsonPath("$.data[0].todayStatus").value("UPCOMING"));

        verify(patientPrescriptionService, times(1)).getTodaySchedule();
    }

    @Test
    void logMedication_success() throws Exception {
        doNothing().when(patientPrescriptionService).logMedication(any(LogMedicationRequest.class));

        mockMvc.perform(post("/api/v1/patient/prescriptions/log-medication")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Medication logged successfully"));

        verify(patientPrescriptionService, times(1)).logMedication(any(LogMedicationRequest.class));
    }

    @Test
    void logMedication_validationFailed_nullScheduleId() throws Exception {
        logRequest.setScheduleId(null);

        mockMvc.perform(post("/api/v1/patient/prescriptions/log-medication")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logRequest)))
                .andExpect(status().isBadRequest());

        verify(patientPrescriptionService, never()).logMedication(any());
    }

    @Test
    void logMedication_validationFailed_blankStatus() throws Exception {
        logRequest.setStatus("   ");

        mockMvc.perform(post("/api/v1/patient/prescriptions/log-medication")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logRequest)))
                .andExpect(status().isBadRequest());

        verify(patientPrescriptionService, never()).logMedication(any());
    }

    @Test
    void requestRefill_success() throws Exception {
        doNothing().when(patientPrescriptionService).requestRefill(1L);

        mockMvc.perform(post("/api/v1/patient/prescriptions/1/request-refill")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Refill requested successfully"));

        verify(patientPrescriptionService, times(1)).requestRefill(1L);
    }
}
