package com.project.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDashboardResponse {
    private PatientProfileResponse profile;
    private List<HealthMetricSummaryResponse> healthMetrics;
    private List<MedicationScheduleResponse> todayMedications;
    private PatientAppointmentResponse nextAppointment;
    private List<PatientAlertResponse> alerts;
    private ConversationResponse primaryDoctorChat;
    private String latestAdvice;
}
