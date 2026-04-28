package com.project.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.project.dto.request.CreateHealthMetricRequest;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.HealthMetricResponse;
import com.project.dto.response.HealthMetricSummaryResponse;
import com.project.service.PatientHealthMetricService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/patient/health-metrics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PATIENT')")
@Tag(name = "Patient Health Metrics", description = "Health metrics tracking APIs")
public class PatientHealthMetricController {

    private final PatientHealthMetricService service;

    @PostMapping
    @Operation(summary = "Record a new health metric")
    public ResponseEntity<ApiResponse<HealthMetricResponse>> create(
            @Valid @RequestBody CreateHealthMetricRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Health metric saved successfully", service.create(request)));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get metrics summary for dashboard cards")
    public ResponseEntity<ApiResponse<List<HealthMetricSummaryResponse>>> getSummary(
            @RequestParam(defaultValue = "WEEK") String period) {
        return ResponseEntity.ok(ApiResponse.success(
                "Summary retrieved successfully", service.getMetricsSummary(period)));
    }

    @GetMapping("/chart")
    @Operation(summary = "Get chart data for a specific metric type")
    public ResponseEntity<ApiResponse<List<HealthMetricResponse>>> getChartData(
            @RequestParam String metricType,
            @RequestParam(defaultValue = "WEEK") String period) {
        return ResponseEntity.ok(ApiResponse.success(
                "Chart data retrieved successfully", service.getChartData(metricType, period)));
    }

    @GetMapping("/history")
    @Operation(summary = "Get health metrics history (paginated)")
    public ResponseEntity<ApiResponse<Page<HealthMetricResponse>>> getHistory(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                "History retrieved successfully", service.getHistory(pageable)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete a health metric")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Health metric deleted successfully", null));
    }
}
