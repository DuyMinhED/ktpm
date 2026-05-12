package com.project.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorCreateAppointmentRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotBlank(message = "Appointment date is required")
    private String appointmentDate; // yyyy-MM-dd

    @NotBlank(message = "Appointment time is required")
    private String appointmentTime; // HH:mm

    @NotBlank(message = "Type is required")
    private String type; // OFFLINE, ONLINE

    private String notes;
    
    private String meetingLink;
}
