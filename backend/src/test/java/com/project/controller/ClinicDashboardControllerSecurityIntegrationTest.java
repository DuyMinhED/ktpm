package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.CreatePatientRequest;
import com.project.security.SecurityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ClinicDashboardControllerSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean(name = "securityService")
    private SecurityService securityService;

    // Mock other services to avoid executing actual logic inside controller methods when security check passes
    @MockBean
    private com.project.service.ClinicDashboardService clinicDashboardService;

    @MockBean
    private com.project.service.ClinicPatientService clinicPatientService;

    @MockBean
    private com.project.service.ClinicDoctorService clinicDoctorService;

    @MockBean
    private com.project.service.PatientHealthMetricService patientHealthMetricService;

    // 1. Test access without Token (No Token)
    @Test
    void whenCallClinicApiWithoutToken_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/clinics/1/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // 2. Test RBAC validation: A user with ROLE_PATIENT trying to access clinic manager endpoints
    @Test
    @WithMockUser(username = "patient@example.com", roles = {"PATIENT"})
    void whenPatientCallsClinicDashboardApi_thenForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/clinics/1/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    // 3. Test RBAC validation: CLINIC_MANAGER but securityService returns false
    @Test
    @WithMockUser(username = "manager@example.com", roles = {"CLINIC_MANAGER"})
    void whenManagerNotAuthorizedForClinicCallsDashboardApi_thenForbidden() throws Exception {
        when(securityService.isClinicManagerOf(eq(1L))).thenReturn(false);

        mockMvc.perform(get("/api/v1/clinics/1/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    // 4. Test RBAC validation: CLINIC_MANAGER and securityService returns true
    @Test
    @WithMockUser(username = "manager@example.com", roles = {"CLINIC_MANAGER"})
    void whenAuthorizedManagerCallsDashboardApi_thenSuccess() throws Exception {
        when(securityService.isClinicManagerOf(eq(1L))).thenReturn(true);

        mockMvc.perform(get("/api/v1/clinics/1/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // 5. Test RBAC validation: DOCTOR and securityService returns true for patient registration
    @Test
    @WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenAuthorizedDoctorCreatesPatient_thenSuccess() throws Exception {
        when(securityService.isClinicManagerOf(eq(1L))).thenReturn(false);
        when(securityService.isDoctorOfClinic(eq(1L))).thenReturn(true);

        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("John Doe");
        request.setEmail("john.doe@example.com");
        request.setPhone("0123456789");
        request.setPassword("P@ssword123");
        request.setGender("Male");
        request.setDateOfBirth(java.time.LocalDate.of(1990, 1, 1));
        request.setAddress("123 Street");
        request.setCondition("Hypertension");

        mockMvc.perform(post("/api/v1/clinics/1/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    // 6. Test RBAC validation: DOCTOR but securityService returns false for patient registration
    @Test
    @WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenUnauthorizedDoctorCreatesPatient_thenForbidden() throws Exception {
        when(securityService.isClinicManagerOf(eq(1L))).thenReturn(false);
        when(securityService.isDoctorOfClinic(eq(1L))).thenReturn(false);

        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("John Doe");
        request.setEmail("john.doe@example.com");
        request.setPhone("0123456789");
        request.setPassword("P@ssword123");
        request.setGender("Male");
        request.setDateOfBirth(java.time.LocalDate.of(1990, 1, 1));
        request.setAddress("123 Street");
        request.setCondition("Hypertension");

        mockMvc.perform(post("/api/v1/clinics/1/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }
}
