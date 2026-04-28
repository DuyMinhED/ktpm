package com.project.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminClinicResponse {
    private Long id;
    private String clinicCode;
    private String name;
    private String address;
    private String phone;
    private String imageUrl;
    private String managerName;
    private String managerEmail;
    private int doctorCount;
    private int patientCount;
    private int highRiskPatientCount;
    private String status;
    private String growth;
    private LocalDateTime createdAt;
}
