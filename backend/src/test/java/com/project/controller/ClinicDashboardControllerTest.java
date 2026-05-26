package com.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.request.CreatePatientRequest;
import com.project.dto.request.DoctorCreateAppointmentRequest;
import com.project.dto.request.UpdateClinicRequest;
import com.project.dto.request.CreateHealthMetricRequest;
import com.project.dto.response.*;
import com.project.security.CustomUserDetailsService;
import com.project.security.JwtAuthenticationEntryPoint;
import com.project.security.JwtAuthenticationFilter;
import com.project.security.JwtTokenProvider;
import com.project.service.ClinicDashboardService;
import com.project.service.ClinicDoctorService;
import com.project.service.ClinicPatientService;
import com.project.service.PatientHealthMetricService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ClinicDashboardController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class ClinicDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClinicDashboardService clinicDashboardService;

    @MockBean
    private ClinicPatientService clinicPatientService;

    @MockBean
    private ClinicDoctorService clinicDoctorService;

    @MockBean
    private PatientHealthMetricService patientHealthMetricService;

    // Mock JdbcTemplate and PasswordEncoder to satisfy the initSchema CommandLineRunner bean in BackendApplication
    @MockBean
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @MockBean
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // Mock Security dependencies to prevent context loading errors
    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    private Long clinicId;

    @BeforeEach
    void setUp() {
        clinicId = 1L;
    }

    @Test
    void getDashboard_success() throws Exception {
        ClinicDashboardResponse mockResponse = ClinicDashboardResponse.builder()
                .totalPatients(100L)
                .highRiskAlerts(5L)
                .build();
        when(clinicDashboardService.getDashboardData(eq(clinicId), eq("6m"))).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/dashboard", clinicId)
                        .param("period", "6m")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Dashboard info fetched"))
                .andExpect(jsonPath("$.data.totalPatients").value(100))
                .andExpect(jsonPath("$.data.highRiskAlerts").value(5));

        verify(clinicDashboardService, times(1)).getDashboardData(eq(clinicId), eq("6m"));
    }

    @Test
    void getPatients_success() throws Exception {
        ClinicPatientResponse patientResponse = ClinicPatientResponse.builder()
                .dbId(1L)
                .name("John Doe")
                .status("Hoạt động")
                .build();
        Page<ClinicPatientResponse> pageResult = new PageImpl<>(Collections.singletonList(patientResponse));

        when(clinicPatientService.getPatientRecords(eq(clinicId), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(pageResult);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/patients", clinicId)
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Patients fetched"))
                .andExpect(jsonPath("$.data.content[0].name").value("John Doe"));
    }

    @Test
    void createPatient_success() throws Exception {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("John Doe");
        request.setEmail("john.doe@example.com");
        request.setPhone("0123456789");
        request.setPassword("P@ssword123");
        request.setGender("Male");
        request.setDateOfBirth(LocalDate.of(1990, 1, 1));
        request.setAddress("123 Street");
        request.setCondition("Hypertension");

        doNothing().when(clinicPatientService).createPatient(eq(clinicId), any(CreatePatientRequest.class));

        mockMvc.perform(post("/api/v1/clinics/{clinicId}/patients", clinicId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Patient registered successfully"));

        verify(clinicPatientService, times(1)).createPatient(eq(clinicId), any(CreatePatientRequest.class));
    }

    @Test
    void updatePatient_success() throws Exception {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("John Doe Updated");
        request.setEmail("john.doe@example.com");
        request.setPhone("0123456789");
        request.setPassword("P@ssword123");
        request.setGender("Male");
        request.setDateOfBirth(LocalDate.of(1990, 1, 1));
        request.setAddress("123 Street");
        request.setCondition("Hypertension");
        Long patientId = 2L;

        doNothing().when(clinicPatientService).updatePatient(eq(clinicId), eq(patientId), any(CreatePatientRequest.class));

        mockMvc.perform(put("/api/v1/clinics/{clinicId}/patients/{patientId}", clinicId, patientId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Patient updated successfully"));

        verify(clinicPatientService, times(1)).updatePatient(eq(clinicId), eq(patientId), any(CreatePatientRequest.class));
    }

    @Test
    void deletePatient_success() throws Exception {
        Long patientId = 2L;
        doNothing().when(clinicPatientService).deletePatient(eq(clinicId), eq(patientId));

        mockMvc.perform(delete("/api/v1/clinics/{clinicId}/patients/{patientId}", clinicId, patientId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Patient deleted successfully"));

        verify(clinicPatientService, times(1)).deletePatient(eq(clinicId), eq(patientId));
    }

    @Test
    void getDoctors_success() throws Exception {
        ClinicDoctorResponse doctorResponse = ClinicDoctorResponse.builder()
                .dbId(1L)
                .name("Dr. Smith")
                .specialty("Cardiology")
                .build();
        Page<ClinicDoctorResponse> pageResult = new PageImpl<>(Collections.singletonList(doctorResponse));

        when(clinicDoctorService.getDoctorRecords(eq(clinicId), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(pageResult);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/doctors", clinicId)
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Doctors fetched"))
                .andExpect(jsonPath("$.data.content[0].name").value("Dr. Smith"));
    }

    @Test
    void createDoctor_success() throws Exception {
        CreateDoctorRequest request = new CreateDoctorRequest();
        request.setName("Dr. Smith");
        request.setEmail("smith@example.com");
        request.setPhone("0987654321");
        request.setPassword("P@ssword123");
        request.setSpecialty("Cardiology");
        request.setLicenseNumber("LIC123");
        request.setDegree("MD");
        request.setExperience("10 years");

        doNothing().when(clinicDoctorService).createDoctor(eq(clinicId), any(CreateDoctorRequest.class));

        mockMvc.perform(post("/api/v1/clinics/{clinicId}/doctors", clinicId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Doctor registered successfully"));

        verify(clinicDoctorService, times(1)).createDoctor(eq(clinicId), any(CreateDoctorRequest.class));
    }

    @Test
    void updateDoctor_success() throws Exception {
        CreateDoctorRequest request = new CreateDoctorRequest();
        request.setName("Dr. Smith Updated");
        request.setEmail("smith@example.com");
        request.setPhone("0987654321");
        request.setPassword("P@ssword123");
        request.setSpecialty("Cardiology");
        request.setLicenseNumber("LIC123");
        request.setDegree("MD");
        request.setExperience("10 years");
        Long doctorId = 3L;

        doNothing().when(clinicDoctorService).updateDoctor(eq(clinicId), eq(doctorId), any(CreateDoctorRequest.class));

        mockMvc.perform(put("/api/v1/clinics/{clinicId}/doctors/{doctorId}", clinicId, doctorId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Doctor updated successfully"));

        verify(clinicDoctorService, times(1)).updateDoctor(eq(clinicId), eq(doctorId), any(CreateDoctorRequest.class));
    }

    @Test
    void deleteDoctor_success() throws Exception {
        Long doctorId = 3L;
        doNothing().when(clinicDoctorService).deleteDoctor(eq(clinicId), eq(doctorId));

        mockMvc.perform(delete("/api/v1/clinics/{clinicId}/doctors/{doctorId}", clinicId, doctorId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Doctor deleted successfully"));

        verify(clinicDoctorService, times(1)).deleteDoctor(eq(clinicId), eq(doctorId));
    }

    @Test
    void getAvailableDoctors_success() throws Exception {
        DoctorSnippetDto snippet = DoctorSnippetDto.builder()
                .id(1L)
                .name("Dr. Smith")
                .specialty("Cardiology")
                .build();
        when(clinicDoctorService.getAvailableDoctors(eq(clinicId))).thenReturn(Collections.singletonList(snippet));

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/doctors/available", clinicId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Doctors fetched successfully"))
                .andExpect(jsonPath("$.data[0].name").value("Dr. Smith"));
    }

    @Test
    void getConditions_success() throws Exception {
        List<String> conditions = List.of("Hypertension", "Diabetes");
        when(clinicDashboardService.getChronicConditions()).thenReturn(conditions);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/conditions", clinicId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Conditions fetched successfully"))
                .andExpect(jsonPath("$.data[0]").value("Hypertension"));
    }

    @Test
    void getAppointments_success() throws Exception {
        ClinicAppointmentResponse appointment = ClinicAppointmentResponse.builder()
                .id(1L)
                .patientName("John Doe")
                .doctorName("Dr. Smith")
                .build();
        Page<ClinicAppointmentResponse> pageResult = new PageImpl<>(Collections.singletonList(appointment));
        when(clinicDashboardService.getAppointmentRecords(eq(clinicId), any(Pageable.class))).thenReturn(pageResult);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/appointments", clinicId)
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Appointments fetched"))
                .andExpect(jsonPath("$.data.content[0].patientName").value("John Doe"));
    }

    @Test
    void createAppointment_success() throws Exception {
        DoctorCreateAppointmentRequest request = new DoctorCreateAppointmentRequest();
        request.setPatientId(1L);
        request.setAppointmentDate("2026-05-26");
        request.setAppointmentTime("10:00");
        request.setType("OFFLINE");
        request.setNotes("Regular Checkup");

        doNothing().when(clinicDashboardService).createAppointment(eq(clinicId), any(DoctorCreateAppointmentRequest.class));

        mockMvc.perform(post("/api/v1/clinics/{clinicId}/appointments", clinicId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Appointment created successfully"));
    }

    @Test
    void notifyPatient_success() throws Exception {
        Long patientId = 2L;
        Map<String, String> body = Map.of("message", "Hello Patient");
        doNothing().when(clinicPatientService).sendNotificationToPatient(eq(clinicId), eq(patientId), eq("Hello Patient"));

        mockMvc.perform(post("/api/v1/clinics/{clinicId}/patients/{patientId}/notify", clinicId, patientId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Notification sent"));
    }

    @Test
    void getProfile_success() throws Exception {
        ClinicResponse response = ClinicResponse.builder()
                .id(clinicId)
                .name("General Clinic")
                .build();
        when(clinicDashboardService.getClinicDetails(eq(clinicId))).thenReturn(response);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/profile", clinicId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Clinic profile fetched"))
                .andExpect(jsonPath("$.data.name").value("General Clinic"));
    }

    @Test
    void updateProfile_success() throws Exception {
        UpdateClinicRequest request = new UpdateClinicRequest();
        request.setName("Updated Clinic Name");
        request.setPhone("0123456789");
        request.setEmail("clinic@example.com");
        request.setAddress("456 Road");
        request.setDescription("Best Clinic");

        doNothing().when(clinicDashboardService).updateClinicDetails(eq(clinicId), any(UpdateClinicRequest.class));

        mockMvc.perform(put("/api/v1/clinics/{clinicId}/profile", clinicId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Clinic profile updated"));
    }

    @Test
    void recordPatientMetric_success() throws Exception {
        Long patientId = 2L;
        CreateHealthMetricRequest request = new CreateHealthMetricRequest();
        request.setMetricType("BLOOD_SUGAR");
        request.setValue(new BigDecimal("120.00"));
        request.setUnit("mg/dL");
        request.setNotes("Normal");

        HealthMetricResponse response = HealthMetricResponse.builder()
                .id(1L)
                .metricType("BLOOD_SUGAR")
                .value(new BigDecimal("120.00"))
                .build();

        when(patientHealthMetricService.recordMetricForPatient(eq(patientId), any(CreateHealthMetricRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/clinics/{clinicId}/patients/{patientId}/health-metrics", clinicId, patientId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Health metric recorded successfully"))
                .andExpect(jsonPath("$.data.value").value(120.00));
    }

    @Test
    void batchReschedule_success() throws Exception {
        when(clinicDashboardService.batchReschedule(eq(clinicId), any(java.time.LocalDate.class), any(java.time.LocalDate.class)))
                .thenReturn(5);

        mockMvc.perform(put("/api/v1/clinics/{clinicId}/appointments/batch-reschedule", clinicId)
                        .param("sourceDate", "2026-05-26")
                        .param("targetDate", "2026-05-27")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đã dời 5 ca hẹn thành công!"))
                .andExpect(jsonPath("$.data.movedCount").value(5));
    }

    // === KCPM-20: Error-handling Scenarios ===

    @Test
    void createPatient_validationFailed() throws Exception {
        CreatePatientRequest request = new CreatePatientRequest();
        // Empty name and phone should trigger validation errors (Constraint violation)
        request.setName("");
        request.setPhone("");
        request.setGender("");

        mockMvc.perform(post("/api/v1/clinics/{clinicId}/patients", clinicId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    void deletePatient_notFound() throws Exception {
        Long patientId = 999L;
        doThrow(new com.project.exception.ResourceNotFoundException("Patient not found"))
                .when(clinicPatientService).deletePatient(eq(clinicId), eq(patientId));

        mockMvc.perform(delete("/api/v1/clinics/{clinicId}/patients/{patientId}", clinicId, patientId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Patient not found"));
    }

    @Test
    void getDashboard_runtimeException() throws Exception {
        when(clinicDashboardService.getDashboardData(eq(clinicId), eq("6m")))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/dashboard", clinicId)
                        .param("period", "6m")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Hệ thống đang bận hoặc có lỗi xảy ra. Vui lòng thử lại sau."));
    }
}
