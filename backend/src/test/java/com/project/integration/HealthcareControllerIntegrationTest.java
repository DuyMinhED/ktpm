package com.project.integration;

import com.project.repository.HealthMetricRepository;
import com.project.repository.PatientAlertRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HealthcareControllerIntegrationTest extends IntegrationTestBase {

    @Autowired
    private HealthMetricRepository healthMetricRepository;

    @Autowired
    private PatientAlertRepository patientAlertRepository;

    @Test
    void authHealth_isPublic() throws Exception {
        mockMvc.perform(get("/api/v1/auth/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").isNotEmpty());
    }

    @Test
    void loginWithSeededAdmin_returnsJwtAndRole() throws Exception {
        String token = authTestClient.bearerToken(ADMIN_EMAIL, PASSWORD);

        assertThat(token).startsWith("Bearer ");
    }

    @Test
    void patientCannotAccessAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", patientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanListUsersWithDoctorFilter() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", adminToken)
                        .param("role", "DOCTOR")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.content[0].role").value("DOCTOR"));
    }

    @Test
    void clinicManagerCanListClinicPatients() throws Exception {
        mockMvc.perform(get("/api/v1/clinics/1/patients")
                        .header("Authorization", managerToken)
                        .param("keyword", "Truong")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(2)));
    }

    @Test
    void doctorCanOpenAssignedPatientDetail() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/patients/101")
                        .header("Authorization", doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profile.id").value(101))
                .andExpect(jsonPath("$.data.profile.patientCode").value("BN-DUC-001"));
    }

    @Test
    void patientCanReadProfileAndUpcomingAppointments() throws Exception {
        mockMvc.perform(get("/api/v1/patient/profile")
                        .header("Authorization", patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("truongquocan@patient.com"));

        mockMvc.perform(get("/api/v1/patient/appointments/upcoming")
                        .header("Authorization", patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data[0].status").value("SCHEDULED"));
    }

    @Test
    void patientCanCreateHealthMetricAndItPersists() throws Exception {
        long before = healthMetricRepository.count();
        String body = """
                {
                  "metricType": "BLOOD_PRESSURE",
                  "value": 118,
                  "valueSecondary": 78,
                  "unit": "mmHg",
                  "notes": "Integration test metric",
                  "measuredAt": "2026-07-01T08:00:00"
                }
                """;

        mockMvc.perform(post("/api/v1/patient/health-metrics")
                        .header("Authorization", patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.metricType").value("BLOOD_PRESSURE"))
                .andExpect(jsonPath("$.data.unit").value("mmHg"));

        assertThat(healthMetricRepository.count()).isEqualTo(before + 1);
    }

    @Test
    void patientCanDismissOwnDashboardAlert() throws Exception {
        mockMvc.perform(put("/api/v1/patient/dashboard/alerts/4001/dismiss")
                        .header("Authorization", patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(patientAlertRepository.findById(4001L)).isPresent();
        assertThat(patientAlertRepository.findById(4001L).orElseThrow().isDismissed()).isTrue();
    }

    @Test
    void doctorPrescriptionRejectsEmptyMedicationItems() throws Exception {
        String body = """
                {
                  "patientId": 101,
                  "diagnosis": "Integration diagnosis",
                  "notes": "Empty item regression",
                  "items": []
                }
                """;

        mockMvc.perform(post("/api/v1/doctor/prescriptions")
                        .header("Authorization", doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
