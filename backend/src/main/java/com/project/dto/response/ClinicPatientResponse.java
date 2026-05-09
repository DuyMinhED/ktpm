package com.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClinicPatientResponse {
    private Long dbId;
    private String id; // This is the patientCode (BN-xxxx) for display
    private String name;
    private int age;
    private String phone;
    private String phoneNumber; // Added for UI consistency
    private String gender; // Added for UI consistency
    private String email;
    private String condition;
    private String primaryCondition;
    private String riskLevel;
    private String doctor;
    private Long doctorId;
    private String location;
    private String treatmentStatus;
    private String status;
    private String img;
    private String insuranceNumber;
    private String address;
    private String identityCard;
    private String occupation;
    private String ethnicity;
    private String notes;
}
