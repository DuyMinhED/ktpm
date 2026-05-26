package com.project.controller;

import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.DoctorResponse;
import com.project.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctor Management", description = "APIs for managing doctors")
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    @Operation(summary = "Get list of doctors", description = "Returns active doctor records with optional specialty filter and pagination")
    public ApiResponse<Page<DoctorResponse>> getDoctors(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.success("Doctors fetched successfully", doctorService.getDoctors(specialty, keyword, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get doctor details by ID")
    public ApiResponse<DoctorResponse> getDoctorById(@PathVariable Long id) {
        return ApiResponse.success("Doctor details fetched successfully", doctorService.getDoctorById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new doctor (Admin only)")
    public ApiResponse<DoctorResponse> createDoctor(@Valid @RequestBody CreateDoctorRequest request) {
        return ApiResponse.success("Doctor created successfully", doctorService.createDoctor(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isDoctorSelf(#id)")
    @Operation(summary = "Update doctor details (Admin or self)")
    public ApiResponse<DoctorResponse> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody CreateDoctorRequest request) {
        return ApiResponse.success("Doctor updated successfully", doctorService.updateDoctor(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete doctor (Admin only)")
    public ApiResponse<Void> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ApiResponse.success("Doctor deleted successfully", null);
    }
}
