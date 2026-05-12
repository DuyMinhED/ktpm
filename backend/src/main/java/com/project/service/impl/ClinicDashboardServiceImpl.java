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
        
        long improvedPatients = patientRepository.countByClinicIdAndTreatmentStatusAndIsDeletedFalse(clinicId, "Cải thiện");
        double improvementRate = totalPatients > 0 ? ((double) improvedPatients / totalPatients) * 100 : 0.0;

        List<Object[]> times = appointmentRepository.findCompletedAppointmentTimesByClinic(clinicId);
        double totalMinutes = 0;
        int countValid = 0;
        for (Object[] t : times) {
            java.time.LocalDateTime start = (java.time.LocalDateTime) t[0];
            java.time.LocalDateTime end = (java.time.LocalDateTime) t[1];
            if (start != null && end != null) {
                totalMinutes += java.time.Duration.between(start, end).toMinutes();
                countValid++;
            }
        }
        double avgConsultationTime = countValid == 0 ? 0.0 : totalMinutes / countValid;
        
        List<ClinicDashboardResponse.DiseaseAnalysisDto> diseaseAnalytics = diseaseRatios.stream()
                .map((ClinicDashboardResponse.DiseaseRatioDto ratio) -> {
                    String assessment = "Ổn định";
                    String color = "bg-emerald-500";
                    String riskVar = "-1.2%";
                    if (ratio.getRiskRate() > 50) {
                        assessment = "Rủi ro cao";
                        color = "bg-rose-500";
                        riskVar = "+5.8%";
                    } else if (ratio.getRiskRate() > 30) {
                        assessment = "Cần lưu ý";
                        color = "bg-amber-500";
                        riskVar = "+2.4%";
                    }

                    String index = "Không có DLTN";
                    if (ratio.getLabel() != null) {
                        if (ratio.getLabel().contains("Tiểu đường")) index = "126 mg/dL";
                        else if (ratio.getLabel().contains("huyết áp")) index = "135/85 mmHg";
                        else if (ratio.getLabel().contains("Hen suyễn")) index = "PEF 75%";
                        else if (ratio.getLabel().contains("Tim mạch")) index = "Nhịp tim 82 bpm";
                    }

                    return ClinicDashboardResponse.DiseaseAnalysisDto.builder()
                        .diseaseName(ratio.getLabel())
                        .totalCases((int)ratio.getValue())
                        .averageIndex(index)
                        .riskVariation(riskVar)
                        .assessment(assessment)
                        .statusColor(color)
                        .build();
                })
                .collect(Collectors.toList());

        List<ClinicDashboardResponse.DoctorPerformanceDto> doctorPerformances = userRepository.findByClinicIdAndRoleAndIsDeletedFalse(clinicId, UserRole.DOCTOR).stream()
                .map((User doctor) -> ClinicDashboardResponse.DoctorPerformanceDto.builder()
                        .dbId(doctor.getId())
                        .name(doctor.getFullName())
                        .specialty(doctor.getSpecialization() != null ? doctor.getSpecialization() : "Nội khoa")
                        .load((int) appointmentRepository.countByDoctorIdAndStatus(doctor.getId(), AppointmentStatus.PENDING))
                        .rating("4.8") 
                        .reviews(24) 
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

            long riskHigh = risks.getOrDefault(AppConstants.RISK_HIGH, 0L);
            long riskMid = risks.getOrDefault(AppConstants.RISK_MEDIUM, 0L) + risks.getOrDefault(AppConstants.RISK_MONITORING, 0L);
            long riskLow = risks.getOrDefault(AppConstants.RISK_LOW, 0L) + risks.getOrDefault("Ổn định", 0L);

            double stableRate = total > 0 ? (double) riskLow / total * 100 : 0;
            double midRate = total > 0 ? (double) riskMid / total * 100 : 0;
            double riskRate = total > 0 ? (double) riskHigh / total * 100 : 0;

            return ClinicDashboardResponse.DiseaseRatioDto.builder()
                    .label(condition)
                    .percentage(totalPatients > 0 ? (total * 100 / totalPatients) + "%" : "0%")
                    .value(total)
                    .stableRate(stableRate)
                    .midRate(midRate)
                    .riskRate(riskRate)
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
            List<User> clinicDoctors = userRepository.findByClinicIdAndRoleAndIsDeletedFalse(clinicId, UserRole.DOCTOR);
            if (clinicDoctors != null && !clinicDoctors.isEmpty()) {
                patient.setDoctorId(clinicDoctors.get(0).getId());
                patientRepository.save(patient);
            } else {
                throw new RuntimeException("Không thể đặt lịch: Hệ thống chưa có bác sĩ nào để phân công cho bệnh nhân!");
            }
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
