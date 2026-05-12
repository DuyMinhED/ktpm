package com.project.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePatientProfileRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    private String gender;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
    private String phone;

    @Email(message = "Invalid email address")
    private String email;

    private String address;

    private String bloodType;

    private BigDecimal heightCm;

    private BigDecimal weightKg;
    private String identityCard;
    private String occupation;
    private String ethnicity;
    private String healthInsuranceNumber;
    private java.time.LocalDate dateOfBirth;
    private String avatarUrl;
    private String medicalHistory;
    private String allergies;
}
