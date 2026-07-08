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
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Appointment date must use yyyy-MM-dd format")
    private String appointmentDate; // yyyy-MM-dd

    @NotBlank(message = "Appointment time is required")
    @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "Appointment time must use HH:mm format")
    private String appointmentTime; // HH:mm

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "OFFLINE|ONLINE", message = "Type must be OFFLINE or ONLINE")
    private String type; // OFFLINE, ONLINE

    private String notes;
    
    private String meetingLink;
}
