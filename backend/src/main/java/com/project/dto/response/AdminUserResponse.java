package com.project.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String roleName;
    private String clinicName;
    private String clinicPhone;
    private String avatarUrl;
    private String status;
    private String licenseNumber;
    private String degree;
    private String bio;
    private String licenseImageUrl;
    private String specialization;
    private String experience;
    private LocalDateTime createdAt;
}
