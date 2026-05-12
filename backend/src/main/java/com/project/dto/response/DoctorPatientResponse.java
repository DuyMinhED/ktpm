package com.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DoctorPatientResponse {
    private Long id;
    private Long doctorId;
    private String patientCode;
    private String fullName;
    private int age;
    private String gender;
    private String phone;
    private String email;
    private String chronicCondition;
    private String riskLevel;
    private String treatmentStatus;
    private String lastUpdate;
    // Latest metrics
    private String latestGlucose;
    private String latestBp;
    private String latestHeartRate;
    private String latestSpo2;
    private String avatarUrl;
    private String healthTrend; // e.g., "Worsening", "Improving", "Stable"
    private String trendColor; // e.g., "text-rose-500", "text-emerald-500", "text-slate-400"
    // Additional profile fields for complete detail availability
    private String address;
    private String identityCard;
    private String occupation;
    private String ethnicity;
    private String healthInsuranceNumber;
    private String profileStatus;
    private String clinicalNotes;
    private java.math.BigDecimal heightCm;
    private java.math.BigDecimal weightKg;
    private String bloodType;
}
