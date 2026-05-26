package com.project.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.request.CreatePatientRequest;
import com.project.dto.request.DoctorCreateAppointmentRequest;
import com.project.dto.request.UpdateClinicRequest;
import com.project.dto.response.ClinicAppointmentResponse;
import com.project.dto.response.ClinicDashboardResponse;
import com.project.dto.response.ClinicDoctorResponse;
import com.project.dto.response.ClinicPatientResponse;
import com.project.dto.response.ClinicResponse;
import com.project.dto.response.DoctorSnippetDto;
import com.project.security.CustomUserDetailsService;
import com.project.security.JwtAuthenticationEntryPoint;
import com.project.security.JwtAuthenticationFilter;
import com.project.security.JwtTokenProvider;
import com.project.service.ClinicDashboardService;
import com.project.service.ClinicDoctorService;
import com.project.service.ClinicPatientService;
import com.project.service.PatientHealthMetricService;

@WebMvcTest(controllers = ClinicDashboardController.class, excludeAutoConfiguration = { SecurityAutoConfiguration.class })
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

    // Mock Security dependencies to prevent loading real security filter
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

    private Long clinicId = 1L;

    @BeforeEach
    void setUp() {
    }

    @Test
    void getDashboard_success() throws Exception {
        ClinicDashboardResponse mockResponse = ClinicDashboardResponse.builder().build();
        when(clinicDashboardService.getDashboardData(clinicId, "6m")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/dashboard", clinicId)
                .param("period", "6m")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Dashboard info fetched"));

        verify(clinicDashboardService, times(1)).getDashboardData(clinicId, "6m");
    }

    @Test
    void getPatients_success() throws Exception {
        ClinicPatientResponse patientResponse = new ClinicPatientResponse();
        Page<ClinicPatientResponse> patientPage = new PageImpl<>(Collections.singletonList(patientResponse));
        
        when(clinicPatientService.getPatientRecords(eq(clinicId), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(patientPage);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/patients", clinicId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Patients fetched"));

        verify(clinicPatientService, times(1)).getPatientRecords(eq(clinicId), any(), any(), any(), any(), any(), any(Pageable.class));
    }

    @Test
    void createPatient_success() throws Exception {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("John Doe");
        request.setGender("MALE");
        request.setPhone("0123456789");
        
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
    void deletePatient_success() throws Exception {
        Long patientId = 100L;
        doNothing().when(clinicPatientService).deletePatient(clinicId, patientId);

        mockMvc.perform(delete("/api/v1/clinics/{clinicId}/patients/{patientId}", clinicId, patientId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Patient deleted successfully"));

        verify(clinicPatientService, times(1)).deletePatient(clinicId, patientId);
    }

    @Test
    void getDoctors_success() throws Exception {
        ClinicDoctorResponse doctorResponse = ClinicDoctorResponse.builder().build();
        Page<ClinicDoctorResponse> doctorPage = new PageImpl<>(Collections.singletonList(doctorResponse));
        
        when(clinicDoctorService.getDoctorRecords(eq(clinicId), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(doctorPage);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/doctors", clinicId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Doctors fetched"));

        verify(clinicDoctorService, times(1)).getDoctorRecords(eq(clinicId), any(), any(), any(), any(), any(), any(Pageable.class));
    }

    @Test
    void createDoctor_success() throws Exception {
        CreateDoctorRequest request = new CreateDoctorRequest();
        request.setName("Dr. Smith");
        request.setEmail("smith@clinic.com");
        request.setPhone("0987654321");
        request.setSpecialty("Cardiology");
        request.setLicenseNumber("LIC123456");
        
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
    void getAvailableDoctors_success() throws Exception {
        DoctorSnippetDto snippet = new DoctorSnippetDto();
        when(clinicDoctorService.getAvailableDoctors(clinicId)).thenReturn(Collections.singletonList(snippet));

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/doctors/available", clinicId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Doctors fetched successfully"));

        verify(clinicDoctorService, times(1)).getAvailableDoctors(clinicId);
    }

    @Test
    void getAppointments_success() throws Exception {
        ClinicAppointmentResponse appointmentResponse = new ClinicAppointmentResponse();
        Page<ClinicAppointmentResponse> appointmentPage = new PageImpl<>(Collections.singletonList(appointmentResponse));
        
        when(clinicDashboardService.getAppointmentRecords(eq(clinicId), any(Pageable.class)))
                .thenReturn(appointmentPage);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/appointments", clinicId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Appointments fetched"));

        verify(clinicDashboardService, times(1)).getAppointmentRecords(eq(clinicId), any(Pageable.class));
    }
    
    @Test
    void getProfile_success() throws Exception {
        ClinicResponse clinicResponse = ClinicResponse.builder().build();
        when(clinicDashboardService.getClinicDetails(clinicId)).thenReturn(clinicResponse);

        mockMvc.perform(get("/api/v1/clinics/{clinicId}/profile", clinicId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Clinic profile fetched"));

        verify(clinicDashboardService, times(1)).getClinicDetails(clinicId);
    }
}
