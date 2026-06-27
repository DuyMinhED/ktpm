package com.project.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.project.dto.response.DoctorAppointmentResponse;
import com.project.entity.Appointment;
import com.project.entity.AppointmentStatus;
import com.project.entity.Patient;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.AppointmentRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.service.NotificationService;
import com.project.util.SecurityUtils;

@ExtendWith(MockitoExtension.class)
public class DoctorAppointmentServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DoctorAppointmentServiceImpl service;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    private Patient samplePatient;
    private Appointment sampleAppointment;

    @BeforeEach
    void setUp() {
        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(5L));

        samplePatient = Patient.builder()
                .id(1L)
                .userId(1L)
                .fullName("Nguyen Van A")
                .phone("0901234567")
                .gender("MALE")
                .build();

        sampleAppointment = Appointment.builder()
                .id(100L)
                .doctorId(5L)
                .patient(samplePatient)
                .appointmentTime(LocalDateTime.of(2026, 7, 1, 9, 0))
                .status(AppointmentStatus.PENDING)
                .type("ONLINE")
                .build();
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    // =========================================================================
    // updateStatus() - 8 Independent Paths from CFG
    // =========================================================================

    /**
     * Path 1: SCHEDULED + ONLINE + meetingLink provided + diagnosis provided
     */
    @Test
    @DisplayName("updateStatus Path 1: SCHEDULED ONLINE + link + diagnosis → set all")
    void updateStatus_path1_scheduledOnline_withLink_withDiagnosis() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        DoctorAppointmentResponse response = service.updateStatus(100L, "SCHEDULED", "https://meet.google.com/custom", "Cảm cúm");

        assertEquals("SCHEDULED", response.getStatus());
        assertEquals("https://meet.google.com/custom", sampleAppointment.getMeetingLink());
        assertEquals("Cảm cúm", sampleAppointment.getDiagnosisSummary());
        verify(notificationService).sendNotification(eq(1L), anyString(), eq("Lịch hẹn của bạn đã được xác nhận."), eq("success"), anyString());
    }

    /**
     * Path 2: SCHEDULED + ONLINE + no meetingLink + no existing link → fallback
     */
    @Test
    @DisplayName("updateStatus Path 2: SCHEDULED ONLINE + no link + no existing → fallback link")
    void updateStatus_path2_scheduledOnline_noLink_noExisting() {
        sampleAppointment.setMeetingLink(null);
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        service.updateStatus(100L, "SCHEDULED", null, null);

        assertEquals("https://meet.google.com/abc-xyz", sampleAppointment.getMeetingLink());
    }

    /**
     * Path 3: SCHEDULED + ONLINE + no meetingLink + has existing → keep existing
     */
    @Test
    @DisplayName("updateStatus Path 3: SCHEDULED ONLINE + no link + existing link → keep existing")
    void updateStatus_path3_scheduledOnline_noLink_hasExisting() {
        sampleAppointment.setMeetingLink("https://meet.google.com/old-link");
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        service.updateStatus(100L, "SCHEDULED", null, null);

        assertEquals("https://meet.google.com/old-link", sampleAppointment.getMeetingLink());
    }

    /**
     * Path 4: CANCELLED → notification message "đã bị hủy"
     */
    @Test
    @DisplayName("updateStatus Path 4: CANCELLED → cancel notification")
    void updateStatus_path4_cancelled() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        service.updateStatus(100L, "CANCELLED", null, null);

        assertEquals(AppointmentStatus.CANCELLED, sampleAppointment.getStatus());
        verify(notificationService).sendNotification(eq(1L), anyString(), eq("Lịch hẹn của bạn đã bị hủy."), eq("warning"), anyString());
    }

    /**
     * Path 5: COMPLETED + diagnosis → set diagnosis + notification "hoàn tất"
     */
    @Test
    @DisplayName("updateStatus Path 5: COMPLETED + diagnosis → complete notification")
    void updateStatus_path5_completed_withDiagnosis() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        service.updateStatus(100L, "COMPLETED", null, "Viêm họng cấp");

        assertEquals(AppointmentStatus.COMPLETED, sampleAppointment.getStatus());
        assertEquals("Viêm họng cấp", sampleAppointment.getDiagnosisSummary());
        verify(notificationService).sendNotification(eq(1L), anyString(), eq("Buổi khám bệnh của bạn đã hoàn tất."), eq("info"), anyString());
    }

    /**
     * Path 6: Appointment not found → ResourceNotFoundException
     */
    @Test
    @DisplayName("updateStatus Path 6: Not found → ResourceNotFoundException")
    void updateStatus_path6_notFound() {
        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.updateStatus(999L, "SCHEDULED", null, null));
        verify(appointmentRepository, never()).save(any());
    }

    /**
     * Path 7: Doctor not owner → RuntimeException
     */
    @Test
    @DisplayName("updateStatus Path 7: Not owner → RuntimeException")
    void updateStatus_path7_notOwner() {
        sampleAppointment.setDoctorId(999L); // different doctor
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));

        assertThrows(RuntimeException.class, () -> service.updateStatus(100L, "SCHEDULED", null, null));
        verify(appointmentRepository, never()).save(any());
    }

    /**
     * Path 8: SCHEDULED + IN_PERSON → skip meetingLink logic
     */
    @Test
    @DisplayName("updateStatus Path 8: SCHEDULED IN_PERSON → no meetingLink change")
    void updateStatus_path8_scheduledInPerson() {
        sampleAppointment.setType("IN_PERSON");
        sampleAppointment.setMeetingLink(null);
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        service.updateStatus(100L, "SCHEDULED", "https://some-link.com", null);

        assertNull(sampleAppointment.getMeetingLink()); // link not set because IN_PERSON
        assertEquals(AppointmentStatus.SCHEDULED, sampleAppointment.getStatus());
    }

    // =========================================================================
    // createAppointment() - 5 Independent Paths from CFG
    // =========================================================================

    /**
     * Path 1: Happy case — ONLINE + meetingLink provided + doctor exists
     */
    @Test
    @DisplayName("createAppointment Path 1: ONLINE + link + doctor → success")
    void createAppointment_path1_online_withLink_doctorExists() {
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .patientId(1L)
                        .appointmentDate("2026-07-10")
                        .appointmentTime("09:00")
                        .type("ONLINE")
                        .meetingLink("https://meet.google.com/custom")
                        .notes("Tái khám")
                        .build();

        com.project.entity.User doctor = com.project.entity.User.builder().id(5L).fullName("BS. Tran").specialization("Noi khoa").avatarUrl("avatar.jpg").build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(200L);
            return a;
        });

        DoctorAppointmentResponse response = service.createAppointment(request);

        assertNotNull(response);
        assertEquals("https://meet.google.com/custom", response.getMeetingLink());
        assertEquals("SCHEDULED", response.getStatus());
        verify(notificationService).sendNotification(eq(1L), anyString(), anyString(), anyString(), anyString());
    }

    /**
     * Path 2: ONLINE + no meetingLink → fallback link
     */
    @Test
    @DisplayName("createAppointment Path 2: ONLINE + no link → fallback link")
    void createAppointment_path2_online_noLink() {
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .patientId(1L)
                        .appointmentDate("2026-07-10")
                        .appointmentTime("09:00")
                        .type("ONLINE")
                        .meetingLink(null)
                        .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(userRepository.findById(5L)).thenReturn(Optional.empty());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(201L);
            return a;
        });

        DoctorAppointmentResponse response = service.createAppointment(request);

        assertEquals("https://meet.google.com/abc-xyz", response.getMeetingLink());
    }

    /**
     * Path 3: IN_PERSON + doctor exists → location set, no meetingLink
     */
    @Test
    @DisplayName("createAppointment Path 3: IN_PERSON + doctor → location set")
    void createAppointment_path3_inPerson_doctorExists() {
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .patientId(1L)
                        .appointmentDate("2026-07-10")
                        .appointmentTime("09:00")
                        .type("IN_PERSON")
                        .build();

        com.project.entity.User doctor = com.project.entity.User.builder().id(5L).fullName("BS. Tran").specialization("Noi khoa").build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(202L);
            return a;
        });

        DoctorAppointmentResponse response = service.createAppointment(request);

        assertNull(response.getMeetingLink());
        assertEquals("BS. Tran", response.getDoctorName());
    }

    /**
     * Path 4: Doctor null → doctorName null, still creates
     */
    @Test
    @DisplayName("createAppointment Path 4: Doctor not found → null doctor info")
    void createAppointment_path4_doctorNull() {
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .patientId(1L)
                        .appointmentDate("2026-07-10")
                        .appointmentTime("09:00")
                        .type("IN_PERSON")
                        .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(userRepository.findById(5L)).thenReturn(Optional.empty());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(203L);
            return a;
        });

        DoctorAppointmentResponse response = service.createAppointment(request);

        assertNull(response.getDoctorName());
        assertNull(response.getDoctorSpecialty());
    }

    /**
     * Path 5: Patient not found → ResourceNotFoundException
     */
    @Test
    @DisplayName("createAppointment Path 5: Patient not found → exception")
    void createAppointment_path5_patientNotFound() {
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .patientId(999L)
                        .appointmentDate("2026-07-10")
                        .appointmentTime("09:00")
                        .type("IN_PERSON")
                        .build();

        when(patientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.createAppointment(request));
        verify(appointmentRepository, never()).save(any());
    }

    // =========================================================================
    // rescheduleAppointment() - 6 Independent Paths from CFG
    // =========================================================================

    /**
     * Path 1: ONLINE + meetingLink provided + doctor exists
     */
    @Test
    @DisplayName("reschedule Path 1: ONLINE + custom link + doctor → success")
    void reschedule_path1_online_withLink_doctorExists() {
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .appointmentDate("2026-08-01")
                        .appointmentTime("14:00")
                        .type("ONLINE")
                        .meetingLink("https://meet.google.com/new-link")
                        .notes("Dời lịch")
                        .build();

        com.project.entity.User doctor = com.project.entity.User.builder()
                .id(5L).fullName("BS. Tran").specialization("Noi khoa").avatarUrl("avatar.jpg").build();

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        DoctorAppointmentResponse response = service.rescheduleAppointment(100L, request);

        assertNotNull(response);
        assertEquals("https://meet.google.com/new-link", sampleAppointment.getMeetingLink());
        assertNull(sampleAppointment.getLocation());
        assertEquals("BS. Tran", sampleAppointment.getDoctorName());
        assertEquals(AppointmentStatus.SCHEDULED, sampleAppointment.getStatus());
    }

    /**
     * Path 2: ONLINE + no link + no existing → fallback link
     */
    @Test
    @DisplayName("reschedule Path 2: ONLINE + no link + no existing → fallback")
    void reschedule_path2_online_noLink_noExisting() {
        sampleAppointment.setMeetingLink(null);
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .appointmentDate("2026-08-01")
                        .appointmentTime("14:00")
                        .type("ONLINE")
                        .meetingLink(null)
                        .build();

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(userRepository.findById(5L)).thenReturn(Optional.empty());
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        service.rescheduleAppointment(100L, request);

        assertEquals("https://meet.google.com/abc-xyz", sampleAppointment.getMeetingLink());
    }

    /**
     * Path 3: ONLINE + no link + has existing → keep existing
     */
    @Test
    @DisplayName("reschedule Path 3: ONLINE + no link + existing → keep old link")
    void reschedule_path3_online_noLink_hasExisting() {
        sampleAppointment.setMeetingLink("https://meet.google.com/old");
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .appointmentDate("2026-08-01")
                        .appointmentTime("14:00")
                        .type("ONLINE")
                        .meetingLink(null)
                        .build();

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(userRepository.findById(5L)).thenReturn(Optional.empty());
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        service.rescheduleAppointment(100L, request);

        assertEquals("https://meet.google.com/old", sampleAppointment.getMeetingLink());
    }

    /**
     * Path 4: IN_PERSON + doctor exists → set location, clear meetingLink
     */
    @Test
    @DisplayName("reschedule Path 4: IN_PERSON + doctor → location set, link cleared")
    void reschedule_path4_inPerson_doctorExists() {
        sampleAppointment.setMeetingLink("https://old-link.com");
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .appointmentDate("2026-08-01")
                        .appointmentTime("14:00")
                        .type("IN_PERSON")
                        .build();

        com.project.entity.User doctor = com.project.entity.User.builder()
                .id(5L).fullName("BS. Tran").specialization("Noi khoa").build();

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        service.rescheduleAppointment(100L, request);

        assertEquals("Phòng khám", sampleAppointment.getLocation());
        assertNull(sampleAppointment.getMeetingLink());
        assertEquals("BS. Tran", sampleAppointment.getDoctorName());
    }

    /**
     * Path 5: IN_PERSON + doctor null → no doctor info update
     */
    @Test
    @DisplayName("reschedule Path 5: IN_PERSON + doctor null → no doctor update")
    void reschedule_path5_inPerson_doctorNull() {
        sampleAppointment.setDoctorName("Old Name");
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .appointmentDate("2026-08-01")
                        .appointmentTime("14:00")
                        .type("IN_PERSON")
                        .build();

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(sampleAppointment));
        when(userRepository.findById(5L)).thenReturn(Optional.empty());
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(sampleAppointment);

        service.rescheduleAppointment(100L, request);

        assertEquals("Old Name", sampleAppointment.getDoctorName()); // unchanged
        assertEquals("Phòng khám", sampleAppointment.getLocation());
    }

    /**
     * Path 6: Appointment not found → ResourceNotFoundException
     */
    @Test
    @DisplayName("reschedule Path 6: Not found → exception")
    void reschedule_path6_notFound() {
        com.project.dto.request.DoctorCreateAppointmentRequest request =
                com.project.dto.request.DoctorCreateAppointmentRequest.builder()
                        .appointmentDate("2026-08-01")
                        .appointmentTime("14:00")
                        .type("IN_PERSON")
                        .build();

        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.rescheduleAppointment(999L, request));
        verify(appointmentRepository, never()).save(any());
    }
}