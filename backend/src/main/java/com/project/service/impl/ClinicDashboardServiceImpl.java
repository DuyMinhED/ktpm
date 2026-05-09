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
import com.project.entity.UserRole;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.project.entity.Patient;
import org.springframework.data.domain.PageRequest;

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

        var patientStatsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
            List<Long> doctorIds = userRepository.findByClinicIdAndRoleAndIsDeletedFalse(clinicId, UserRole.DOCTOR).stream().map(User::getId).collect(Collectors.toList());
            return doctorIds.isEmpty() ? List.<Object[]>of() : appointmentRepository.countMonthlyAppointmentsByDoctorIds(doctorIds, startDate);
        });
        var riskStatsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> patientRepository.countMonthlyHighRiskPatients(clinicId, AppConstants.RISK_HIGH, startDate));
        var riskPatientsListFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
            patientRepository.findByClinicIdAndFilters(clinicId, null, null, AppConstants.RISK_HIGH, null, null, PageRequest.of(0, 5)).getContent());

        java.util.concurrent.CompletableFuture.allOf(totalPatientsFuture, highRiskCountFuture, monitoringCountFuture, pathologyFuture, insightsFuture, patientStatsFuture, riskStatsFuture, riskPatientsListFuture).join();

        // Mapping and calculation logic
        long totalPatients = totalPatientsFuture.join();
        long highRiskCount = highRiskCountFuture.join();
        long monitoringCount = monitoringCountFuture.join();

        // Calculate basic trends (simplified)
        String patientGrowth = "+0%";
        String riskTrend = "0%";
        
        try {
            long prevTotal = patientRepository.countByClinicIdAndCreatedAtBetweenAndIsDeletedFalse(clinicId, startDate.minusMonths(1), startDate);
            if (prevTotal > 0) {
                patientGrowth = String.format("+%.1f%%", (double)(totalPatients - prevTotal) * 100 / prevTotal);
            }
            
            long prevRisk = patientRepository.countByClinicIdAndRiskLevelAndCreatedAtBetweenAndIsDeletedFalse(clinicId, AppConstants.RISK_HIGH, startDate.minusMonths(1), startDate);
            if (prevRisk > 0) {
                double diff = (double)(highRiskCount - prevRisk) * 100 / prevRisk;
                riskTrend = String.format("%+.1f%%", diff);
            }
        } catch (Exception e) {
            log.warn("Failed to calculate dashboard trends: {}", e.getMessage());
        }
        
        List<ClinicDashboardResponse.DiseaseRatioDto> diseaseRatios = calculateDiseaseRatios(clinicId, totalPatients);

        List<ClinicDashboardResponse.PatientGrowthChartDto> growthChart = patientStatsFuture.join().stream()
                .map(row -> ClinicDashboardResponse.PatientGrowthChartDto.builder()
                        .month(row[0] + "/" + row[1])
                        .value(((Number) row[2]).intValue())
                        .build())
                .collect(Collectors.toList());

        List<ClinicDashboardResponse.PatientGrowthChartDto> riskChart = riskStatsFuture.join().stream()
                .map(row -> ClinicDashboardResponse.PatientGrowthChartDto.builder()
                        .month(row[0] + "/" + row[1])
                        .value(((Number) row[2]).intValue())
                        .build())
                .collect(Collectors.toList());

        List<ClinicDashboardResponse.RiskPatientDto> riskPatients = riskPatientsListFuture.join().stream()
                .map((Patient p) -> ClinicDashboardResponse.RiskPatientDto.builder()
                        .id(p.getId())
                        .name(p.getFullName())
                        .avatar(p.getAvatarUrl())
                        .condition(p.getChronicCondition())
                        .riskLevel(p.getRiskLevel())
                        .lastUpdate("Vừa cập nhật")
                        .build())
                .collect(Collectors.toList());

        // Calculate additional clinical stats
        double adherenceRate = calculateAdherenceRate(clinicId);
        double improvementRate = 12.5; // (mẫu)
        double avgConsultationTime = 18.2; // (mẫu) - minutes
        
        List<ClinicDashboardResponse.DiseaseAnalysisDto> diseaseAnalytics = diseaseRatios.stream()
                .map((ClinicDashboardResponse.DiseaseRatioDto ratio) -> ClinicDashboardResponse.DiseaseAnalysisDto.builder()
                        .diseaseName(ratio.getLabel())
                        .totalCases((int)ratio.getValue())
                        .averageIndex("126 mg/dL") // (mẫu)
                        .riskVariation("-4.2%") // (mẫu)
                        .assessment("Ổn định") // (mẫu)
                        .statusColor("emerald")
                        .build())
                .collect(Collectors.toList());

        List<ClinicDashboardResponse.DoctorPerformanceDto> doctorPerformances = userRepository.findByClinicIdAndRoleAndIsDeletedFalse(clinicId, UserRole.DOCTOR).stream()
                .map((User doctor) -> ClinicDashboardResponse.DoctorPerformanceDto.builder()
                        .dbId(doctor.getId())
                        .name(doctor.getFullName())
                        .specialty("Nội tiết") // (mẫu)
                        .load((int) appointmentRepository.countByDoctorIdAndStatus(doctor.getId(), AppointmentStatus.PENDING))
                        .rating("4.8") // (mẫu)
                        .reviews(24) // (mẫu)
                        .color("blue")
                        .build())
                .collect(Collectors.toList());

        return ClinicDashboardResponse.builder()
                .totalPatients(totalPatients)
                .highRiskAlerts(highRiskCount)
                .pendingFollowUps(monitoringCount)
                .diseaseRatios(diseaseRatios)
                .patientGrowthChart(growthChart)
                .riskIndexChart(riskChart)
                .riskPatients(riskPatients)
                .insights(insightsFuture.join())
                .patientGrowth(patientGrowth)
                .highRiskGrowth(riskTrend)
                .adherenceRate(adherenceRate)
                .improvementRate(improvementRate)
                .avgConsultationTime(avgConsultationTime)
                .diseaseAnalytics(diseaseAnalytics)
                .doctorPerformances(doctorPerformances)
                .build();
    }

    private double calculateAdherenceRate(Long clinicId) {
        long totalAppointments = appointmentRepository.countByClinicId(clinicId);
        if (totalAppointments == 0) return 0.0;
        long completed = appointmentRepository.countByClinicIdAndStatus(clinicId, AppointmentStatus.COMPLETED);
        return (double) completed / totalAppointments;
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
                .read(false)
                .build());
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "clinic_dashboard", allEntries = true)
    @Audit(action = "CREATE_APPOINTMENT", module = "CLINIC_MANAGEMENT")
    public void createAppointment(Long clinicId, com.project.dto.request.DoctorCreateAppointmentRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new com.project.exception.ResourceNotFoundException("Bệnh nhân không tồn tại"));

        if (!clinicId.equals(patient.getClinicId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized");
        }

        if (patient.getDoctorId() == null) {
            throw new RuntimeException("Bệnh nhân chưa được phân công cho bác sĩ nào. Vui lòng vào 'Điều phối bệnh nhân' để gán bác sĩ trước.");
        }

        java.time.LocalDateTime appointmentTime = java.time.LocalDateTime.parse(request.getAppointmentDate() + "T" + request.getAppointmentTime());

        Appointment appointment = Appointment.builder()
                .doctorId(patient.getDoctorId())
                .patient(patient)
                .appointmentTime(appointmentTime)
                .status(AppointmentStatus.SCHEDULED)
                .type(request.getType())
                .reason(request.getNotes())
                .build();

        if (patient.getDoctorId() != null) {
            com.project.entity.User doctor = userRepository.findById(patient.getDoctorId()).orElse(null);
            if (doctor != null) {
                appointment.setDoctorName(doctor.getFullName());
            }
        }

        appointmentRepository.save(appointment);

        // Notify patient
        notificationRepository.save(com.project.entity.Notification.builder()
                .userId(patient.getUserId())
                .title("Lịch hẹn mới")
                .message("Phòng khám đã đặt lịch hẹn mới cho bạn vào lúc " + request.getAppointmentTime() + " ngày " + request.getAppointmentDate())
                .type("APPOINTMENT")
                .read(false)
                .build());
    }
}
