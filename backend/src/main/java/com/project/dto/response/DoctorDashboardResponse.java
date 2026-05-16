package com.project.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DoctorDashboardResponse {
    private DashboardStatsDto stats;
    private List<AppointmentSnippetDto> upcomingAppointments;
    private List<DoctorPatientResponse> recentPatients;
    private List<DoctorPatientResponse> highRiskPatients;
    private List<String> insights;
}
