package com.project.service.impl;

import com.project.dto.request.CreateAppointmentRequest;
import com.project.dto.response.PatientAppointmentResponse;
import com.project.entity.Appointment;
import com.project.entity.AppointmentStatus;
import com.project.entity.Patient;
import com.project.entity.UserRole;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.AppointmentRepository;
import com.project.repository.PatientRepository;
import com.project.service.NotificationService;
import org.springframework.cache.annotation.CacheEvict;
import com.project.service.PatientAppointmentService;
import com.project.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import com.project.dto.response.DoctorSimpleResponse;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class PatientAppointmentServiceImpl implements PatientAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final com.project.repository.UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    public PatientAppointmentResponse create(CreateAppointmentRequest request) {
        Patient patient = getCurrentPatient();

        com.project.entity.User doctor = userRepository.findById(request.getDoctorId()).orElse(null);

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctorId(request.getDoctorId())
                .appointmentTime(request.getAppointmentTime())
                .status(AppointmentStatus.PENDING)
                .type(request.getAppointmentType())
                .doctorName(doctor != null ? doctor.getFullName() : null)
                .doctorSpecialty(doctor != null ? doctor.getSpecialization() : null)
                .doctorAvatarUrl(doctor != null ? doctor.getAvatarUrl() : null)
                .location(request.getAppointmentType().equals("IN_PERSON") ? "Phòng khám Đa khoa Hoàn Mỹ" : null)
                .meetingLink(request.getAppointmentType().equals("ONLINE") ? "https://meet.google.com/abc-xyz" : null)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        
        // Notify Doctor
        if (doctor != null) {
            notificationService.sendNotification(
                doctor.getId(),
                "Yêu cầu lịch hẹn mới",
                "Bệnh nhân " + patient.getFullName() + " đã gửi yêu cầu đặt lịch hẹn vào " + saved.getAppointmentTime().toString(),
                "info",
                "/doctor/appointments"
            );
        }

        log.info("Appointment created for patient: patientId={}, doctorId={}",
                patient.getId(), request.getDoctorId());
        return mapToResponse(saved);
    }

    @Override
    public List<PatientAppointmentResponse> getUpcoming() {
        Patient patient = getCurrentPatient();
        return appointmentRepository.findByPatientIdAndStatusInAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
                        patient.getId(), List.of(AppointmentStatus.PENDING, AppointmentStatus.SCHEDULED), LocalDateTime.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<PatientAppointmentResponse> getHistory(Pageable pageable) {
        Patient patient = getCurrentPatient();
        return appointmentRepository.findByPatientIdAndStatusOrderByAppointmentTimeDesc(
                patient.getId(), AppointmentStatus.COMPLETED, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    public void cancel(Long id) {
        Appointment appointment = appointmentRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn không tồn tại với ID: " + id));
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
        log.info("Appointment cancelled: id={}", id);
    }
    
    @Override
    public List<DoctorSimpleResponse> getAvailableDoctors() {
        return userRepository.findByRole(UserRole.DOCTOR).stream()
            .filter(u -> "ACTIVE".equals(u.getStatus()))
            .map(u -> DoctorSimpleResponse.builder()
                .id(u.getId())
                .name(u.getFullName())
                .specialty(u.getSpecialization() != null ? u.getSpecialization() : "Bác sĩ đa khoa")
                .avatarUrl(u.getAvatarUrl())
                .build())
            .collect(Collectors.toList());
    }

    // === Private Helpers ===

    private Patient getCurrentPatient() {
        Long userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new ResourceNotFoundException("User not authenticated"));
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    private PatientAppointmentResponse mapToResponse(Appointment a) {
        return PatientAppointmentResponse.builder()
                .id(a.getId())
                .doctorName(a.getDoctorName())
                .doctorSpecialty(a.getDoctorSpecialty())
                .doctorAvatarUrl(a.getDoctorAvatarUrl())
                .appointmentTime(a.getAppointmentTime())
                .endTime(a.getEndTime())
                .appointmentType(a.getType())
                .location(a.getLocation())
                .meetingLink(a.getMeetingLink())
                .status(a.getStatus().name())
                .diagnosisSummary(a.getDiagnosisSummary())
                .build();
    }
}
