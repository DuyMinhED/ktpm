package com.project.dto.request;

import lombok.Data;

@Data
public class CreatePatientRequest {
    private String name;
    private String age;
    private String gender;
    private String phone;
    private Long doctorId;
    private String email;
    private String address;

    private String condition;
    private String primaryCondition;

    private String riskLevel;

    private String assignedDoctor;
    private String doctor;
    private String insuranceNumber;

    private String notes;

    private String password;

    private String identityCard;
    private String occupation;
    private String ethnicity;
    private String healthInsuranceNumber;
    private java.time.LocalDate dateOfBirth;
    private String avatarUrl;
    private String treatmentStatus;
    private String status;
    private java.time.LocalDate assignmentDate;
    private String assignmentTime;
    private String appointmentType;
    private String meetingLink;
    
    // Baseline Clinical Metrics (Optional during creation)
    private java.math.BigDecimal initialGlucose;
    private java.math.BigDecimal initialBpSystolic;
    private java.math.BigDecimal initialBpDiastolic;
}
