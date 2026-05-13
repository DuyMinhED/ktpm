package com.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAppointmentResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientAvatarUrl;
    private LocalDateTime appointmentTime;
    private LocalDateTime endTime;
    private String appointmentType;
    private String status;
    private String location;
    private String meetingLink;
    private String reason;
    private String diagnosisSummary;
    private String doctorName;
    private String doctorSpecialty;
    private String doctorAvatarUrl;
}
