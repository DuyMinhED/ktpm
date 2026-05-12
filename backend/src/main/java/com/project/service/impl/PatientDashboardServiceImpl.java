package com.project.service.impl;

import com.project.dto.response.*;
import com.project.entity.Patient;
import com.project.entity.PatientAlert;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.MessageRepository;
import com.project.repository.PatientAlertRepository;
import com.project.repository.PatientRepository;
import com.project.service.*;
import com.project.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class PatientDashboardServiceImpl implements PatientDashboardService {

    private final PatientProfileService profileService;
    private final PatientHealthMetricService healthMetricService;
    private final PatientPrescriptionService prescriptionService;
    private final PatientAppointmentService appointmentService;
    private final PatientMessageService messageService;
    private final PatientAlertRepository alertRepository;
    private final PatientRepository patientRepository;
    private final MessageRepository messageRepository;

    @Override
    public PatientDashboardResponse getDashboard() {
        PatientProfileResponse profile = profileService.getCurrentPatientProfile();

        List<HealthMetricSummaryResponse> healthMetrics = healthMetricService.getMetricsSummary("WEEK");

        List<MedicationScheduleResponse> todayMeds = prescriptionService.getTodaySchedule();

        List<PatientAppointmentResponse> upcoming = appointmentService.getUpcoming();
        PatientAppointmentResponse nextAppointment = upcoming.isEmpty() ? null : upcoming.get(0);

        List<PatientAlertResponse> alerts = getAlerts();

        List<ConversationResponse> conversations = messageService.getConversations();
        ConversationResponse primaryChat = conversations.isEmpty() ? null : conversations.get(0);

        String latestAdvice = null;
        if (primaryChat != null) {
            var opt = messageRepository.findTopByConversationIdAndContentStartingWithOrderBySentAtDesc(primaryChat.getId(), "[Tư vấn");
            if (opt.isPresent()) {
                latestAdvice = opt.get().getContent();
            }
        }

        return PatientDashboardResponse.builder()
                .profile(profile)
                .healthMetrics(healthMetrics)
                .todayMedications(todayMeds)
                .nextAppointment(nextAppointment)
                .alerts(alerts)
                .primaryDoctorChat(primaryChat)
                .latestAdvice(latestAdvice)
                .build();
    }

    @Override
    public List<PatientAlertResponse> getAlerts() {
        Patient patient = getCurrentPatient();
        return alertRepository
                .findByPatientIdAndIsDismissedFalseOrderByCreatedAtDesc(patient.getId())
                .stream()
                .map(this::mapToAlertResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void dismissAlert(Long alertId) {
        Patient patient = getCurrentPatient();
        PatientAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + alertId));
        
        if (!alert.getPatient().getId().equals(patient.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to dismiss this alert");
        }

        alert.setDismissed(true);
        alertRepository.save(alert);
        log.info("Alert dismissed: id={}, patientId={}", alertId, patient.getId());
    }

    // === Private Helpers ===

    private Patient getCurrentPatient() {
        Long userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new ResourceNotFoundException("User not authenticated"));
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    private PatientAlertResponse mapToAlertResponse(PatientAlert a) {
        return PatientAlertResponse.builder()
                .id(a.getId())
                .alertType(a.getAlertType())
                .severity(a.getSeverity())
                .title(a.getTitle())
                .message(a.getMessage())
                .isRead(a.isRead())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
