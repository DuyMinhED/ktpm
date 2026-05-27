package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.EmergencyContactRequest;
import com.project.dto.request.UpdatePatientProfileRequest;
import com.project.dto.response.EmergencyContactResponse;
import com.project.dto.response.PatientProfileResponse;
import com.project.service.PatientProfileService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PatientProfileControllerSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PatientProfileService patientProfileService;

    private PatientProfileResponse sampleProfileResponse;
    private UpdatePatientProfileRequest sampleUpdateRequest;
    private EmergencyContactResponse sampleEmergencyContactResponse;
    private EmergencyContactRequest sampleEmergencyContactRequest;

    @BeforeEach
    void setUp() {
        sampleProfileResponse = PatientProfileResponse.builder()
                .id(1L)
                .fullName("John Doe")
                .phone("0123456789")
                .build();

        sampleUpdateRequest = new UpdatePatientProfileRequest();
        sampleUpdateRequest.setFullName("John Doe Updated");
        sampleUpdateRequest.setPhone("0987654321");

        sampleEmergencyContactResponse = EmergencyContactResponse.builder()
                .id(10L)
                .contactName("Jane Doe")
                .relationship("Wife")
                .phone("0111222333")
                .isPrimary(true)
                .build();

        sampleEmergencyContactRequest = new EmergencyContactRequest();
        sampleEmergencyContactRequest.setContactName("Jane Doe");
        sampleEmergencyContactRequest.setRelationship("Wife");
        sampleEmergencyContactRequest.setPhone("0111222333");
        sampleEmergencyContactRequest.setPrimary(true);
    }

    // ==========================================
    // GET /api/v1/patient/profile
    // ==========================================

    @Test
    void getProfile_withoutToken_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/patient/profile")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = { "DOCTOR" })
    void getProfile_withDoctorRole_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/patient/profile")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = { "PATIENT" })
    void getProfile_withPatientRole_success() throws Exception {
        when(patientProfileService.getCurrentPatientProfile()).thenReturn(sampleProfileResponse);

        mockMvc.perform(get("/api/v1/patient/profile")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("John Doe"))
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    // ==========================================
    // PUT /api/v1/patient/profile
    // ==========================================

    @Test
    @WithMockUser(roles = { "PATIENT" })
    void updateProfile_success() throws Exception {
        when(patientProfileService.updateProfile(any(UpdatePatientProfileRequest.class)))
                .thenReturn(sampleProfileResponse);

        mockMvc.perform(put("/api/v1/patient/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleUpdateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("John Doe"));
    }

    @Test
    @WithMockUser(roles = { "ADMIN" })
    void updateProfile_withAdminRole_forbidden() throws Exception {
        mockMvc.perform(put("/api/v1/patient/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleUpdateRequest)))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // GET /api/v1/patient/profile/emergency-contacts
    // ==========================================

    @Test
    @WithMockUser(roles = { "PATIENT" })
    void getEmergencyContacts_success() throws Exception {
        when(patientProfileService.getEmergencyContacts()).thenReturn(List.of(sampleEmergencyContactResponse));

        mockMvc.perform(get("/api/v1/patient/profile/emergency-contacts")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].contactName").value("Jane Doe"));
    }

    // ==========================================
    // POST /api/v1/patient/profile/emergency-contacts
    // ==========================================

    @Test
    @WithMockUser(roles = { "PATIENT" })
    void addEmergencyContact_success() throws Exception {
        when(patientProfileService.addEmergencyContact(any(EmergencyContactRequest.class)))
                .thenReturn(sampleEmergencyContactResponse);

        mockMvc.perform(post("/api/v1/patient/profile/emergency-contacts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleEmergencyContactRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contactName").value("Jane Doe"));
    }

    // ==========================================
    // PUT /api/v1/patient/profile/emergency-contacts/{id}
    // ==========================================

    @Test
    @WithMockUser(roles = { "PATIENT" })
    void updateEmergencyContact_success() throws Exception {
        when(patientProfileService.updateEmergencyContact(eq(10L), any(EmergencyContactRequest.class)))
                .thenReturn(sampleEmergencyContactResponse);

        mockMvc.perform(put("/api/v1/patient/profile/emergency-contacts/10")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleEmergencyContactRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contactName").value("Jane Doe"));
    }

    // ==========================================
    // GET /api/v1/patient/profile/download-report
    // ==========================================

    @Test
    @WithMockUser(roles = { "PATIENT" })
    void downloadReport_success() throws Exception {
        byte[] mockReport = "Mock Report Content".getBytes();
        when(patientProfileService.generateReport()).thenReturn(mockReport);

        mockMvc.perform(get("/api/v1/patient/profile/download-report"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=health_report.txt"))
                .andExpect(header().string("Content-Type", "text/plain"))
                .andExpect(content().bytes(mockReport));
    }

    // ==========================================
    // Validation Error Tests
    // ==========================================

    @Test
    @WithMockUser(roles = { "PATIENT" })
    void updateProfile_validationFail_blankName() throws Exception {
        UpdatePatientProfileRequest invalidRequest = new UpdatePatientProfileRequest();
        invalidRequest.setFullName(""); // Blank name violates @NotBlank
        invalidRequest.setPhone("0987654321");

        mockMvc.perform(put("/api/v1/patient/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest()); // 400 Bad Request
    }

    @Test
    @WithMockUser(roles = { "PATIENT" })
    void updateProfile_validationFail_invalidPhone() throws Exception {
        UpdatePatientProfileRequest invalidRequest = new UpdatePatientProfileRequest();
        invalidRequest.setFullName("Valid Name");
        invalidRequest.setPhone("123"); // Too short violates @Pattern

        mockMvc.perform(put("/api/v1/patient/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest()); // 400 Bad Request
    }

    @Test
    @WithMockUser(roles = { "PATIENT" })
    void addEmergencyContact_validationFail_missingFields() throws Exception {
        EmergencyContactRequest invalidRequest = new EmergencyContactRequest();
        // Missing all required fields (@NotBlank on name, relationship, phone)

        mockMvc.perform(post("/api/v1/patient/profile/emergency-contacts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest()); // 400 Bad Request
    }
}
