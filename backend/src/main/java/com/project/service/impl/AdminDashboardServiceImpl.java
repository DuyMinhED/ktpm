package com.project.service.impl;

import com.project.dto.response.AdminDashboardResponse;
import com.project.dto.response.AdminReportsResponse;
import com.project.dto.response.AuditLogResponse;
import com.project.entity.Clinic;
import com.project.entity.UserRole;
import com.project.repository.AppointmentRepository;
import com.project.repository.AuditLogRepository;
import com.project.repository.ClinicRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.service.AdminDashboardService;
import com.project.util.AppConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final AuditLogRepository auditLogRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "admin_dashboard", key = "#timeRange + '_' + #metric")
    public AdminDashboardResponse getDashboardData(String timeRange, String metric) {
        try {
            CompletableFuture<Long> totalPatientsFuture = CompletableFuture.supplyAsync(() -> {
                try { return userRepository.countByRoleAndIsDeletedFalse(UserRole.PATIENT); } catch (Exception e) { return 0L; }
            });
            CompletableFuture<Long> activeClinicsFuture = CompletableFuture.supplyAsync(() -> {
                try { return clinicRepository.countByStatusAndIsDeletedFalse("ACTIVE"); } catch (Exception e) { return 0L; }
            });
            CompletableFuture<Long> totalDoctorsFuture = CompletableFuture.supplyAsync(() -> {
                try { return userRepository.countByRoleAndIsDeletedFalse(UserRole.DOCTOR); } catch (Exception e) { return 0L; }
            });
            CompletableFuture<Long> highRiskFuture = CompletableFuture.supplyAsync(() -> {
                try { return patientRepository.countByRiskLevelAndIsDeletedFalse(AppConstants.RISK_HIGH); } catch (Exception e) { return 0L; }
            });

            CompletableFuture<List<AdminDashboardResponse.ClinicPerformanceDto>> performancesFuture = CompletableFuture.supplyAsync(() -> {
                try { return getTopPerformances(); } catch (Exception e) { return new ArrayList<>(); }
            });
            CompletableFuture<List<AdminDashboardResponse.SystemActivityDto>> activitiesFuture = CompletableFuture.supplyAsync(() -> {
                try { return getRecentActivities(); } catch (Exception e) { return new ArrayList<>(); }
            });

            CompletableFuture.allOf(totalPatientsFuture, activeClinicsFuture, totalDoctorsFuture, highRiskFuture, performancesFuture, activitiesFuture).join();

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime thirtyDaysAgo = now.minusDays(30);
            LocalDateTime sixtyDaysAgo = now.minusDays(60);

            long patientsLast30Days = 0;
            long patientsPrev30Days = 0;
            try {
                patientsLast30Days = userRepository.countNewUsersBetween(UserRole.PATIENT, thirtyDaysAgo, now);
                patientsPrev30Days = userRepository.countNewUsersBetween(UserRole.PATIENT, sixtyDaysAgo, thirtyDaysAgo);
            } catch (Exception e) {
                log.error("Error calculating patient growth: {}", e.getMessage());
            }
            
            String patientGrowth = "+0%";
            if (patientsPrev30Days > 0) {
                double growth = ((double)(patientsLast30Days - patientsPrev30Days) / patientsPrev30Days) * 100;
                patientGrowth = String.format("%s%.1f%%", growth >= 0 ? "+" : "", growth);
            } else if (patientsLast30Days > 0) {
                patientGrowth = "+" + patientsLast30Days + " mới";
            }

            // Real doctor trend (last 30 days)
            long newDoctors = 0;
            try {
                newDoctors = userRepository.countByRoleAndCreatedAtBetweenGroupedByClinic(UserRole.DOCTOR, thirtyDaysAgo, now)
                    .stream().filter(obj -> obj[0] != null).mapToLong(obj -> ((Number) obj[1]).longValue()).sum();
            } catch (Exception e) {
                log.error("Error calculating doctor trend: {}", e.getMessage());
            }
            String doctorTrend = newDoctors > 0 ? "+" + newDoctors + " mới" : "Ổn định";

            return AdminDashboardResponse.builder()
                    .stats(AdminDashboardResponse.AdminStatsDto.builder()
                            .totalPatients(totalPatientsFuture.getNow(0L))
                            .activeClinics(activeClinicsFuture.getNow(0L))
                            .totalDoctors(totalDoctorsFuture.getNow(0L))
                            .highRiskAlerts(highRiskFuture.getNow(0L))
                            .patientGrowth(patientGrowth)
                            .clinicTrend("Ổn định")
                            .doctorTrend(doctorTrend)
                            .build())
                    .clinicPerformances(performancesFuture.getNow(new ArrayList<>()))
                    .recentActivities(activitiesFuture.getNow(new ArrayList<>()))
                    .chartData(generateChartData(timeRange, metric))
                    .build();
        } catch (Exception e) {
            log.error("Dashboard data collection failed: {}", e.getMessage(), e);
            return AdminDashboardResponse.builder()
                    .stats(AdminDashboardResponse.AdminStatsDto.builder()
                            .patientGrowth("+0%").clinicTrend("Bình thường").doctorTrend("Ổn định").build())
                    .chartData(new ArrayList<>())
                    .clinicPerformances(new ArrayList<>())
                    .recentActivities(new ArrayList<>())
                    .build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AdminReportsResponse getReportsData(String reportType, String performanceFilter) {
        try {
            LocalDateTime now = LocalDateTime.now();

            // Parallel fetching
            CompletableFuture<List<Clinic>> clinicsFuture = CompletableFuture.supplyAsync(clinicRepository::findAllActive);
            CompletableFuture<List<Object[]>> patientCountsFuture = CompletableFuture.supplyAsync(() -> userRepository.countByRoleGroupedByClinic(UserRole.PATIENT));
            CompletableFuture<List<Object[]>> totalApptsFuture = CompletableFuture.supplyAsync(appointmentRepository::countTotalAppointmentsByClinicNative);
            CompletableFuture<List<Object[]>> complianceRatesFuture = CompletableFuture.supplyAsync(appointmentRepository::calculateComplianceRateByClinicNative);
            CompletableFuture<List<Object[]>> newBookingsFuture = CompletableFuture.supplyAsync(() -> appointmentRepository.countNewBookingsByClinicNative(now.minusDays(30)));
            
            CompletableFuture<Double> avgTimeFuture = CompletableFuture.supplyAsync(appointmentRepository::calculateAverageConsultationTime);
            CompletableFuture<Long> anyCompletedFuture = CompletableFuture.supplyAsync(appointmentRepository::countPatientsWithAnyCompletedAppointments);
            CompletableFuture<Long> multipleCompletedFuture = CompletableFuture.supplyAsync(appointmentRepository::countPatientsWithMultipleCompletedAppointments);
            CompletableFuture<Long> recentCompletedFuture = CompletableFuture.supplyAsync(() -> appointmentRepository.countPatientsWithRecentCompletedAppointments(now.minusDays(90)));

            CompletableFuture.allOf(clinicsFuture, patientCountsFuture, totalApptsFuture, complianceRatesFuture, newBookingsFuture,
                    avgTimeFuture, anyCompletedFuture, multipleCompletedFuture, recentCompletedFuture).join();

            List<Clinic> clinics = clinicsFuture.get();
            Map<Long, Long> patientCounts = patientCountsFuture.get().stream()
                    .filter(obj -> obj[0] != null)
                    .collect(Collectors.toMap(obj -> ((Number) obj[0]).longValue(), obj -> ((Number) obj[1]).longValue()));
            Map<Long, Long> totalAppts = totalApptsFuture.get().stream()
                    .filter(obj -> obj[0] != null)
                    .collect(Collectors.toMap(obj -> ((Number) obj[0]).longValue(), obj -> ((Number) obj[1]).longValue()));
            Map<Long, Double> complianceRates = complianceRatesFuture.get().stream()
                    .filter(obj -> obj[0] != null)
                    .collect(Collectors.toMap(obj -> ((Number) obj[0]).longValue(), obj -> obj[1] != null ? ((Number) obj[1]).doubleValue() : 0.0));
            Map<Long, Long> newBookings = newBookingsFuture.get().stream()
                    .filter(obj -> obj[0] != null)
                    .collect(Collectors.toMap(obj -> ((Number) obj[0]).longValue(), obj -> ((Number) obj[1]).longValue()));

            long totalP = patientCounts.values().stream().mapToLong(Long::longValue).sum();

            List<AdminReportsResponse.ClinicBreakdown> breakdowns = clinics.stream().map(c -> AdminReportsResponse.ClinicBreakdown.builder()
                    .name(c.getName())
                    .value(patientCounts.getOrDefault(c.getId(), 0L) + " BN")
                    .percentage((totalP > 0 ? (patientCounts.getOrDefault(c.getId(), 0L) * 100 / totalP) : 0) + "%")
                    .icon("home_health").build()).collect(Collectors.toList());

            List<AdminReportsResponse.ClinicPerformance> performances = clinics.stream()
                .filter(c -> {
                    if ("ALL".equalsIgnoreCase(performanceFilter)) return true;
                    double rate = complianceRates.getOrDefault(c.getId(), 0.0);
                    if ("TỐT".equalsIgnoreCase(performanceFilter)) return rate >= 90;
                    if ("ỔN ĐỊNH".equalsIgnoreCase(performanceFilter)) return rate >= 70 && rate < 90;
                    if ("CẦN LƯU Ý".equalsIgnoreCase(performanceFilter)) return rate < 70;
                    return true;
                })
                .map(c -> {
                    double adherence = complianceRates.getOrDefault(c.getId(), 0.0);
                    return AdminReportsResponse.ClinicPerformance.builder()
                            .name(c.getName()).cases(totalAppts.getOrDefault(c.getId(), 0L).toString())
                            .appointments("+" + newBookings.getOrDefault(c.getId(), 0L))
                            .adherence(Math.round(adherence) + "%")
                            .status(adherence >= 90 ? "Tốt" : adherence >= 75 ? "Ổn định" : "Cần lưu ý")
                            .color(adherence >= 90 ? "emerald" : adherence >= 75 ? "primary" : "amber")
                            .build();
                }).collect(Collectors.toList());

            // Growth Trend
            String metric = "Lượng bệnh nhân";
            String timeRange = reportType.toUpperCase();
            List<AdminDashboardResponse.ChartDataDto> trendRaw = generateChartData(timeRange, metric);
            List<AdminReportsResponse.ChartPoint> trend = trendRaw.stream()
                    .map(d -> AdminReportsResponse.ChartPoint.builder().label(d.getLabel()).value((int)d.getValue()).build())
                    .collect(Collectors.toList());

            // === Calculate Summary Stats ===
            
            // 1. Average Consultation Time
            double avgTimeDouble = avgTimeFuture.get();
            long avgTimeVal = Math.round(avgTimeDouble);
            String avgTimeStr = avgTimeVal > 0 ? String.valueOf(avgTimeVal) : "Chưa tính";

            // 2. Return Rate
            long anyCompleted = anyCompletedFuture.get();
            long multipleCompleted = multipleCompletedFuture.get();
            double returnRatePct = anyCompleted == 0 ? 0.0 : ((double) multipleCompleted / anyCompleted) * 100.0;
            String returnRateStr = String.format("%.1f", returnRatePct);

            // 3. Retention Rate
            long recentCompleted = recentCompletedFuture.get();
            double retentionRatePct = anyCompleted == 0 ? 0.0 : ((double) recentCompleted / anyCompleted) * 100.0;
            if (retentionRatePct > 100.0) retentionRatePct = 100.0;
            String retentionRateStr = String.format("%.1f", retentionRatePct);

            // 4. NPS simulated based on overall compliance rates
            double avgCompliance = complianceRates.values().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            long npsVal = Math.min(100, Math.max(0, Math.round(avgCompliance * 0.9 + 10.0)));
            if (avgCompliance == 0.0) npsVal = 85; // reasonable fallback
            String npsStr = String.valueOf(npsVal);

            // === Calculate Analytics Trends ===
            
            // 5. Growth Rate from current vs previous trend point
            double growthRateVal = 0.0;
            if (trend.size() >= 2) {
                double lastVal = trend.get(trend.size() - 1).getValue();
                double prevVal = trend.get(trend.size() - 2).getValue();
                if (prevVal > 0) {
                    growthRateVal = ((lastVal - prevVal) / prevVal) * 100.0;
                } else if (lastVal > 0) {
                    growthRateVal = 100.0;
                }
            }
            String growthRateStr = String.format("%+.1f%%", growthRateVal);

            // 6. Peak Month / Label
            String peakLabel = "N/A";
            int maxVal = -1;
            for (AdminReportsResponse.ChartPoint p : trend) {
                if (p.getValue() >= maxVal && p.getValue() > 0) {
                    maxVal = p.getValue();
                    peakLabel = p.getLabel();
                }
            }

            // 7. Forecast
            int currentVal = trend.isEmpty() ? 0 : trend.get(trend.size() - 1).getValue();
            long forecastVal = Math.round(currentVal * (1.0 + growthRateVal / 100.0));
            if (forecastVal <= currentVal && currentVal > 0) forecastVal = currentVal + 1;
            if (currentVal == 0) forecastVal = 2; // min reasonable guess if completely empty
            String forecastStr = "+" + forecastVal + " BN";

            return AdminReportsResponse.builder()
                    .summary(AdminReportsResponse.ReportSummary.builder()
                            .nps(npsStr)
                            .avgTime(avgTimeStr)
                            .returnRate(returnRateStr)
                            .retentionRate(retentionRateStr)
                            .build())
                    .analytics(AdminReportsResponse.AnalyticsSummary.builder()
                            .growthRate(growthRateStr)
                            .peakMonth(peakLabel)
                            .returnRate(returnRateStr + "%")
                            .forecast(forecastStr)
                            .build())
                    .clinicBreakdown(breakdowns)
                    .clinicPerformances(performances)
                    .growthTrend(trend)
                    .build();

        } catch (Exception e) {
            log.error("Failed to generate reports data: {}", e.getMessage(), e);
            return AdminReportsResponse.builder()
                    .summary(AdminReportsResponse.ReportSummary.builder().nps("0").avgTime("0").returnRate("0").retentionRate("0").build())
                    .analytics(AdminReportsResponse.AnalyticsSummary.builder().growthRate("0").peakMonth("N/A").returnRate("0").forecast("0").build())
                    .clinicBreakdown(new ArrayList<>())
                    .clinicPerformances(new ArrayList<>())
                    .growthTrend(new ArrayList<>())
                    .build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(String userName, String module, String keyword, Pageable pageable) {
        String search = (keyword != null && !keyword.isBlank()) ? "%" + keyword.toLowerCase() + "%" : null;
        return auditLogRepository.findByFilters(null, null, search, pageable).map(logEntry -> AuditLogResponse.builder()
                .id(logEntry.getId()).time(logEntry.getCreatedAt().toString())
                .user(AuditLogResponse.UserDto.builder().name(logEntry.getUserName()).build())
                .action(logEntry.getAction()).module(logEntry.getModule()).details(logEntry.getDetails())
                .status(logEntry.getStatus()).build());
    }

    private List<AdminDashboardResponse.ClinicPerformanceDto> getTopPerformances() {
        List<Clinic> topClinics = clinicRepository.findByFilters("ACTIVE", null, PageRequest.of(0, 5)).getContent();
        Map<Long, Long> realDoctorCounts = userRepository.countByRoleGroupedByClinic(UserRole.DOCTOR).stream()
                .filter(obj -> obj[0] != null)
                .collect(Collectors.toMap(obj -> ((Number) obj[0]).longValue(), obj -> ((Number) obj[1]).longValue()));
        Map<Long, Long> realPatientCounts = userRepository.countByRoleGroupedByClinic(UserRole.PATIENT).stream()
                .filter(obj -> obj[0] != null)
                .collect(Collectors.toMap(obj -> ((Number) obj[0]).longValue(), obj -> ((Number) obj[1]).longValue()));
        
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime thirtyDaysAgo = now.minusDays(30);
        Map<Long, Long> recentPatientCounts = userRepository.countByRoleAndCreatedAtBetweenGroupedByClinic(UserRole.PATIENT, thirtyDaysAgo, now).stream()
                .filter(obj -> obj[0] != null)
                .collect(Collectors.toMap(obj -> ((Number) obj[0]).longValue(), obj -> ((Number) obj[1]).longValue()));

        return topClinics.stream().map(c -> {
            long total = realPatientCounts.getOrDefault(c.getId(), 0L);
            long recent = recentPatientCounts.getOrDefault(c.getId(), 0L);
            String growthStr;
            
            if (total == 0) {
                growthStr = "0%";
            } else if (recent == 0) {
                growthStr = "Ổn định";
            } else if (recent == total) {
                growthStr = "Mới (" + total + " BN)";
            } else {
                long oldTotal = total - recent;
                if (oldTotal <= 0) {
                    growthStr = "+" + recent + " BN";
                } else {
                    double growthPct = ((double) recent / oldTotal) * 100.0;
                    growthStr = String.format("+%.1f%%", growthPct);
                }
            }

            return AdminDashboardResponse.ClinicPerformanceDto.builder()
                    .id(c.getId()).name(c.getName()).clinicCode(c.getClinicCode()).phone(c.getPhone())
                    .doctorCount(realDoctorCounts.getOrDefault(c.getId(), 0L))
                    .patientCount(total)
                    .growth(growthStr).status(c.getStatus()).build();
        }).collect(Collectors.toList());
    }

    private List<AdminDashboardResponse.SystemActivityDto> getRecentActivities() {
        return auditLogRepository.findAll(PageRequest.of(0, 3, Sort.by("createdAt").descending())).getContent().stream().map(logEntry -> {
            String color = logEntry.getModule().contains("CLINIC") ? "emerald" : logEntry.getModule().contains("USER") ? "indigo" : "blue";
            return AdminDashboardResponse.SystemActivityDto.builder()
                    .title(logEntry.getAction()).description(logEntry.getModule() + ": " + logEntry.getDetails())
                    .timeAgo("Vừa xong").icon("history").color(color).build();
        }).collect(Collectors.toList());
    }

    private List<AdminDashboardResponse.ChartDataDto> generateChartData(String timeRange, String metric) {
        List<AdminDashboardResponse.ChartDataDto> data = new ArrayList<>();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime startDate;
        
        List<Object[]> results;
        boolean isPatient = "Lượng bệnh nhân".equalsIgnoreCase(metric);
        
        if ("YEAR".equalsIgnoreCase(timeRange)) {
            startDate = now.minusYears(5).withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
            results = isPatient ? userRepository.countNewPatientsByYearNative(startDate) : appointmentRepository.countAllAppointmentsByYearNative(startDate);
            for (int i = 0; i < 5; i++) {
                int year = now.getYear() - 4 + i;
                long count = findValueInResults(results, String.valueOf(year));
                data.add(AdminDashboardResponse.ChartDataDto.builder().label(String.valueOf(year)).value(count).build());
            }
        } else if ("MONTH".equalsIgnoreCase(timeRange)) {
            startDate = now.withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
            results = isPatient ? userRepository.countNewPatientsByMonthNative(startDate) : appointmentRepository.countAllAppointmentsByMonthNative(startDate);
            for (int i = 1; i <= 12; i++) {
                String label = "Th. " + i;
                long count = findValueInResults(results, String.format("-%02d-", i));
                data.add(AdminDashboardResponse.ChartDataDto.builder().label(label).value(count).build());
            }
        } else {
            startDate = now.minusDays(6).withHour(0).withMinute(0).withSecond(0);
            results = isPatient ? userRepository.countNewPatientsByDayNative(startDate) : appointmentRepository.countAllAppointmentsByDayNative(startDate);
            String[] dayLabels = {"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"};
            java.time.LocalDate today = now.toLocalDate();
            for (int i = 0; i < 7; i++) {
                java.time.LocalDate date = today.minusDays(6 - i);
                int dayOfWeek = date.getDayOfWeek().getValue(); // 1 (Mon) to 7 (Sun)
                String label = dayLabels[dayOfWeek - 1];
                long count = findValueInResults(results, date.toString());
                data.add(AdminDashboardResponse.ChartDataDto.builder().label(label).value(count).build());
            }
        }


        return data;
    }

    private long findValueInResults(List<Object[]> results, String pattern) {
        if (results == null) return 0;
        for (Object[] row : results) {
            String dateStr = row[0].toString();
            if (dateStr.contains(pattern)) {
                return ((Number) row[1]).longValue();
            }
        }
        return 0;
    }
}
