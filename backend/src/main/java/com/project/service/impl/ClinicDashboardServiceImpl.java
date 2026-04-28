package com.project.service.impl;

import com.project.dto.response.ClinicDashboardResponse;
import com.project.dto.response.ClinicAppointmentResponse;
import com.project.dto.response.ClinicResponse;
import com.project.entity.Appointment;
import com.project.entity.User;
import com.project.repository.*;
import com.project.service.ClinicDashboardService;
import com.project.service.ClinicalAnalyticsService;
import com.project.entity.AppointmentStatus;
import com.project.security.Audit;
import com.project.util.AppConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class ClinicDashboardServiceImpl implements ClinicDashboardService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClinicalAnalyticsService clinicalAnalyticsService;
    private final NotificationRepository notificationRepository;
    private final ClinicRepository clinicRepository;

    @Override
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "clinic_dashboard", key = "#clinicId + '_' + #period")
    public ClinicDashboardResponse getDashboardData(Long clinicId, String period) {
        // Parallel data fetching
        var totalPatientsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> patientRepository.countByClinicIdAndIsDeletedFalse(clinicId));
        var highRiskCountFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(clinicId, AppConstants.RISK_HIGH));
        var monitoringCountFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(clinicId, AppConstants.RISK_MONITORING));
        var pathologyFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> patientRepository.countPatientsByChronicCondition(clinicId));
        var insightsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> clinicalAnalyticsService.getClinicInsights(clinicId));

        // Period logic
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = "7d".equals(period) ? now.minusDays(6) : "30d".equals(period) ? now.minusDays(29) : "1y".equals(period) ? now.minusMonths(11) : now.minusMonths(5);

        var patientStatsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> patientRepository.countMonthlyPatients(clinicId, startDate));
        var riskStatsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> patientRepository.countMonthlyHighRiskPatients(clinicId, AppConstants.RISK_HIGH, startDate));

        java.util.concurrent.CompletableFuture.allOf(totalPatientsFuture, highRiskCountFuture, monitoringCountFuture, pathologyFuture, insightsFuture, patientStatsFuture, riskStatsFuture).join();

        // Mapping and calculation logic (kept here as it's dashboard specific)
        long totalPatients = totalPatientsFuture.join();
        long highRiskCount = highRiskCountFuture.join();
        long monitoringCount = monitoringCountFuture.join();
        
        List<ClinicDashboardResponse.DiseaseRatioDto> diseaseRatios = calculateDiseaseRatios(clinicId, totalPatients);

        return ClinicDashboardResponse.builder()
                .totalPatients(totalPatients)
                .highRiskAlerts(highRiskCount)
                .pendingFollowUps(monitoringCount)
                .diseaseRatios(diseaseRatios)
                .insights(insightsFuture.join())
                .build();
    }

    @Override
    public List<String> getChronicConditions() {
        return List.of("Tiểu đường Type 2", "Cao huyết áp", "Tim mạch", "Hen suyễn", "Bệnh thận mãn tính");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClinicAppointmentResponse> getAppointmentRecords(Long clinicId, Pageable pageable) {
        return appointmentRepository.findByClinicId(clinicId, pageable).map(this::mapToAppointmentResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ClinicResponse getClinicDetails(Long clinicId) {
        return clinicRepository.findById(clinicId)
                .map(c -> (ClinicResponse) ClinicResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .address(c.getAddress())
                        .phone(c.getPhone())
                        .email(c.getEmail())
                        .description(c.getDescription())
                        .logoUrl(c.getImageUrl())
                        .build())
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
    }

    @Override
    @Transactional
    @Audit(action = "UPDATE_CLINIC_PROFILE", module = "CLINIC_MANAGEMENT")
    public void updateClinicDetails(Long clinicId, com.project.dto.request.UpdateClinicRequest request) {
        var clinic = clinicRepository.findById(clinicId).orElseThrow();
        clinic.setName(request.getName());
        clinic.setAddress(request.getAddress());
        clinic.setPhone(request.getPhone());
        clinic.setEmail(request.getEmail());
        clinic.setDescription(request.getDescription());
        clinic.setImageUrl(request.getImageUrl());
        clinicRepository.save(clinic);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "clinic_dashboard", allEntries = true)
    @Audit(action = "UPDATE_APPOINTMENT_STATUS", module = "CLINIC_MANAGEMENT")
    public void updateAppointmentStatus(Long clinicId, Long appointmentId, String status) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElseThrow();
        User doctor = userRepository.findById(appointment.getDoctorId()).orElseThrow();
        if (!doctor.getClinicId().equals(clinicId)) throw new AccessDeniedException("Unauthorized");

        AppointmentStatus enumStatus = AppointmentStatus.valueOf(status.toUpperCase());
        appointment.setStatus(enumStatus);
        appointmentRepository.save(appointment);
        sendAppointmentNotification(appointment, status);
    }

    private List<ClinicDashboardResponse.DiseaseRatioDto> calculateDiseaseRatios(Long clinicId, long totalPatients) {
        List<Object[]> riskDist = patientRepository.countRiskDistributionByCondition(clinicId);
        Map<String, Map<String, Long>> mappedDist = new HashMap<>();
        for (Object[] row : riskDist) {
            String condition = (String) row[0];
            String risk = (String) row[1];
            long count = (Long) row[2];
            mappedDist.computeIfAbsent(condition != null ? condition : "Khác", k -> new HashMap<>()).put(risk, count);
        }

        return mappedDist.entrySet().stream().map(entry -> {
            String condition = entry.getKey();
            Map<String, Long> risks = entry.getValue();
            long total = risks.values().stream().mapToLong(Long::longValue).sum();
            return ClinicDashboardResponse.DiseaseRatioDto.builder()
                    .label(condition)
                    .percentage(totalPatients > 0 ? (total * 100 / totalPatients) + "%" : "0%")
                    .value(total)
                    .build();
        }).collect(Collectors.toList());
    }

    private ClinicAppointmentResponse mapToAppointmentResponse(Appointment a) {
        return ClinicAppointmentResponse.builder()
                .id(a.getId())
                .patientName(a.getPatient().getFullName())
                .doctorName(a.getDoctorName())
                .appointmentTime(a.getAppointmentTime())
                .status(a.getStatus().name())
                .appointmentType(a.getType())
                .build();
    }

    private void sendAppointmentNotification(Appointment appointment, String status) {
        notificationRepository.save(com.project.entity.Notification.builder()
                .userId(appointment.getPatient().getUserId())
                .title("Cập nhật lịch hẹn")
                .message("Lịch hẹn với BS. " + appointment.getDoctorName() + " chuyển sang: " + status)
                .type("APPOINTMENT")
                .read(false)
                .build());
    }
}
