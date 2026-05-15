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
        var avgConsultTimeFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> appointmentRepository.calculateAverageConsultationTimeByClinic(clinicId));
        var adherenceRateFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> appointmentRepository.calculateAdherenceRateByClinic(clinicId));

        // Period logic
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = "7d".equals(period) ? now.minusDays(6) : "30d".equals(period) ? now.minusDays(29) : "1y".equals(period) ? now.minusMonths(11) : now.minusMonths(5);

        boolean isDaily = "7d".equals(period) || "30d".equals(period);

        var patientStatsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
            List<Long> doctorIds = userRepository.findByClinicIdAndRoleAndIsDeletedFalse(clinicId, UserRole.DOCTOR).stream().map(User::getId).collect(Collectors.toList());
            if (doctorIds.isEmpty()) return List.<Object[]>of();
            return isDaily ? appointmentRepository.countDailyAppointmentsByDoctorIds(doctorIds, startDate)
                            : appointmentRepository.countMonthlyAppointmentsByDoctorIds(doctorIds, startDate);
        });
        var riskStatsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
            isDaily ? patientRepository.countDailyHighRiskPatients(clinicId, AppConstants.RISK_HIGH, startDate)
                    : patientRepository.countMonthlyHighRiskPatients(clinicId, AppConstants.RISK_HIGH, startDate)
        );
        var riskPatientsListFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
            patientRepository.findByClinicIdAndFilters(clinicId, null, null, AppConstants.RISK_HIGH, null, null, PageRequest.of(0, 5)).getContent());

        java.util.concurrent.CompletableFuture.allOf(totalPatientsFuture, highRiskCountFuture, monitoringCountFuture, pathologyFuture, insightsFuture, patientStatsFuture, riskStatsFuture, riskPatientsListFuture, avgConsultTimeFuture, adherenceRateFuture).join();

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
                        .month(isDaily ? row[0].toString() : (row[0] + "/" + row[1]))
                        .value(isDaily ? ((Number) row[1]).intValue() : ((Number) row[2]).intValue())
                        .build())
                .collect(Collectors.toList());

        List<ClinicDashboardResponse.PatientGrowthChartDto> riskChart = riskStatsFuture.join().stream()
                .map(row -> ClinicDashboardResponse.PatientGrowthChartDto.builder()
                        .month(isDaily ? row[0].toString() : (row[0] + "/" + row[1]))
                        .value(isDaily ? ((Number) row[1]).intValue() : ((Number) row[2]).intValue())
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
        double adherenceRate = adherenceRateFuture.join();
        
        long improvedPatients = patientRepository.countByClinicIdAndTreatmentStatusAndIsDeletedFalse(clinicId, "Cải thiện");
        double improvementRate = totalPatients > 0 ? ((double) improvedPatients / totalPatients) * 100 : 0.0;

        double avgConsultationTime = avgConsultTimeFuture.join();
        
        List<ClinicDashboardResponse.DiseaseAnalysisDto> diseaseAnalytics = diseaseRatios.stream()
                .map((ClinicDashboardResponse.DiseaseRatioDto ratio) -> {
                    String assessment = "Ổn định";
                    String color = "bg-emerald-500";
                    String riskVar = "-";
                    if (ratio.getRiskRate() > 50) {
                        assessment = "Rủi ro cao";
                        color = "bg-rose-500";
                        riskVar = "+";
                    } else if (ratio.getRiskRate() > 30) {
                        assessment = "Cần lưu ý";
                        color = "bg-amber-500";
                        riskVar = "+";
                    }

                    String index = "N/A";

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
                        .rating("Chưa có") 
                        .reviews(0) 
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

    @Override
    public List<String> getChronicConditions() {
        return List.of("Tiểu đường Type 2", "Cao huyết áp", "Tim mạch", "Hen suyễn", "Bệnh thận mãn tính");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClinicAppointmentResponse> getAppointmentRecords(Long clinicId, Pageable pageable) {
        Page<Appointment> appointments = appointmentRepository.findByClinicId(clinicId, pageable);
        List<Long> doctorIds = appointments.stream()
                .map(Appointment::getDoctorId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        
        Map<Long, User> doctorMap = new HashMap<>();
        if (!doctorIds.isEmpty()) {
            doctorMap = userRepository.findAllById(doctorIds).stream()
                    .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));
        }
        
        final Map<Long, User> finalDocMap = doctorMap;
        return appointments.map(a -> {
            User doc = finalDocMap.get(a.getDoctorId());
            String doctorName = a.getDoctorName();
            if (doctorName == null || doctorName.isEmpty() || "N/A".equalsIgnoreCase(doctorName)) {
                doctorName = (doc != null) ? doc.getFullName() : "N/A";
            }
            String doctorAvatarUrl = (doc != null && doc.getAvatarUrl() != null) ? doc.getAvatarUrl() : "";

            return ClinicAppointmentResponse.builder()
                .id(a.getId())
                .patientName(a.getPatient() != null ? a.getPatient().getFullName() : "N/A")
                .doctorName(doctorName)
                .appointmentTime(a.getAppointmentTime())
                .status(a.getStatus().name())
                .appointmentType(a.getType())
                .reason(a.getReason())
                .doctorAvatarUrl(doctorAvatarUrl)
                .patientAvatarUrl(a.getPatient() != null ? a.getPatient().getAvatarUrl() : "")
                .patientId(a.getPatient() != null ? a.getPatient().getId() : null)
                .build();
        });
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
                        .imageUrl(c.getImageUrl())
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
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new com.project.exception.ResourceNotFoundException("Lịch hẹn không tồn tại"));
        
        boolean authorized = false;
        if (appointment.getDoctorId() != null) {
            User doctor = userRepository.findById(appointment.getDoctorId()).orElse(null);
            if (doctor != null && clinicId.equals(doctor.getClinicId())) {
                authorized = true;
            }
        }
        if (!authorized && appointment.getPatient() != null && clinicId.equals(appointment.getPatient().getClinicId())) {
            authorized = true;
        }
        
        if (!authorized) throw new AccessDeniedException("Unauthorized");

        AppointmentStatus enumStatus = AppointmentStatus.valueOf(status.toUpperCase());
        appointment.setStatus(enumStatus);
        appointmentRepository.save(appointment);
        
        try {
            sendAppointmentNotification(appointment, status);
        } catch (Exception e) {
            log.warn("Failed to send notification for appointment update: {}", e.getMessage());
        }
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



    private void sendAppointmentNotification(Appointment appointment, String status) {
        String doctorDisplayName = appointment.getDoctorName() != null ? appointment.getDoctorName() : "Bác sĩ";
        
        notificationRepository.save(com.project.entity.Notification.builder()
                .userId(appointment.getPatient().getUserId())
                .title("Cập nhật lịch hẹn")
                .message("Lịch hẹn với BS. " + doctorDisplayName + " chuyển sang: " + status)
                .type("info")
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

        if ("ONLINE".equals(request.getType())) {
            appointment.setLocation("Trực tuyến");
            if (request.getMeetingLink() != null && !request.getMeetingLink().isEmpty()) {
                appointment.setMeetingLink(request.getMeetingLink());
            } else {
                appointment.setMeetingLink("https://meet.google.com/abc-xyz");
            }
        } else {
            appointment.setLocation("Phòng khám");
        }

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

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "clinic_dashboard", allEntries = true)
    @Audit(action = "UPDATE_APPOINTMENT", module = "CLINIC_MANAGEMENT")
    public void updateAppointment(Long clinicId, Long appointmentId, com.project.dto.request.DoctorCreateAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new com.project.exception.ResourceNotFoundException("Lịch hẹn không tồn tại"));

        // Verify patient/appointment belongs to clinic
        if (appointment.getPatient() == null || !clinicId.equals(appointment.getPatient().getClinicId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized");
        }

        if (appointment.getStatus() == com.project.entity.AppointmentStatus.COMPLETED || appointment.getStatus() == com.project.entity.AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Không thể cập nhật thông tin lịch hẹn đã hoàn thành hoặc đã hủy!");
        }

        java.time.LocalDateTime appointmentTime = java.time.LocalDateTime.parse(request.getAppointmentDate() + "T" + request.getAppointmentTime());
        
        appointment.setAppointmentTime(appointmentTime);
        appointment.setType(request.getType());
        appointment.setReason(request.getNotes());
        
        if ("ONLINE".equals(request.getType())) {
            appointment.setLocation("Trực tuyến");
            if (request.getMeetingLink() != null && !request.getMeetingLink().isEmpty()) {
                appointment.setMeetingLink(request.getMeetingLink());
            } else if (appointment.getMeetingLink() == null || appointment.getMeetingLink().isEmpty()) {
                appointment.setMeetingLink("https://meet.google.com/abc-xyz");
            }
        } else {
            appointment.setLocation("Phòng khám");
            appointment.setMeetingLink(null);
        }

        appointment.setStatus(AppointmentStatus.SCHEDULED);

        appointmentRepository.save(appointment);

        // Notify patient
        notificationRepository.save(com.project.entity.Notification.builder()
                .userId(appointment.getPatient().getUserId())
                .title("Thay đổi lịch hẹn")
                .message("Phòng khám đã dời lịch hẹn của bạn sang lúc " + request.getAppointmentTime() + " ngày " + request.getAppointmentDate())
                .type("APPOINTMENT")
                .read(false)
                .build());
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "clinic_dashboard", allEntries = true)
    public int batchReschedule(Long clinicId, java.time.LocalDate sourceDate, java.time.LocalDate targetDate) {
        LocalDateTime dayStart = sourceDate.atStartOfDay();
        LocalDateTime dayEnd = sourceDate.plusDays(1).atStartOfDay();

        List<Appointment> appointments = appointmentRepository.findByClinicIdAndDateRangeAndStatuses(
                clinicId, dayStart, dayEnd,
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
            a.setStatus(AppointmentStatus.SCHEDULED); // ensure active
            appointmentRepository.save(a);

            // Notify each patient
            try {
                notificationRepository.save(com.project.entity.Notification.builder()
                        .userId(a.getPatient().getUserId())
                        .title("Thay đổi lịch hẹn")
                        .message("Phòng khám đã dời lịch hẹn của bạn sang ngày " + targetDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                        .type("APPOINTMENT")
                        .read(false)
                        .build());
            } catch (Exception e) {
                log.warn("Failed to notify patient {} about batch reschedule", a.getPatient().getId(), e);
            }
        }

        return appointments.size();
    }
}
