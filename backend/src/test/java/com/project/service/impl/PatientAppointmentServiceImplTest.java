package com.project.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.project.dto.request.CreateAppointmentRequest;
import com.project.dto.response.PatientAppointmentResponse;
import com.project.entity.Appointment;
import com.project.entity.AppointmentStatus;
import com.project.entity.Clinic;
import com.project.entity.Patient;
import com.project.entity.User;
import com.project.repository.AppointmentRepository;
import com.project.repository.PatientRepository;
import com.project.service.NotificationService;
import com.project.util.SecurityUtils;

@ExtendWith(MockitoExtension.class)
public class PatientAppointmentServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private com.project.repository.UserRepository userRepository;

    @Mock
    private com.project.repository.ClinicRepository clinicRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PatientAppointmentServiceImpl service;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    private Patient samplePatient;
    private User sampleDoctor;
    private Clinic sampleClinic;
    private CreateAppointmentRequest sampleRequest;

    @BeforeEach
    void setUp() {
        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));

        samplePatient = Patient.builder()
                .id(1L)
                .userId(1L)
                .fullName("Nguyen Van A")
                .clinicId(10L)
                .phone("0901234567")
                .gender("MALE")
                .build();

        sampleDoctor = User.builder()
                .id(5L)
                .fullName("BS. Tran Van B")
                .specialization("Noi khoa")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        sampleClinic = Clinic.builder()
                .id(10L)
                .name("Phòng khám ABC")
                .build();

        sampleRequest = CreateAppointmentRequest.builder()
                .doctorId(5L)
                .appointmentTime(LocalDateTime.of(2026, 7, 1, 9, 0))
                .appointmentType("IN_PERSON")
                .build();

        // Default: patient found
        lenient().when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    // =========================================================================
    // create() - 6 Independent Paths from CFG
    // =========================================================================

    /**
     * Path 1: Happy case — IN_PERSON, có clinic, có doctor
     * N1 → N2(yes) → N3 → N4(yes) → N5 → N7 → N8(yes) → N9a → N10(yes) → N11 → N12
     */
    @Test
    @DisplayName("Path 1: IN_PERSON, clinic exists with name, doctor exists → notify doctor")
    void create_path1_inPerson_clinicExists_doctorExists() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleDoctor));
        when(clinicRepository.findById(10L)).thenReturn(Optional.of(sampleClinic));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(100L);
            return a;
        });

        PatientAppointmentResponse response = service.create(sampleRequest);

        assertNotNull(response);
        assertEquals("BS. Tran Van B", response.getDoctorName());
        assertEquals("Phòng khám ABC", response.getLocation());
        assertNull(response.getMeetingLink());
        assertEquals("PENDING", response.getStatus());
        verify(notificationService).sendNotification(eq(5L), anyString(), anyString(), anyString(), anyString());
    }

    /**
     * Path 2: ONLINE, không có clinicId, có doctor
     * N1 → N2(no) → N7 → N8(no) → N9b(ONLINE) → N10(yes) → N11 → N12
     */
    @Test
    @DisplayName("Path 2: ONLINE, no clinicId, doctor exists → meetingLink set, notify doctor")
    void create_path2_online_noClinic_doctorExists() {
        samplePatient.setClinicId(null);
        sampleRequest.setAppointmentType("ONLINE");

        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(101L);
            return a;
        });

        PatientAppointmentResponse response = service.create(sampleRequest);

        assertNotNull(response);
        assertNull(response.getLocation());
        assertEquals("https://meet.google.com/abc-xyz", response.getMeetingLink());
        verify(notificationService).sendNotification(eq(5L), anyString(), anyString(), anyString(), anyString());
        verify(clinicRepository, never()).findById(anyLong());
    }

    /**
     * Path 3: Có clinicId nhưng clinic null hoặc name null
     * N1 → N2(yes) → N3 → N4(no) → N7 → N8(yes) → N9a → N10(yes) → N11 → N12
     */
    @Test
    @DisplayName("Path 3: IN_PERSON, clinicId exists but clinic not found → fallback location")
    void create_path3_clinicNotFound_fallbackLocation() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleDoctor));
        when(clinicRepository.findById(10L)).thenReturn(Optional.empty());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(102L);
            return a;
        });

        PatientAppointmentResponse response = service.create(sampleRequest);

        assertNotNull(response);
        // Fallback location because clinic not found → c is null → condition N4 false
        // location set by IN_PERSON ternary uses finalLocation which is still "Phòng khám Đa khoa"
        assertEquals("Phòng khám Đa khoa", response.getLocation());
        verify(notificationService).sendNotification(eq(5L), anyString(), anyString(), anyString(), anyString());
    }

    /**
     * Path 4: Exception khi tìm clinic
     * N1 → N2(yes) → N3 → N6(catch) → N7 → N8(yes) → N9a → N10(yes) → N11 → N12
     */
    @Test
    @DisplayName("Path 4: Clinic lookup throws exception → fallback location, still succeeds")
    void create_path4_clinicLookupException_fallbackLocation() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleDoctor));
        when(clinicRepository.findById(10L)).thenThrow(new RuntimeException("DB connection error"));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(103L);
            return a;
        });

        PatientAppointmentResponse response = service.create(sampleRequest);

        assertNotNull(response);
        assertEquals("Phòng khám Đa khoa", response.getLocation());
        verify(notificationService).sendNotification(eq(5L), anyString(), anyString(), anyString(), anyString());
    }

    /**
     * Path 5: Doctor null — không gửi notification
     * N1 → N2(no) → N7 → N8(yes) → N9a → N10(no) → N12
     */
    @Test
    @DisplayName("Path 5: Doctor not found → no notification, doctorName null")
    void create_path5_doctorNull_noNotification() {
        samplePatient.setClinicId(null);
        when(userRepository.findById(5L)).thenReturn(Optional.empty());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(104L);
            return a;
        });

        PatientAppointmentResponse response = service.create(sampleRequest);

        assertNotNull(response);
        assertNull(response.getDoctorName());
        assertNull(response.getDoctorSpecialty());
        verify(notificationService, never()).sendNotification(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    /**
     * Path 6: ONLINE, không có clinic, doctor null
     * N1 → N2(no) → N7 → N8(no) → N9b → N10(no) → N12
     */
    @Test
    @DisplayName("Path 6: ONLINE, no clinic, doctor null → meetingLink set, no notification")
    void create_path6_online_noClinic_doctorNull() {
        samplePatient.setClinicId(null);
        sampleRequest.setAppointmentType("ONLINE");
        when(userRepository.findById(5L)).thenReturn(Optional.empty());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(105L);
            return a;
        });

        PatientAppointmentResponse response = service.create(sampleRequest);

        assertNotNull(response);
        assertNull(response.getDoctorName());
        assertEquals("https://meet.google.com/abc-xyz", response.getMeetingLink());
        assertNull(response.getLocation());
        verify(notificationService, never()).sendNotification(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    // =========================================================================
    // cancel() - 5 Independent Paths from CFG
    // =========================================================================

    /**
     * Path 1: Happy case — PENDING, patient owns → cancel thành công
     * N1 → N2(found) → N3(owner) → N4(not COMPLETED) → N5(not SCHEDULED) → N6(cancel) → End
     */
    @Test
    @DisplayName("cancel Path 1: PENDING appointment, patient owns → cancel success")
    void cancel_path1_happyCase() {
        Appointment appointment = Appointment.builder()
                .id(1L)
                .patient(samplePatient)
                .doctorId(5L)
                .status(AppointmentStatus.PENDING)
                .build();

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));

        assertDoesNotThrow(() -> service.cancel(1L));
        verify(appointmentRepository).saveAndFlush(appointment);
        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
    }

    /**
     * Path 2: Appointment không tìm thấy → ResourceNotFoundException → catch → RuntimeException
     * N1 → N2(not found) → catch → throw RuntimeException
     */
    @Test
    @DisplayName("cancel Path 2: Appointment not found → RuntimeException")
    void cancel_path2_notFound() {
        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.cancel(999L));
        assertTrue(ex.getMessage().contains("Lỗi hệ thống khi hủy lịch hẹn"));
        verify(appointmentRepository, never()).saveAndFlush(any());
    }

    /**
     * Path 3: Patient không phải chủ appointment → RuntimeException
     * N1 → N2(found) → N3(not owner) → catch → throw RuntimeException
     */
    @Test
    @DisplayName("cancel Path 3: Patient not owner → RuntimeException")
    void cancel_path3_notOwner() {
        Patient otherPatient = Patient.builder().id(999L).userId(999L).fullName("Other").phone("000").gender("MALE").build();
        Appointment appointment = Appointment.builder()
                .id(1L)
                .patient(otherPatient)
                .doctorId(5L)
                .status(AppointmentStatus.PENDING)
                .build();

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.cancel(1L));
        assertTrue(ex.getMessage().contains("Lỗi hệ thống khi hủy lịch hẹn"));
        verify(appointmentRepository, never()).saveAndFlush(any());
    }

    /**
     * Path 4: Status COMPLETED → không cho hủy
     * N1 → N2(found) → N3(owner) → N4(COMPLETED) → catch → throw RuntimeException
     */
    @Test
    @DisplayName("cancel Path 4: Status COMPLETED → cannot cancel")
    void cancel_path4_completed() {
        Appointment appointment = Appointment.builder()
                .id(1L)
                .patient(samplePatient)
                .doctorId(5L)
                .status(AppointmentStatus.COMPLETED)
                .build();

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.cancel(1L));
        assertTrue(ex.getMessage().contains("Lỗi hệ thống khi hủy lịch hẹn"));
        verify(appointmentRepository, never()).saveAndFlush(any());
    }

    /**
     * Path 5: Status SCHEDULED → không cho tự hủy
     * N1 → N2(found) → N3(owner) → N4(not COMPLETED) → N5(SCHEDULED) → catch → throw RuntimeException
     */
    @Test
    @DisplayName("cancel Path 5: Status SCHEDULED → cannot self-cancel")
    void cancel_path5_scheduled() {
        Appointment appointment = Appointment.builder()
                .id(1L)
                .patient(samplePatient)
                .doctorId(5L)
                .status(AppointmentStatus.SCHEDULED)
                .build();

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.cancel(1L));
        assertTrue(ex.getMessage().contains("Lỗi hệ thống khi hủy lịch hẹn"));
        verify(appointmentRepository, never()).saveAndFlush(any());
    }

    // =========================================================================
    // toggleReminder() - 3 Independent Paths from CFG
    // =========================================================================

    /**
     * Path 1: Happy case — appointment tồn tại, patient owns → toggle thành công
     * N1 → N2(found) → N3(owner) → N4(save) → End
     */
    @Test
    @DisplayName("toggleReminder Path 1: Happy case → toggle success")
    void toggleReminder_path1_happyCase() {
        Appointment appointment = Appointment.builder()
                .id(1L)
                .patient(samplePatient)
                .doctorId(5L)
                .status(AppointmentStatus.PENDING)
                .reminderEnabled(false)
                .build();

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));

        service.toggleReminder(1L, true);

        assertTrue(appointment.isReminderEnabled());
        verify(appointmentRepository).saveAndFlush(appointment);
    }

    /**
     * Path 2: Appointment không tìm thấy → ResourceNotFoundException
     * N1 → N2(not found) → throw
     */
    @Test
    @DisplayName("toggleReminder Path 2: Not found → ResourceNotFoundException")
    void toggleReminder_path2_notFound() {
        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.project.exception.ResourceNotFoundException.class,
                () -> service.toggleReminder(999L, true));
        verify(appointmentRepository, never()).saveAndFlush(any());
    }

    /**
     * Path 3: Patient không phải chủ → RuntimeException
     * N1 → N2(found) → N3(not owner) → throw
     */
    @Test
    @DisplayName("toggleReminder Path 3: Not owner → RuntimeException")
    void toggleReminder_path3_notOwner() {
        Patient otherPatient = Patient.builder().id(999L).userId(999L).fullName("Other").phone("000").gender("MALE").build();
        Appointment appointment = Appointment.builder()
                .id(1L)
                .patient(otherPatient)
                .doctorId(5L)
                .status(AppointmentStatus.PENDING)
                .build();

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));

        assertThrows(RuntimeException.class, () -> service.toggleReminder(1L, true));
        verify(appointmentRepository, never()).saveAndFlush(any());
    }
}