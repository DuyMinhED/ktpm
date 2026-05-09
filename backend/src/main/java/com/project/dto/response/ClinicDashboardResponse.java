package com.project.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ClinicDashboardResponse {

    private long totalPatients;
    private long highRiskAlerts;
    private long pendingFollowUps;
    
    private String patientGrowth;
    private String highRiskGrowth;
    
    private double adherenceRate;
    private double improvementRate;
    private double avgConsultationTime;

    private List<DiseaseRatioDto> diseaseRatios;
    private List<PatientGrowthChartDto> patientGrowthChart;
    private List<PatientGrowthChartDto> riskIndexChart;
    private List<PatientGrowthChartDto> doctorLoadChart;
    private GrowthStatsDto growthStats;
    private List<DiseaseAnalysisDto> diseaseAnalytics;
    private List<DoctorPerformanceDto> doctorPerformances;
    private List<RiskPatientDto> riskPatients;
    private List<String> insights;
    private double averageDoctorLoad;

    @Data
    @Builder
    public static class RiskPatientDto {
        private Long id;
        private String name;
        private String avatar;
        private String condition;
        private String riskLevel;
        private String lastUpdate;
    }

    @Data
    @Builder
    public static class DiseaseRatioDto {
        private String label;
        private String percentage;
        private String color;
        private long value; // actual patient count
        private double stableRate;
        private double midRate;
        private double riskRate;
    }

    @Data
    @Builder
    public static class DiseaseAnalysisDto {
        private String diseaseName;
        private int totalCases;
        private String averageIndex; // e.g., "126 mg/dL"
        private String riskVariation; // e.g., "-4.2%"
        private String assessment; // e.g., "Ổn định"
        private String statusColor;
    }

    @Data
    @Builder
    public static class PatientGrowthChartDto {
        private String month;
        private int value;
        private int secondaryValue; // for inpatient vs outpatient
        private boolean active;
    }

    @Data
    @Builder
    public static class GrowthStatsDto {
        private String growth;
        private String average;
        private String peakMonth;
    }

    @Data
    @Builder
    public static class DoctorPerformanceDto {
        private Long dbId;
        private String id;
        private String name;
        private String img;
        private String specialty;
        private String email;
        private String phone;
        private String licenseNumber;
        private String degree;
        private String bio;
        private String licenseImageUrl;
        private int load;
        private String color;
        private String progress;
        private String rating;
        private int reviews;
        private String status;
        private boolean active;
    }
}
