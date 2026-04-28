package com.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMedicalServiceStatsResponse {
    private long totalServices;
    private long activeServices;
    private double totalEstimatedValue;
    private long newRegistrations;
    private String registrationGrowth;
}
