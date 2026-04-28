package com.project.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.dto.response.ApiResponse;
import com.project.dto.response.PatientAlertResponse;
import com.project.dto.response.PatientDashboardResponse;
import com.project.service.PatientDashboardService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/patient/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PATIENT')")
@Tag(name = "Patient Dashboard", description = "Patient dashboard aggregation APIs")
public class PatientDashboardController {

    private final PatientDashboardService service;

    @GetMapping
    @Operation(summary = "Get full dashboard data")
    public ResponseEntity<ApiResponse<PatientDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(
                "Dashboard loaded successfully", service.getDashboard()));
    }

    @GetMapping("/alerts")
    @Operation(summary = "Get patient alerts")
    public ResponseEntity<ApiResponse<List<PatientAlertResponse>>> getAlerts() {
        return ResponseEntity.ok(ApiResponse.success(
                "Alerts retrieved successfully", service.getAlerts()));
    }

    @PutMapping("/alerts/{id}/dismiss")
    @Operation(summary = "Dismiss an alert")
    public ResponseEntity<ApiResponse<Void>> dismissAlert(@PathVariable Long id) {
        service.dismissAlert(id);
        return ResponseEntity.ok(ApiResponse.success("Alert dismissed successfully", null));
    }
}
