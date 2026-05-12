package com.project.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyContactRequest {

    @NotBlank(message = "Contact name is required")
    @Size(max = 100, message = "Contact name must not exceed 100 characters")
    private String contactName;

    @NotBlank(message = "Relationship is required")
    @Size(max = 50, message = "Relationship must not exceed 50 characters")
    private String relationship;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+\\d\\s.-]{10,20}$", message = "Invalid phone number format")
    private String phone;

    private boolean isPrimary;
}
