package com.project.service.impl;

import com.project.dto.request.CreateHealthMetricRequest;
import com.project.dto.request.CreatePatientRequest;
import com.project.dto.response.ClinicPatientResponse;
import com.project.entity.Appointment;
import com.project.entity.Notification;
import com.project.entity.Patient;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.mapper.PatientMapper;
import com.project.repository.AppointmentRepository;
import com.project.repository.NotificationRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.service.PatientHealthMetricService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClinicPatientServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PatientMapper patientMapper;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientHealthMetricService healthMetricService;

    @InjectMocks
    private ClinicPatientServiceImpl service;

    @Test
    @DisplayName("getPatientRecords - applies filters and maps doctor names")
    void getPatientRecords_mapsPatientsWithDoctorMap() {
        Patient patient = patient(10L, 100L, 1L);
        User doctor = doctor(20L, 1L, "Dr. House");
        ClinicPatientResponse response = ClinicPatientResponse.builder()
                .dbId(10L)
                .id("BN-1001")
                .name("Nguyen Van A")
                .doctor("Dr. House")
                .build();
        PageRequest pageable = PageRequest.of(0, 10);

        when(patientRepository.findByClinicIdAndFilters(1L, "nguyen", "Diabetes", "HIGH", "ACTIVE", "House", pageable))
                .thenReturn(new PageImpl<>(List.of(patient), pageable, 1));
        when(userRepository.findByFilters(UserRole.DOCTOR, "ACTIVE", 1L, null, null, null, null, PageRequest.of(0, 100)))
                .thenReturn(new PageImpl<>(List.of(doctor)));
        when(patientMapper.toClinicPatientResponse(eq(patient), any(Map.class))).thenReturn(response);

        Page<ClinicPatientResponse> result = service.getPatientRecords(1L, "nguyen", "Diabetes", "HIGH", "ACTIVE", "House", pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Dr. House", result.getContent().get(0).getDoctor());
        verify(patientMapper).toClinicPatientResponse(eq(patient), eq(Map.of(20L, "Dr. House")));
    }

    @Test
    @DisplayName("getPatientRecords - keeps first doctor name when duplicate doctor ids are returned")
    void getPatientRecords_duplicateDoctorIdsKeepsFirstName() {
        Patient patient = patient(10L, 100L, 1L);
        User first = doctor(20L, 1L, "Dr. First");
        User duplicate = doctor(20L, 1L, "Dr. Duplicate");
        PageRequest pageable = PageRequest.of(0, 10);

        when(patientRepository.findByClinicIdAndFilters(1L, null, null, null, null, null, pageable))
                .thenReturn(new PageImpl<>(List.of(patient), pageable, 1));
        when(userRepository.findByFilters(UserRole.DOCTOR, "ACTIVE", 1L, null, null, null, null, PageRequest.of(0, 100)))
                .thenReturn(new PageImpl<>(List.of(first, duplicate)));
        when(patientMapper.toClinicPatientResponse(eq(patient), any(Map.class)))
                .thenReturn(ClinicPatientResponse.builder().dbId(10L).build());

        service.getPatientRecords(1L, null, null, null, null, null, pageable);

        verify(patientMapper).toClinicPatientResponse(eq(patient), eq(Map.of(20L, "Dr. First")));
    }

    @Test
    @DisplayName("createPatient - fills default email/password, resolves doctor by name, and records baseline metrics")
    void createPatient_defaultsAndRecordsMetrics() {
        CreatePatientRequest request = baseRequest();
        request.setEmail(" ");
        request.setAge("45");
        request.setAssignedDoctor("BS. Strange");
        request.setInitialGlucose(new BigDecimal("6.7"));
        request.setInitialBpSystolic(new BigDecimal("125"));
        request.setInitialBpDiastolic(new BigDecimal("80"));

        when(userRepository.findByEmail("0901234567@care.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("encoded-default");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(100L);
            return saved;
        });
        when(userRepository.findByFilters(UserRole.DOCTOR, "ACTIVE", 1L, null, null, null, "Strange", PageRequest.of(0, 1)))
                .thenReturn(new PageImpl<>(List.of(doctor(20L, 1L, "Dr. Strange"))));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
            Patient saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        service.createPatient(1L, request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        ArgumentCaptor<CreateHealthMetricRequest> metricCaptor = ArgumentCaptor.forClass(CreateHealthMetricRequest.class);
        verify(userRepository).save(userCaptor.capture());
        verify(patientRepository).save(patientCaptor.capture());
        verify(healthMetricService, times(2)).recordMetricForPatient(eq(10L), metricCaptor.capture());

        User savedUser = userCaptor.getValue();
        Patient savedPatient = patientCaptor.getValue();
        assertEquals("0901234567@care.com", savedUser.getEmail());
        assertEquals("encoded-default", savedUser.getPassword());
        assertEquals(UserRole.PATIENT, savedUser.getRole());
        assertEquals(20L, savedPatient.getDoctorId());
        assertEquals("Hypertension", savedPatient.getChronicCondition());
        assertEquals(LocalDate.now().minusYears(45), savedPatient.getDateOfBirth());
        assertTrue(savedPatient.getPatientCode().startsWith("BN-"));
        assertEquals(List.of("BLOOD_SUGAR", "BLOOD_PRESSURE"),
                metricCaptor.getAllValues().stream().map(CreateHealthMetricRequest::getMetricType).toList());
    }

    @Test
    @DisplayName("createPatient - rejects duplicated email before saving user or patient")
    void createPatient_duplicateEmailThrows() {
        CreatePatientRequest request = baseRequest();
        request.setEmail("used@example.com");

        when(userRepository.findByEmail("used@example.com")).thenReturn(Optional.of(User.builder().id(1L).build()));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.createPatient(1L, request));

        assertTrue(ex.getMessage().contains("Email"));
        verify(userRepository, never()).save(any(User.class));
        verify(patientRepository, never()).save(any(Patient.class));
    }

    @Test
    @DisplayName("createPatient - uses numeric doctor id, explicit birth date, password and insurance fallback")
    void createPatient_numericDoctorAndExplicitFields() {
        CreatePatientRequest request = baseRequest();
        request.setEmail("patient@example.com");
        request.setPassword("secret");
        request.setDoctorId(30L);
        request.setDateOfBirth(LocalDate.of(1990, 1, 2));
        request.setPrimaryCondition(null);
        request.setCondition("Asthma");
        request.setTreatmentStatus(null);
        request.setStatus(null);
        request.setInsuranceNumber(null);
        request.setHealthInsuranceNumber("HI-001");

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("encoded-secret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(101L);
            return saved;
        });
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.createPatient(1L, request);

        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        verify(patientRepository).save(patientCaptor.capture());
        Patient savedPatient = patientCaptor.getValue();
        assertEquals(30L, savedPatient.getDoctorId());
        assertEquals(LocalDate.of(1990, 1, 2), savedPatient.getDateOfBirth());
        assertEquals("Asthma", savedPatient.getChronicCondition());
        assertEquals("HI-001", savedPatient.getHealthInsuranceNumber());
        assertNotNull(savedPatient.getTreatmentStatus());
        assertNotNull(savedPatient.getProfileStatus());
        verify(healthMetricService, never()).recordMetricForPatient(any(), any());
    }

    @Test
    @DisplayName("createPatient - handles null email, invalid age, and empty assigned doctor")
    void createPatient_nullEmailInvalidAgeAndEmptyAssignedDoctor() {
        CreatePatientRequest request = baseRequest();
        request.setEmail(null);
        request.setPassword(null);
        request.setAge("not-a-number");
        request.setAssignedDoctor("");

        when(userRepository.findByEmail("0901234567@care.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("encoded-default");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(102L);
            return saved;
        });
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.createPatient(1L, request);

        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        verify(patientRepository).save(patientCaptor.capture());
        Patient savedPatient = patientCaptor.getValue();
        assertEquals("0901234567@care.com", savedPatient.getEmail());
        assertNull(savedPatient.getDoctorId());
        assertEquals(LocalDate.now(), savedPatient.getDateOfBirth());
    }

    @Test
    @DisplayName("createPatient - parses assigned doctor numeric string without doctor lookup")
    void createPatient_assignedDoctorNumericString() {
        CreatePatientRequest request = baseRequest();
        request.setDoctorId(null);
        request.setAssignedDoctor("45");

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("encoded-default");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(103L);
            return saved;
        });
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.createPatient(1L, request);

        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        verify(patientRepository).save(patientCaptor.capture());
        assertEquals(45L, patientCaptor.getValue().getDoctorId());
        verify(userRepository, never()).findByFilters(UserRole.DOCTOR, "ACTIVE", 1L, null, null, null, "45", PageRequest.of(0, 1));
    }

    @Test
    @DisplayName("createPatient - leaves doctor empty when assigned doctor name is not found")
    void createPatient_assignedDoctorNameNotFound() {
        CreatePatientRequest request = baseRequest();
        request.setDoctorId(null);
        request.setAssignedDoctor("Unknown Doctor");

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("encoded-default");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(104L);
            return saved;
        });
        when(userRepository.findByFilters(UserRole.DOCTOR, "ACTIVE", 1L, null, null, null, "Unknown Doctor", PageRequest.of(0, 1)))
                .thenReturn(new PageImpl<>(List.of()));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.createPatient(1L, request);

        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        verify(patientRepository).save(patientCaptor.capture());
        assertNull(patientCaptor.getValue().getDoctorId());
    }

    @Test
    @DisplayName("updatePatient - updates patient/user fields, assigns clinic doctor and creates appointment")
    void updatePatient_updatesUserDoctorAndAppointment() {
        CreatePatientRequest request = baseRequest();
        request.setName("Tran Thi B");
        request.setEmail("new@example.com");
        request.setPassword("new-secret");
        request.setDoctorId(20L);
        request.setAssignmentDate(LocalDate.of(2026, 7, 4));
        request.setAssignmentTime("09:30");
        request.setAppointmentType("ONLINE");
        request.setMeetingLink("https://meet.example/test");
        Patient patient = patient(10L, 100L, 1L);
        User user = User.builder().id(100L).email("old@example.com").password("old").build();

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-secret")).thenReturn("encoded-new");
        when(userRepository.findById(20L)).thenReturn(Optional.of(doctor(20L, 1L, "Dr. Good")));

        service.updatePatient(1L, 10L, request);

        ArgumentCaptor<Appointment> appointmentCaptor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(appointmentCaptor.capture());
        verify(userRepository).save(user);
        verify(patientRepository).save(patient);

        Appointment appointment = appointmentCaptor.getValue();
        assertEquals("Tran Thi B", patient.getFullName());
        assertEquals("new@example.com", patient.getEmail());
        assertEquals("new@example.com", user.getEmail());
        assertEquals("encoded-new", user.getPassword());
        assertEquals(20L, patient.getDoctorId());
        assertEquals(20L, appointment.getDoctorId());
        assertEquals("ONLINE", appointment.getType());
        assertEquals("https://meet.example/test", appointment.getMeetingLink());
        assertEquals(appointment.getAppointmentTime().plusMinutes(30), appointment.getEndTime());
    }

    @Test
    @DisplayName("updatePatient - clears doctor when request doctor id is -1 and ignores invalid appointment time")
    void updatePatient_clearsDoctorAndSwallowsInvalidAppointmentTime() {
        CreatePatientRequest request = baseRequest();
        request.setDoctorId(-1L);
        request.setAssignmentDate(LocalDate.of(2026, 7, 4));
        request.setAssignmentTime("bad-time");
        Patient patient = patient(10L, 100L, 1L);
        patient.setDoctorId(20L);

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(100L)).thenReturn(Optional.empty());

        service.updatePatient(1L, 10L, request);

        assertNull(patient.getDoctorId());
        verify(appointmentRepository, never()).save(any(Appointment.class));
        verify(patientRepository).save(patient);
    }

    @Test
    @DisplayName("updatePatient - ignores doctor from another clinic and skips appointment when time is missing")
    void updatePatient_ignoresCrossClinicDoctorAndMissingAppointmentTime() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setDoctorId(30L);
        request.setAssignmentDate(LocalDate.of(2026, 7, 4));
        Patient patient = patient(10L, 100L, 1L);

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(100L)).thenReturn(Optional.empty());
        when(userRepository.findById(30L)).thenReturn(Optional.of(doctor(30L, 2L, "Dr. Other Clinic")));

        service.updatePatient(1L, 10L, request);

        assertEquals(20L, patient.getDoctorId());
        verify(appointmentRepository, never()).save(any(Appointment.class));
        verify(patientRepository).save(patient);
    }

    @Test
    @DisplayName("updatePatient - blank request preserves optional fields and skips user credential updates")
    void updatePatient_blankRequestPreservesOptionalFields() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setEmail(" ");
        request.setPassword(" ");
        request.setAvatarUrl(" ");
        Patient patient = patient(10L, 100L, 1L);
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));
        User user = User.builder()
                .id(100L)
                .email("old@example.com")
                .password("old-password")
                .avatarUrl("old-avatar")
                .build();

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(100L)).thenReturn(Optional.of(user));

        service.updatePatient(1L, 10L, request);

        assertEquals("patient@example.com", patient.getEmail());
        assertEquals(LocalDate.of(1990, 1, 1), patient.getDateOfBirth());
        assertEquals("old@example.com", user.getEmail());
        assertEquals("old-password", user.getPassword());
        assertEquals("old-avatar", user.getAvatarUrl());
        verify(passwordEncoder, never()).encode(any());
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("updatePatient - null user credential fields and invalid age leave persisted values untouched")
    void updatePatient_nullUserCredentialFieldsAndInvalidAge() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setAge("not-a-number");
        Patient patient = patient(10L, 100L, 1L);
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));
        User user = User.builder()
                .id(100L)
                .email("old@example.com")
                .password("old-password")
                .avatarUrl("old-avatar")
                .build();

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(100L)).thenReturn(Optional.of(user));

        service.updatePatient(1L, 10L, request);

        assertEquals(LocalDate.of(1990, 1, 1), patient.getDateOfBirth());
        assertEquals("old@example.com", user.getEmail());
        assertEquals("old-password", user.getPassword());
        assertEquals("old-avatar", user.getAvatarUrl());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    @DisplayName("updatePatient - blank age skips birth date recalculation")
    void updatePatient_blankAgeSkipsBirthDateRecalculation() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setAge(" ");
        Patient patient = patient(10L, 100L, 1L);
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(100L)).thenReturn(Optional.empty());

        service.updatePatient(1L, 10L, request);

        assertEquals(LocalDate.of(1990, 1, 1), patient.getDateOfBirth());
        verify(patientRepository).save(patient);
    }

    @Test
    @DisplayName("updatePatient - applies explicit birth date and default appointment type")
    void updatePatient_explicitBirthDateAndDefaultAppointmentType() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setDateOfBirth(LocalDate.of(1988, 5, 20));
        request.setDoctorId(20L);
        request.setAssignmentDate(LocalDate.of(2026, 7, 5));
        request.setAssignmentTime("08:15");
        Patient patient = patient(10L, 100L, 1L);

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(100L)).thenReturn(Optional.empty());
        when(userRepository.findById(20L)).thenReturn(Optional.of(doctor(20L, 1L, "Dr. Good")));

        service.updatePatient(1L, 10L, request);

        ArgumentCaptor<Appointment> appointmentCaptor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(appointmentCaptor.capture());
        assertEquals(LocalDate.of(1988, 5, 20), patient.getDateOfBirth());
        assertEquals("IN_PERSON", appointmentCaptor.getValue().getType());
    }

    @Test
    @DisplayName("updatePatient - catches appointment persistence failure and still saves patient")
    void updatePatient_appointmentSaveThrowsStillSavesPatient() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setDoctorId(20L);
        request.setAssignmentDate(LocalDate.of(2026, 7, 5));
        request.setAssignmentTime("08:15");
        Patient patient = patient(10L, 100L, 1L);

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(100L)).thenReturn(Optional.empty());
        when(userRepository.findById(20L)).thenReturn(Optional.of(doctor(20L, 1L, "Dr. Good")));
        when(appointmentRepository.save(any(Appointment.class))).thenThrow(new RuntimeException("calendar down"));

        service.updatePatient(1L, 10L, request);

        verify(patientRepository).save(patient);
    }

    @Test
    @DisplayName("updatePatient - rejects missing or cross-clinic patient")
    void updatePatient_missingOrUnauthorizedThrows() {
        when(patientRepository.findById(10L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.updatePatient(1L, 10L, baseRequest()));

        when(patientRepository.findById(11L)).thenReturn(Optional.of(patient(11L, 100L, 2L)));
        assertThrows(AccessDeniedException.class, () -> service.updatePatient(1L, 11L, baseRequest()));

        verify(patientRepository, never()).save(any(Patient.class));
    }

    @Test
    @DisplayName("deletePatient - soft deletes patient and linked user")
    void deletePatient_softDeletesPatientAndUser() {
        Patient patient = patient(10L, 100L, 1L);
        User user = User.builder().id(100L).build();

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(100L)).thenReturn(Optional.of(user));

        service.deletePatient(1L, 10L);

        assertTrue(patient.isDeleted());
        assertTrue(user.isDeleted());
        verify(patientRepository).save(patient);
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("deletePatient - rejects missing or cross-clinic patient")
    void deletePatient_missingOrUnauthorizedThrows() {
        when(patientRepository.findById(10L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.deletePatient(1L, 10L));

        when(patientRepository.findById(11L)).thenReturn(Optional.of(patient(11L, 100L, 2L)));
        assertThrows(AccessDeniedException.class, () -> service.deletePatient(1L, 11L));

        verify(patientRepository, never()).save(any(Patient.class));
    }

    @Test
    @DisplayName("sendNotificationToPatient - saves system notification for clinic patient")
    void sendNotificationToPatient_savesNotification() {
        Patient patient = patient(10L, 100L, 1L);
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));

        service.sendNotificationToPatient(1L, 10L, "Remember appointment");

        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification notification = notificationCaptor.getValue();
        assertEquals(100L, notification.getUserId());
        assertEquals("Remember appointment", notification.getMessage());
        assertEquals("SYSTEM", notification.getType());
        assertFalse(notification.isRead());
    }

    @Test
    @DisplayName("sendNotificationToPatient - rejects missing or cross-clinic patient")
    void sendNotificationToPatient_missingOrUnauthorizedThrows() {
        when(patientRepository.findById(10L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.sendNotificationToPatient(1L, 10L, "msg"));

        when(patientRepository.findById(11L)).thenReturn(Optional.of(patient(11L, 100L, 2L)));
        assertThrows(AccessDeniedException.class, () -> service.sendNotificationToPatient(1L, 11L, "msg"));

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    private CreatePatientRequest baseRequest() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("Nguyen Van A");
        request.setAge("30");
        request.setGender("MALE");
        request.setPhone("0901234567");
        request.setEmail("patient@example.com");
        request.setAddress("Ha Noi");
        request.setPrimaryCondition("Hypertension");
        request.setCondition("Diabetes");
        request.setRiskLevel("HIGH");
        request.setTreatmentStatus("Monitoring");
        request.setStatus("ACTIVE");
        request.setNotes("Follow closely");
        request.setIdentityCard("012345678901");
        request.setOccupation("Teacher");
        request.setEthnicity("Kinh");
        request.setInsuranceNumber("INS-001");
        request.setAvatarUrl("https://cdn.example/avatar.png");
        request.setWeightKg(new BigDecimal("60.5"));
        request.setHeightCm(new BigDecimal("170.2"));
        request.setBloodType("O+");
        return request;
    }

    private Patient patient(Long id, Long userId, Long clinicId) {
        return Patient.builder()
                .id(id)
                .userId(userId)
                .clinicId(clinicId)
                .fullName("Nguyen Van A")
                .phone("0901234567")
                .email("patient@example.com")
                .gender("MALE")
                .address("Ha Noi")
                .doctorId(20L)
                .build();
    }

    private User doctor(Long id, Long clinicId, String fullName) {
        return User.builder()
                .id(id)
                .clinicId(clinicId)
                .role(UserRole.DOCTOR)
                .status("ACTIVE")
                .fullName(fullName)
                .build();
    }
}
