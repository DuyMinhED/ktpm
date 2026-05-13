package com.project.controller;

import com.project.dto.response.ApiResponse;
import com.project.dto.response.DoctorPatientDetailResponse;
import com.project.dto.response.DoctorPatientResponse;
import com.project.service.DoctorPatientService;
import com.project.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.project.util.RoleUtils;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/doctor/patients")
@RequiredArgsConstructor
@PreAuthorize("hasRole('" + RoleUtils.DOCTOR + "')")
@Tag(name = "Doctor Patients", description = "Doctor's patient management APIs")
public class DoctorPatientController {

    private final DoctorPatientService doctorPatientService;

    @GetMapping
    @Operation(summary = "Get paginated list of patients assigned to the doctor")
    public ApiResponse<Page<DoctorPatientResponse>> getMyPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        Pageable pageable = PageRequest.of(page, size);
        Page<DoctorPatientResponse> result = doctorPatientService.getMyPatients(doctorId, search, condition, riskLevel, pageable);
        return ApiResponse.success("Patients fetched successfully", result);
    }

    @GetMapping("/stats")
    @Operation(summary = "Get patient count stats for doctor")
    public ApiResponse<Map<String, Object>> getStats(@RequestParam(defaultValue = "7") int days) {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        long total = doctorPatientService.getTotalPatientCount(doctorId);
        long highRisk = doctorPatientService.getHighRiskCount(doctorId);
        long monitoringCount = doctorPatientService.getMonitoringCount(doctorId);
        long stableCount = total - highRisk - monitoringCount;

        return ApiResponse.success("Stats fetched", Map.of(
                "totalPatients", total,
                "highRiskCount", highRisk,
                "monitoringCount", monitoringCount,
                "stableCount", stableCount,
                "chartDataBp", doctorPatientService.getDailyMetricTrend(doctorId, com.project.entity.MetricType.BLOOD_PRESSURE, days),
                "chartDataGlucose", doctorPatientService.getDailyMetricTrend(doctorId, com.project.entity.MetricType.BLOOD_SUGAR, days)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@securityService.canAccessPatient(#id)")
    @Operation(summary = "Get detailed information about a specific patient")
    public ApiResponse<DoctorPatientDetailResponse> getPatientDetail(@PathVariable Long id) {
        DoctorPatientDetailResponse result = doctorPatientService.getPatientDetail(id);
        return ApiResponse.success("Patient details fetched successfully", result);
    }
}
