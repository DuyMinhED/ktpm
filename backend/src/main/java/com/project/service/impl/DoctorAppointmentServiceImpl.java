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
    public DoctorAppointmentResponse updateStatus(Long appointmentId, String status) {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn không tồn tại!"));

        if (!appointment.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Unauthorized to modify this appointment");
        }

        appointment.setStatus(AppointmentStatus.valueOf(status.toUpperCase()));
        Appointment saved = appointmentRepository.save(appointment);

        // Notify Patient
        String title = "Cập nhật lịch hẹn";
        String message = "Lịch hẹn của bạn đã được chuyển sang trạng thái: " + (status.equals("SCHEDULED") ? "Đã xác nhận" : status.equals("CANCELLED") ? "Đã hủy" : status);
        
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

        Appointment appointment = Appointment.builder()
                .doctorId(doctorId)
                .patient(patient)
                .appointmentTime(appointmentTime)
                .status(AppointmentStatus.SCHEDULED)
                .type(request.getType())
                .reason(request.getNotes())
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient
        notificationService.sendNotification(
            patient.getUserId(),
            "Lịch hẹn mới",
            "Bác sĩ đã đặt lịch hẹn mới cho bạn vào lúc " + request.getAppointmentTime() + " ngày " + request.getAppointmentDate(),
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
            appointment.setMeetingLink("https://meet.google.com/abc-xyz");
        } else {
            appointment.setLocation("Phòng khám Đa khoa Hoàn Mỹ");
            appointment.setMeetingLink(null);
        }
        
        // Keep status as SCHEDULED (confirmed) when doctor reschedules
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        Appointment updated = appointmentRepository.save(appointment);

        // Notify patient
        notificationService.sendNotification(
            updated.getPatient().getUserId(),
            "Thay đổi lịch hẹn",
            "Bác sĩ đã dời lịch hẹn của bạn sang lúc " + request.getAppointmentTime() + " ngày " + request.getAppointmentDate(),
            "warning",
            "/patient/appointments"
        );

        return mapToResponse(updated);
    }
}
