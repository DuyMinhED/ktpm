package com.project.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotNull(message = "Appointment time is required")
    @Future(message = "Appointment time must be in the future")
    private LocalDateTime appointmentTime;

    private LocalDateTime endTime;

    @NotBlank(message = "Appointment type is required")
    @Pattern(regexp = "IN_PERSON|ONLINE", message = "Appointment type must be IN_PERSON or ONLINE")
    private String appointmentType; // IN_PERSON, ONLINE

    private String location;

    private String reason;
}
