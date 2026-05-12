package com.project.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientAppointmentResponse {
    private Long id;
    private String doctorName;
    private String doctorSpecialty;
    private String doctorAvatarUrl;
    private LocalDateTime appointmentTime;
    private LocalDateTime endTime;
    private String appointmentType;
    private String location;
    private String meetingLink;
    private String status;
    private String reason;
    private String diagnosisSummary;
    private boolean reminderEnabled;
}
