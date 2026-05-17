package com.project.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.dto.response.DoctorAppointmentResponse;
import com.project.dto.response.DoctorPatientDetailResponse;
import com.project.dto.response.DoctorPatientResponse;
import com.project.dto.response.HealthMetricResponse;
import com.project.dto.response.PatientPrescriptionResponse;
import com.project.dto.response.PatientProfileResponse;
import com.project.util.AppConstants;
import com.project.entity.Appointment;
import com.project.entity.HealthMetric;
import com.project.entity.MedicationLog;
import com.project.entity.MedicationSchedule;
import com.project.entity.MetricType;
import com.project.entity.Patient;
import com.project.entity.Prescription;
import com.project.entity.User;
import com.project.repository.AppointmentRepository;
import com.project.repository.HealthMetricRepository;
import com.project.repository.MedicationLogRepository;
import com.project.repository.MedicationScheduleRepository;
import com.project.repository.PatientRepository;
import com.project.repository.PrescriptionRepository;
import com.project.repository.UserRepository;
import com.project.service.DoctorPatientService;
import com.project.service.PatientProfileService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorPatientServiceImpl implements DoctorPatientService {

    private final PatientRepository patientRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final PatientProfileService patientProfileService;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final MedicationScheduleRepository medicationScheduleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<DoctorPatientResponse> getMyPatients(Long doctorUserId, String search, String condition,
            String riskLevel, Pageable pageable) {
        Page<Patient> patients = patientRepository.findByDoctorIdAndFilters(
                doctorUserId, search, condition, riskLevel, pageable);

        return patients.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long getTotalPatientCount(Long doctorUserId) {
        return patientRepository.countByDoctorIdAndIsDeletedFalse(doctorUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getHighRiskCount(Long doctorUserId) {
        return patientRepository.countByDoctorIdAndRiskLevelAndIsDeletedFalse(doctorUserId, AppConstants.RISK_HIGH);
    }

    @Override
    @Transactional(readOnly = true)
    public long getMonitoringCount(Long doctorUserId) {
        return patientRepository.countByDoctorIdAndRiskLevelAndIsDeletedFalse(doctorUserId, AppConstants.RISK_MONITORING);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<Double> getDailyMetricTrend(Long doctorUserId, MetricType type, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days).withHour(0).withMinute(0).withSecond(0);
        List<HealthMetric> metrics = healthMetricRepository.findByDoctorIdAndMetricTypeAndSince(doctorUserId, type, since);

        java.util.Map<LocalDate, java.util.List<Double>> grouped = metrics.stream()
                .collect(Collectors.groupingBy(
                        m -> m.getMeasuredAt().toLocalDate(),
                        Collectors.mapping(m -> m.getValue().doubleValue(), Collectors.toList())
                ));

        java.util.List<Double> result = new java.util.ArrayList<>();
        // Build temporal vector backwards starting 'days' ago until today
        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusDays(i);
            java.util.List<Double> dayVals = grouped.get(d);
            
            if (dayVals != null && !dayVals.isEmpty()) {
                double avg = dayVals.stream().mapToDouble(v -> v).average().orElse(0);
                avg = Math.round(avg * 10.0) / 10.0; // format to one decimal
                result.add(avg);
            } else {
                result.add(null);
            }
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorPatientDetailResponse getPatientDetail(Long patientId) {
        PatientProfileResponse profile = patientProfileService.getPatientProfileById(patientId);

        List<HealthMetricResponse> recentMetrics = healthMetricRepository
                .findRecentByPatientId(patientId, PageRequest.of(0, 30))
                .stream()
                .map(this::mapToMetricResponse)
                .collect(Collectors.toList());

        List<PatientPrescriptionResponse> prescriptions = prescriptionRepository
                .findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::mapToPatientPrescriptionResponse)
                .collect(Collectors.toList());

        List<DoctorAppointmentResponse> appointments = appointmentRepository
                .findByPatientIdOrderByAppointmentTimeDesc(patientId)
                .stream()
                .map(this::mapToAppointmentResponse)
                .collect(Collectors.toList());

        double adherence = calculateAdherence(patientId);

        return DoctorPatientDetailResponse.builder()
                .profile(profile)
                .recentMetrics(recentMetrics)
                .prescriptionHistory(prescriptions)
                .appointmentHistory(appointments)
                .adherenceRate(adherence)
                .build();
    }

    private double calculateAdherence(Long patientId) {
        try {
            LocalDateTime last7Days = LocalDateTime.now().minusDays(7);
            List<MedicationLog> logs = medicationLogRepository.findByPatientIdAndCreatedAtBetween(patientId, last7Days,
                    LocalDateTime.now());

            long takenCount = logs.stream().filter(l -> AppConstants.MED_STATUS_TAKEN.equals(l.getStatus())).count();
            
            List<MedicationSchedule> activeSchedules = medicationScheduleRepository
                    .findByPatientIdAndIsActiveTrue(patientId);
            long expectedCount = activeSchedules.size() * 7;

            if (expectedCount == 0)
                return 100.0;
            return (double) takenCount * 100.0 / expectedCount;
        } catch (Exception e) {
            return 0.0;
        }
    }

    private DoctorPatientResponse mapToResponse(Patient p) {
        int age = 0;
        if (p.getDateOfBirth() != null) {
            age = Period.between(p.getDateOfBirth(), LocalDate.now()).getYears();
        }

        String latestGlucose = "N/A";
        try {
            Optional<HealthMetric> glucose = healthMetricRepository
                    .findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(p.getId(),
                            MetricType.BLOOD_SUGAR);
            if (glucose.isPresent()) {
                latestGlucose = glucose.get().getValue().toPlainString() + " mmol/L";
            }
        } catch (Exception e) {
            log.debug("No glucose data for patient {}", p.getId());
        }

        String latestBp = "N/A";
        try {
            Optional<HealthMetric> bp = healthMetricRepository
                    .findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(p.getId(),
                            MetricType.BLOOD_PRESSURE);
            if (bp.isPresent()) {
                HealthMetric bpMetric = bp.get();
                latestBp = bpMetric.getValue().intValue() + "/" +
                        (bpMetric.getValueSecondary() != null ? bpMetric.getValueSecondary().intValue() : "?")
                        + " mmHg";
            }
        } catch (Exception e) {
            log.debug("No BP data for patient {}", p.getId());
        }

        String latestHeartRate = "N/A";
        try {
            Optional<HealthMetric> hr = healthMetricRepository
                    .findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(p.getId(),
                            MetricType.HEART_RATE);
            if (hr.isPresent()) {
                latestHeartRate = hr.get().getValue().intValue() + " bpm";
            }
        } catch (Exception e) {
            log.debug("No heart rate for patient {}", p.getId());
        }

        String latestSpo2 = "N/A";
        try {
            Optional<HealthMetric> spo2 = healthMetricRepository
                    .findTopByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(p.getId(),
                            MetricType.SPO2);
            if (spo2.isPresent()) {
                latestSpo2 = spo2.get().getValue().intValue() + " %";
            }
        } catch (Exception e) {
            log.debug("No SpO2 for patient {}", p.getId());
        }

        String lastUpdate = "Chưa ghi nhận";
        try {
            var recentMetrics = healthMetricRepository.findRecentByPatientId(p.getId(), PageRequest.of(0, 1));
            if (!recentMetrics.isEmpty()) {
                var latest = recentMetrics.get(0);
                lastUpdate = latest.getMeasuredAt().format(DateTimeFormatter.ofPattern("HH:mm dd/MM"));
            }
        } catch (Exception e) {
            log.debug("No metrics for patient {}", p.getId());
        }

        String[] healthTrendData = calculateHealthTrend(p.getId());

        return DoctorPatientResponse.builder()
                .id(p.getId())
                .doctorId(p.getDoctorId())
                .patientCode(p.getPatientCode())
                .fullName(p.getFullName())
                .age(age)
                .gender(p.getGender())
                .phone(p.getPhone())
                .email(p.getEmail())
                .chronicCondition(p.getChronicCondition())
                .riskLevel(p.getRiskLevel() != null ? p.getRiskLevel() : "Ổn định")
                .treatmentStatus(p.getTreatmentStatus())
                .lastUpdate(lastUpdate)
                .latestGlucose(latestGlucose)
                .latestBp(latestBp)
                .latestHeartRate(latestHeartRate)
                .latestSpo2(latestSpo2)
                .avatarUrl(p.getAvatarUrl())
                .healthTrend(healthTrendData[0])
                .trendColor(healthTrendData[1])
                .address(p.getAddress())
                .identityCard(p.getIdentityCard())
                .occupation(p.getOccupation())
                .ethnicity(p.getEthnicity())
                .healthInsuranceNumber(p.getHealthInsuranceNumber())
                .profileStatus(p.getProfileStatus())
                .clinicalNotes(p.getClinicalNotes())
                .heightCm(p.getHeightCm())
                .weightKg(p.getWeightKg())
                .bloodType(p.getBloodType())
                .build();
    }

    private String[] calculateHealthTrend(Long patientId) {
        try {
            // Analyze the two most recent glucose readings for trend
            List<HealthMetric> recent = healthMetricRepository
                    .findTop2ByPatientIdAndMetricTypeAndIsDeletedFalseOrderByMeasuredAtDesc(patientId, MetricType.BLOOD_SUGAR);

            if (recent.size() < 2) {
                return new String[]{"Cần thêm dữ liệu", "text-slate-400"};
            }

            double latest = recent.get(0).getValue().doubleValue();
            double previous = recent.get(1).getValue().doubleValue();
            double diff = latest - previous;

            if (diff > 0.5) { // Significant increase (Bad for blood sugar)
                return new String[]{"Xu hướng xấu", "text-rose-500"};
            } else if (diff < -0.5) { // Significant decrease (Good for blood sugar)
                return new String[]{"Đang cải thiện", "text-emerald-500"};
            } else {
                // Check if stable at an unhealthy level
                if (latest > 7.0) {
                    return new String[]{"Duy trì mức cao", "text-amber-600"};
                }
                return new String[]{"Ổn định", "text-sky-500"};
            }
        } catch (Exception e) {
            return new String[]{"Ổn định", "text-slate-400"};
        }
    }

    private HealthMetricResponse mapToMetricResponse(HealthMetric m) {
        return HealthMetricResponse.builder()
                .id(m.getId())
                .metricType(m.getMetricType().name())
                .metricDisplayName(m.getMetricType().getDisplayName())
                .value(m.getValue())
                .valueSecondary(m.getValueSecondary())
                .unit(m.getUnit())
                .status(m.getStatus())
                .notes(m.getNotes())
                .measuredAt(m.getMeasuredAt())
                .build();
    }

    private PatientPrescriptionResponse mapToPatientPrescriptionResponse(Prescription p) {
        List<PatientPrescriptionResponse.PrescriptionItemDetail> items = p.getItems().stream()
                .map(item -> PatientPrescriptionResponse.PrescriptionItemDetail.builder()
                        .id(item.getId())
                        .medicationName(item.getMedicationName())
                        .dosage(item.getDosage())
                        .usageInstructions(item.getUsageInstructions())
                        .build())
                .collect(Collectors.toList());

        String doctorName = userRepository.findById(p.getDoctorId())
                .map(User::getFullName)
                .orElse("N/A");

        return PatientPrescriptionResponse.builder()
                .id(p.getId())
                .prescriptionCode(p.getPrescriptionCode())
                .doctorName(doctorName)
                .diagnosis(p.getDiagnosis())
                .status(p.getStatus().name())
                .createdDate(p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate() : null)
                .items(items)
                .build();
    }

    private DoctorAppointmentResponse mapToAppointmentResponse(Appointment a) {
        return DoctorAppointmentResponse.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getFullName())
                .appointmentTime(a.getAppointmentTime())
                .endTime(a.getEndTime())
                .appointmentType(a.getType())
                .status(a.getStatus().name())
                .location(a.getLocation())
                .reason(a.getReason())
                .meetingLink(a.getMeetingLink())
                .diagnosisSummary(a.getDiagnosisSummary())
                .doctorName(a.getDoctorName())
                .doctorSpecialty(a.getDoctorSpecialty())
                .doctorAvatarUrl(a.getDoctorAvatarUrl())
                .build();
    }
}
