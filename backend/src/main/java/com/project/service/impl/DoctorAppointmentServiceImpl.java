package com.project.service.impl;

import com.project.dto.response.DoctorAppointmentResponse;
import com.project.entity.Appointment;
import com.project.entity.AppointmentStatus;
import com.project.entity.Patient;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.AppointmentRepository;
import com.project.service.DoctorAppointmentService;
import com.project.service.NotificationService;
import com.project.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorAppointmentServiceImpl implements DoctorAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final com.project.repository.PatientRepository patientRepository;
    private final com.project.repository.UserRepository userRepository;

    @Override
    public List<DoctorAppointmentResponse> getUpcomingAppointments() {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        return appointmentRepository.findByDoctorIdAndStatusInAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
                        doctorId, java.util.List.of(AppointmentStatus.PENDING, AppointmentStatus.SCHEDULED), LocalDateTime.now().minusDays(1))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DoctorAppointmentResponse> getAllAppointments() {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        return appointmentRepository.findByDoctorIdOrderByAppointmentTimeDesc(doctorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    public DoctorAppointmentResponse updateStatus(Long appointmentId, String status, String meetingLink, String diagnosisSummary) {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn không tồn tại!"));

        if (!appointment.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Unauthorized to modify this appointment");
        }

        if (diagnosisSummary != null && !diagnosisSummary.trim().isEmpty()) {
            appointment.setDiagnosisSummary(diagnosisSummary);
        }

        appointment.setStatus(AppointmentStatus.valueOf(status.toUpperCase()));
        
        if (status.equalsIgnoreCase("SCHEDULED") && "ONLINE".equalsIgnoreCase(appointment.getType().toString())) {
            if (meetingLink != null && !meetingLink.trim().isEmpty()) {
                appointment.setMeetingLink(meetingLink);
            } else if (appointment.getMeetingLink() == null || appointment.getMeetingLink().isEmpty()) {
                appointment.setMeetingLink("https://meet.google.com/abc-xyz"); // Fallback default
            }
        }
        Appointment saved = appointmentRepository.save(appointment);

        // Notify Patient
        String title = "Cập nhật lịch hẹn";
        String message = "Lịch hẹn có cập nhật mới.";
        if ("SCHEDULED".equals(status)) {
            message = "Lịch hẹn của bạn đã được xác nhận.";
        } else if ("CANCELLED".equals(status)) {
            message = "Lịch hẹn của bạn đã bị hủy.";
        } else if ("COMPLETED".equals(status)) {
            message = "Buổi khám bệnh của bạn đã hoàn tất.";
        }
        
        notificationService.sendNotification(
            saved.getPatient().getUserId(),
            title,
            message,
            status.equals("SCHEDULED") ? "success" : status.equals("CANCELLED") ? "warning" : "info",
            "/patient/appointments"
        );

        return mapToResponse(saved);
    }

    private DoctorAppointmentResponse mapToResponse(Appointment a) {
        Patient p = a.getPatient();
        return DoctorAppointmentResponse.builder()
                .id(a.getId())
                .patientId(p.getId())
                .patientName(p.getFullName())
                .patientAvatarUrl(p.getAvatarUrl())
                .appointmentTime(a.getAppointmentTime())
                .endTime(a.getEndTime())
                .appointmentType(a.getType())
                .status(a.getStatus().name())
                .location(a.getLocation())
                .meetingLink(a.getMeetingLink())
                .reason(a.getReason())
                .diagnosisSummary(a.getDiagnosisSummary())
                .doctorName(a.getDoctorName())
                .doctorSpecialty(a.getDoctorSpecialty())
                .doctorAvatarUrl(a.getDoctorAvatarUrl())
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    public DoctorAppointmentResponse createAppointment(com.project.dto.request.DoctorCreateAppointmentRequest request) {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Bệnh nhân không tồn tại"));

        // Format: yyyy-MM-dd HH:mm
        LocalDateTime appointmentTime = LocalDateTime.parse(request.getAppointmentDate() + "T" + request.getAppointmentTime());

        com.project.entity.User doctor = userRepository.findById(doctorId).orElse(null);
        
        Appointment appointment = Appointment.builder()
                .doctorId(doctorId)
                .patient(patient)
                .appointmentTime(appointmentTime)
                .status(AppointmentStatus.SCHEDULED)
                .type(request.getType())
                .reason(request.getNotes())
                .doctorName(doctor != null ? doctor.getFullName() : null)
                .doctorSpecialty(doctor != null ? doctor.getSpecialization() : null)
                .doctorAvatarUrl(doctor != null ? doctor.getAvatarUrl() : null)
                .location("ONLINE".equals(request.getType()) ? "Trực tuyến" : "Phòng khám")
                .meetingLink("ONLINE".equals(request.getType()) 
                    ? (request.getMeetingLink() != null && !request.getMeetingLink().isEmpty() ? request.getMeetingLink() : "https://meet.google.com/abc-xyz") 
                    : null)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient
        notificationService.sendNotification(
            patient.getUserId(),
            "Lịch hẹn mới",
            "Lịch hẹn mới: " + request.getAppointmentTime() + ", " + request.getAppointmentDate(),
            "info",
            "/patient/appointments"
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    public DoctorAppointmentResponse rescheduleAppointment(Long appointmentId, com.project.dto.request.DoctorCreateAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn không tồn tại"));

        LocalDateTime appointmentTime = LocalDateTime.parse(request.getAppointmentDate() + "T" + request.getAppointmentTime());
        
        appointment.setAppointmentTime(appointmentTime);
        appointment.setType(request.getType());
        appointment.setReason(request.getNotes());
        
        // Update location/meetingLink based on new type
        if ("ONLINE".equals(request.getType())) {
            appointment.setLocation(null);
            if (request.getMeetingLink() != null && !request.getMeetingLink().isEmpty()) {
                appointment.setMeetingLink(request.getMeetingLink());
            } else if (appointment.getMeetingLink() == null || appointment.getMeetingLink().isEmpty()) {
                appointment.setMeetingLink("https://meet.google.com/abc-xyz");
            }
        } else {
            appointment.setLocation("Phòng khám");
            appointment.setMeetingLink(null);
        }
        
        // Patch doctor info just in case it was missing
        com.project.entity.User doctor = userRepository.findById(appointment.getDoctorId()).orElse(null);
        if (doctor != null) {
            appointment.setDoctorName(doctor.getFullName());
            appointment.setDoctorSpecialty(doctor.getSpecialization());
            appointment.setDoctorAvatarUrl(doctor.getAvatarUrl());
        }
        
        // Keep status as SCHEDULED (confirmed) when doctor reschedules
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        Appointment updated = appointmentRepository.save(appointment);

        // Notify patient
        notificationService.sendNotification(
            updated.getPatient().getUserId(),
            "Thay đổi lịch hẹn",
            "Lịch hẹn dời sang: " + request.getAppointmentTime() + ", " + request.getAppointmentDate(),
            "warning",
            "/patient/appointments"
        );

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    public int batchReschedule(java.time.LocalDate sourceDate, java.time.LocalDate targetDate) {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();

        LocalDateTime dayStart = sourceDate.atStartOfDay();
        LocalDateTime dayEnd = sourceDate.plusDays(1).atStartOfDay();

        List<Appointment> appointments = appointmentRepository.findByDoctorIdAndDateRangeAndStatuses(
                doctorId, dayStart, dayEnd,
                List.of(AppointmentStatus.PENDING, AppointmentStatus.SCHEDULED));

        if (appointments.isEmpty()) {
            return 0;
        }

        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(sourceDate, targetDate);

        for (Appointment a : appointments) {
            LocalDateTime newTime = a.getAppointmentTime().plusDays(daysDiff);
            a.setAppointmentTime(newTime);
            if (a.getEndTime() != null) {
                a.setEndTime(a.getEndTime().plusDays(daysDiff));
            }
            appointmentRepository.save(a);

            // Notify each patient
            try {
                notificationService.sendNotification(
                    a.getPatient().getUserId(),
                    "Thay đổi lịch hẹn",
                    "Bác sĩ đã dời lịch hẹn của bạn sang ngày " + targetDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    "warning",
                    "/patient/appointments"
                );
            } catch (Exception e) {
                log.warn("Failed to notify patient {} about batch reschedule", a.getPatient().getId(), e);
            }
        }

        log.info("Batch rescheduled {} appointments from {} to {} for doctor {}", appointments.size(), sourceDate, targetDate, doctorId);
        return appointments.size();
    }
}
