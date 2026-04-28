package com.project.controller;

import com.project.dto.request.PrescriptionRequest;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.PrescriptionResponse;
import com.project.dto.response.PrescriptionStatsResponse;
import com.project.service.PrescriptionService;
import com.project.util.AppConstants;
import com.project.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@SuppressWarnings("null")
@RestController
@RequestMapping("/api/v1/doctor/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescriptions", description = "Prescription Management APIs")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get paginated list of prescriptions with filters")
    public ApiResponse<Page<PrescriptionResponse>> getPrescriptions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(defaultValue = AppConstants.DEFAULT_SORT_BY) String sortBy,
            @RequestParam(defaultValue = AppConstants.DEFAULT_SORT_DIRECTION) String direction) {
            
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
            
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<PrescriptionResponse> result = prescriptionService.getDoctorPrescriptions(doctorId, search, status, pageable);
        return ApiResponse.success("Fetched successfully", result);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get statistics for prescription dashboard")
    public ApiResponse<PrescriptionStatsResponse> getStats() {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        PrescriptionStatsResponse stats = prescriptionService.getPrescriptionStats(doctorId);
        return ApiResponse.success("Stats fetched successfully", stats);
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR') and @securityService.canAccessPatient(#request.patientId)")
    @Operation(summary = "Create a new electronic prescription")
    public ApiResponse<PrescriptionResponse> createPrescription(
            @Valid @RequestBody PrescriptionRequest request) {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        PrescriptionResponse response = prescriptionService.createPrescription(doctorId, request);
        return ApiResponse.success("Prescription created successfully", response);
    }
}
