package com.project.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.dto.request.CreateHealthMetricRequest;
import com.project.dto.response.HealthMetricResponse;
import com.project.dto.response.HealthMetricSummaryResponse;
import com.project.entity.HealthMetric;
import com.project.entity.MetricType;
import com.project.entity.Patient;
import com.project.entity.PatientAlert;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.HealthMetricRepository;
import com.project.repository.PatientRepository;
import com.project.service.PatientHealthMetricService;
import com.project.util.SecurityUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class PatientHealthMetricServiceImpl implements PatientHealthMetricService {

    private final HealthMetricRepository healthMetricRepository;
    private final PatientRepository patientRepository;
    private final com.project.service.NotificationService notificationService;
    private final com.project.repository.PatientAlertRepository patientAlertRepository;
    private final com.project.repository.SystemConfigRepository systemConfigRepository;
    private final com.project.repository.ClinicRepository clinicRepository;

    private static final Map<MetricType, String> DISPLAY_NAMES = Map.of(
            MetricType.BLOOD_SUGAR, "Blood Sugar",
            MetricType.BLOOD_PRESSURE, "Blood Pressure",
            MetricType.HEART_RATE, "Heart Rate",
            MetricType.HBA1C, "HbA1c",
            MetricType.SPO2, "SpO2");

    private static final Map<MetricType, String> UNITS = Map.of(
            MetricType.BLOOD_SUGAR, "mmol/L",
            MetricType.BLOOD_PRESSURE, "mmHg",
            MetricType.HEART_RATE, "bpm",
            MetricType.HBA1C, "%",
            MetricType.SPO2, "%");

    private static final Map<MetricType, String> ICONS = Map.of(
            MetricType.BLOOD_SUGAR, "glucose",
            MetricType.BLOOD_PRESSURE, "vital_signs",
            MetricType.HEART_RATE, "favorite",
            MetricType.HBA1C, "science",
            MetricType.SPO2, "air");

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    public HealthMetricResponse create(CreateHealthMetricRequest request) {
        Patient patient = getCurrentPatient();
        return processAndSave(patient, request);
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    public HealthMetricResponse recordMetricForPatient(Long patientId, CreateHealthMetricRequest request) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        return processAndSave(patient, request);
    }

    private HealthMetricResponse processAndSave(Patient patient, CreateHealthMetricRequest request) {
        MetricType metricType = MetricType.valueOf(request.getMetricType());

        String status = evaluateStatus(metricType, request.getValue(), request.getValueSecondary());

        HealthMetric metric = HealthMetric.builder()
                .patient(patient)
                .metricType(metricType)
                .value(request.getValue())
                .valueSecondary(request.getValueSecondary())
                .unit(request.getUnit() != null ? request.getUnit() : UNITS.getOrDefault(metricType, ""))
                .status(status)
                .notes(request.getNotes())
                .measuredAt(request.getMeasuredAt() != null ? request.getMeasuredAt() : LocalDateTime.now())
                .build();

        HealthMetric saved = Objects.requireNonNull(healthMetricRepository.save(metric));
        
        // Notify Doctor and update risk level if risk detected
        if ("HIGH".equals(status) || "LOW".equals(status)) {
            patient.setRiskLevel("HIGH_RISK");
            patientRepository.save(patient);

            if (patient.getDoctorId() != null) {
                String title = "Cảnh báo chỉ số sức khỏe: " + DISPLAY_NAMES.get(metricType);
                String message = "Bệnh nhân " + patient.getFullName() + " có chỉ số " + DISPLAY_NAMES.get(metricType) + " bất thường: " + saved.getValue().toString() + (saved.getValueSecondary() != null ? "/" + saved.getValueSecondary().toString() : "") + " " + saved.getUnit();
                
                // Notify Doctor
                notificationService.sendNotification(patient.getDoctorId(), title, message, "warning", "/doctor/patients/" + patient.getId());

                // Notify Clinic Manager
                clinicRepository.findById(patient.getClinicId()).ifPresent(clinic -> {
                    if (clinic.getManagerId() != null) {
                        notificationService.sendNotification(clinic.getManagerId(), "[Clinic Alert] " + title, "Bệnh nhân của phòng khám: " + message, "warning", "/clinic/risk-alerts");
                    }
                });

                // Also notify the Patient via PatientAlert
                PatientAlert patientAlert = PatientAlert.builder()
                        .patient(patient)
                        .alertType("HEALTH_WARNING")
                        .severity("WARNING")
                        .title("Cảnh báo chỉ số " + DISPLAY_NAMES.get(metricType))
                        .message("Chỉ số " + DISPLAY_NAMES.get(metricType) + " của bạn đang ở mức " + status + " (" + saved.getValue().toString() + (saved.getValueSecondary() != null ? "/" + saved.getValueSecondary().toString() : "") + " " + saved.getUnit() + "). Vui lòng chú ý sức khỏe và liên hệ bác sĩ nếu cần thiết.")
                        .isRead(false)
                        .isDismissed(false)
                        .build();
                patientAlertRepository.save(Objects.requireNonNull(patientAlert));
            }
        } else if ("NORMAL".equals(status)) {
            if ("HIGH_RISK".equals(patient.getRiskLevel())) {
                patient.setRiskLevel("STABLE");
                patientRepository.save(patient);
            }
        }

        log.info("Health metric recorded: type={}, patientId={}", metricType, patient.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HealthMetricSummaryResponse> getMetricsSummary(String period) {
        Patient patient = getCurrentPatient();
        LocalDateTime[] range = getDateRange(period);

        // Fetch all metrics in range for charts/trends in ONE query
        List<HealthMetric> allInRange = healthMetricRepository
                .findByPatientIdAndMeasuredAtBetweenAndIsDeletedFalse(patient.getId(), range[0], range[1]);

        // Fetch recent metrics (limit to 50 for safety) to get latest per type in ONE query
        List<HealthMetric> recentMetrics = healthMetricRepository.findRecentByPatientId(patient.getId(),
                org.springframework.data.domain.PageRequest.of(0, 50));

        Map<MetricType, List<HealthMetric>> groupedInRange = allInRange.stream()
                .collect(Collectors.groupingBy(HealthMetric::getMetricType));

        Map<MetricType, HealthMetric> latestPerType = recentMetrics.stream()
                .collect(Collectors.toMap(
                        HealthMetric::getMetricType,
                        m -> m,
                        (existing, replacement) -> existing // Keep the most recent one (already sorted)
                ));

        List<HealthMetricSummaryResponse> summaries = new ArrayList<>();

        for (MetricType type : MetricType.values()) {
            HealthMetric latest = latestPerType.get(type);
            if (latest != null) {
                List<HealthMetric> chartMetrics = groupedInRange.getOrDefault(type, new ArrayList<>());

                summaries.add(HealthMetricSummaryResponse.builder()
                        .metricType(type.name())
                        .displayName(DISPLAY_NAMES.get(type))
                        .icon(ICONS.get(type))
                        .latestValue(latest.getValue())
                        .latestValueSecondary(latest.getValueSecondary())
                        .unit(UNITS.get(type))
                        .status(latest.getStatus())
                        .trend(determineTrend(chartMetrics))
                        .changePercentage(calculateChange(chartMetrics))
                        .chartData(chartMetrics.stream().map(this::mapToResponse).collect(Collectors.toList()))
                        .build());
            }
        }
        return summaries;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HealthMetricResponse> getChartData(String metricType, String period) {
        Patient patient = getCurrentPatient();
        MetricType type = MetricType.valueOf(metricType);
        LocalDateTime[] range = getDateRange(period);

        return healthMetricRepository
                .findByPatientIdAndMetricTypeAndMeasuredAtBetweenAndIsDeletedFalse(
                        patient.getId(), type, range[0], range[1])
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<HealthMetricResponse> getHistory(Pageable pageable) {
        Patient patient = getCurrentPatient();
        return healthMetricRepository
                .findByPatientIdAndIsDeletedFalseOrderByMeasuredAtDesc(patient.getId(), pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    public void delete(Long id) {
        Patient patient = getCurrentPatient();
        HealthMetric metric = healthMetricRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Health metric not found: " + id));
        
        if (!metric.getPatient().getId().equals(patient.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to delete this metric");
        }

        metric.setDeleted(true);
        healthMetricRepository.save(metric);
        log.info("Health metric soft-deleted: id={}, patientId={}", id, patient.getId());
    }

    // === Private Helpers ===

    private Patient getCurrentPatient() {
        Long userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new ResourceNotFoundException("User not authenticated"));
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No patient profile found for this user."));
    }

    private HealthMetricResponse mapToResponse(HealthMetric m) {
        return HealthMetricResponse.builder()
                .id(m.getId())
                .metricType(m.getMetricType().name())
                .metricDisplayName(DISPLAY_NAMES.get(m.getMetricType()))
                .value(m.getValue())
                .valueSecondary(m.getValueSecondary())
                .unit(m.getUnit())
                .status(m.getStatus())
                .notes(m.getNotes())
                .measuredAt(m.getMeasuredAt())
                .build();
    }

    private String evaluateStatus(MetricType type, BigDecimal value, BigDecimal secondary) {
        com.project.entity.SystemConfig config = systemConfigRepository.findFirstByOrderByIdAsc().orElse(null);
        
        return switch (type) {
            case BLOOD_SUGAR -> {
                double v = value.doubleValue();
                if (v < 3.9) yield "LOW";
                else if (v <= 6.1) yield "NORMAL";
                else if (v <= 7.0) yield "BORDERLINE_HIGH";
                else yield "HIGH";
            }
            case BLOOD_PRESSURE -> {
                double systolic = value.doubleValue();
                double diastolic = secondary != null ? secondary.doubleValue() : 0;
                
                double sysThreshold = config != null ? Double.parseDouble(config.getBpSysThreshold()) : 140.0;
                double diaThreshold = config != null ? Double.parseDouble(config.getBpDiaThreshold()) : 90.0;
                
                if (systolic < 120 && diastolic < 80) yield "NORMAL";
                else if (systolic <= sysThreshold && diastolic <= diaThreshold) yield "BORDERLINE_HIGH";
                else yield "HIGH";
            }
            case HEART_RATE -> {
                double v = value.doubleValue();
                double hrThreshold = config != null ? Double.parseDouble(config.getHrThreshold()) : 100.0;
                if (v >= 60 && v <= hrThreshold) yield "NORMAL";
                else if (v < 60) yield "LOW";
                else yield "HIGH";
            }
            case HBA1C -> {
                double v = value.doubleValue();
                if (v < 5.7) yield "NORMAL";
                else if (v <= 6.4) yield "BORDERLINE_HIGH";
                else yield "HIGH";
            }
            case SPO2 -> {
                double v = value.doubleValue();
                double spo2Threshold = config != null ? Double.parseDouble(config.getSpo2Threshold()) : 94.0;
                if (v >= spo2Threshold) yield "NORMAL";
                else if (v >= 90) yield "BORDERLINE_LOW";
                else yield "LOW";
            }
        };
    }

    private String calculateChange(List<HealthMetric> metrics) {
        if (metrics.size() < 2)
            return "0%";
        BigDecimal latest = metrics.get(metrics.size() - 1).getValue();
        BigDecimal previous = metrics.get(metrics.size() - 2).getValue();
        if (previous.compareTo(BigDecimal.ZERO) == 0)
            return "0%";
        BigDecimal change = latest.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        return (change.compareTo(BigDecimal.ZERO) > 0 ? "+" : "") + change.setScale(1, RoundingMode.HALF_UP) + "%";
    }

    private String determineTrend(List<HealthMetric> metrics) {
        if (metrics.size() < 2)
            return "STABLE";
        BigDecimal latest = metrics.get(metrics.size() - 1).getValue();
        BigDecimal previous = metrics.get(metrics.size() - 2).getValue();
        int cmp = latest.compareTo(previous);
        if (cmp > 0)
            return "UP";
        if (cmp < 0)
            return "DOWN";
        return "STABLE";
    }

    private LocalDateTime[] getDateRange(String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from = switch (period.toUpperCase()) {
            case "DAY" -> now.minusDays(1);
            case "WEEK" -> now.minusWeeks(1);
            case "MONTH" -> now.minusMonths(1);
            case "YEAR" -> now.minusYears(1);
            default -> now.minusWeeks(1);
        };
        return new LocalDateTime[] { from, now };
    }
}
