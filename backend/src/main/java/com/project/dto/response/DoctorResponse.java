package com.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String specialization;
    private String department;
    private String licenseNumber;
    private String licenseImageUrl;
    private String degree;
    private String bio;
    private String experience;
    private String status;
    private String avatarUrl;
    private Long clinicId;
}
