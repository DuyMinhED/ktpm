package com.project.service.impl;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.project.dto.request.UpdateClinicRequest;
import com.project.dto.response.ClinicResponse;
import com.project.entity.Appointment;
import com.project.entity.AppointmentStatus;
import com.project.entity.Clinic;
import com.project.entity.Patient;
import com.project.entity.User;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.AppointmentRepository;
import com.project.repository.ClinicRepository;
import com.project.repository.NotificationRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.service.ClinicalAnalyticsService;

@ExtendWith(MockitoExtension.class)
public class ClinicDashboardServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private ClinicalAnalyticsService clinicalAnalyticsService;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ClinicRepository clinicRepository;

    @InjectMocks
    private ClinicDashboardServiceImpl service;

    private Clinic sampleClinic;

    @BeforeEach
    void setUp() {
        sampleClinic = Clinic.builder()
                .id(1L)
                .name("Phòng khám ABC")
                .address("123 HCM")
                .phone("028123456")
                .email("info@abc.com")
                .description("Mô tả")
                .imageUrl("https://img.com/logo.jpg")
                .status("ACTIVE")
                .build();
    }

    // =========================================================================
    // getClinicDetails()
    // =========================================================================

    @Test
    @DisplayName("getClinicDetails — found → returns ClinicResponse")
    void getClinicDetails_found() {
        when(clinicRepository.findById(1L)).thenReturn(Optional.of(sampleClinic));

        ClinicResponse response = service.getClinicDetails(1L);

        assertEquals("Phòng khám ABC", response.getName());
        assertEquals("123 HCM", response.getAddress());
        assertEquals("028123456", response.getPhone());
        assertEquals("info@abc.com", response.getEmail());
    }

    @Test
    @DisplayName("getClinicDetails — not found → RuntimeException")
    void getClinicDetails_notFound() {
        when(clinicRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getClinicDetails(999L));
    }

    // =========================================================================
    // updateClinicDetails()
    // =========================================================================

    @Test
    @DisplayName("updateClinicDetails — valid request → updates all fields")
    void updateClinicDetails_success() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        request.setName("Updated Name");
        request.setAddress("456 HN");
        request.setPhone("024999888");
        request.setEmail("new@abc.com");
        request.setDescription("New desc");
        request.setImageUrl("https://img.com/new.jpg");

        when(clinicRepository.findById(1L)).thenReturn(Optional.of(sampleClinic));

        service.updateClinicDetails(1L, request);

        assertEquals("Updated Name", sampleClinic.getName());
        assertEquals("456 HN", sampleClinic.getAddress());
        assertEquals("024999888", sampleClinic.getPhone());
        verify(clinicRepository).save(sampleClinic);
    }

    @Test
    @DisplayName("updateClinicDetails — clinic not found → exception")
    void updateClinicDetails_notFound() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        when(clinicRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> service.updateClinicDetails(999L, request));
    }

    // =========================================================================
    // updateAppointmentStatus()
    // =========================================================================

    @Test
    @DisplayName("updateAppointmentStatus — doctor belongs to clinic → authorized")
    void updateAppointmentStatus_authorizedByDoctor() {
        Patient patient = Patient.builder().id(1L).userId(1L).fullName("P").phone("0").gender("M").clinicId(1L).build();
        Appointment appointment = Appointment.builder()
                .id(10L).doctorId(5L).patient(patient)
                .status(AppointmentStatus.PENDING).build();

        User doctor = User.builder().id(5L).clinicId(1L).build();

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        assertDoesNotThrow(() -> service.updateAppointmentStatus(1L, 10L, "SCHEDULED"));
        assertEquals(AppointmentStatus.SCHEDULED, appointment.getStatus());
    }

    @Test
    @DisplayName("updateAppointmentStatus — patient belongs to clinic → authorized")
    void updateAppointmentStatus_authorizedByPatient() {
        Patient patient = Patient.builder().id(1L).userId(1L).fullName("P").phone("0").gender("M").clinicId(1L).build();
        Appointment appointment = Appointment.builder()
                .id(10L).doctorId(5L).patient(patient)
                .status(AppointmentStatus.PENDING).build();

        User doctorOtherClinic = User.builder().id(5L).clinicId(99L).build();

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctorOtherClinic));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        assertDoesNotThrow(() -> service.updateAppointmentStatus(1L, 10L, "CANCELLED"));
    }

    @Test
    @DisplayName("updateAppointmentStatus — unauthorized → AccessDeniedException")
    void updateAppointmentStatus_unauthorized() {
        Patient patient = Patient.builder().id(1L).userId(1L).fullName("P").phone("0").gender("M").clinicId(99L).build();
        Appointment appointment = Appointment.builder()
                .id(10L).doctorId(5L).patient(patient)
                .status(AppointmentStatus.PENDING).build();

        User doctorOtherClinic = User.builder().id(5L).clinicId(88L).build();

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctorOtherClinic));

        assertThrows(AccessDeniedException.class, () -> service.updateAppointmentStatus(1L, 10L, "SCHEDULED"));
    }

    @Test
    @DisplayName("updateAppointmentStatus — appointment not found → ResourceNotFoundException")
    void updateAppointmentStatus_notFound() {
        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.updateAppointmentStatus(1L, 999L, "SCHEDULED"));
    }

    @Test
    @DisplayName("updateAppointmentStatus — doctorId null, patient authorized → OK")
    void updateAppointmentStatus_doctorNull_patientAuthorized() {
        Patient patient = Patient.builder().id(1L).userId(1L).fullName("P").phone("0").gender("M").clinicId(1L).build();
        Appointment appointment = Appointment.builder()
                .id(10L).doctorId(null).patient(patient)
                .status(AppointmentStatus.PENDING).build();

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        assertDoesNotThrow(() -> service.updateAppointmentStatus(1L, 10L, "COMPLETED"));
    }
}