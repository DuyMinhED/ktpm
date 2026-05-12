package com.project.controller;

import com.project.dto.response.ApiResponse;
import com.project.dto.response.DoctorAppointmentResponse;
import com.project.service.DoctorAppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.project.util.RoleUtils;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctor/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('" + RoleUtils.DOCTOR + "')")
@Tag(name = "Doctor Appointments", description = "Doctor appointment management APIs")
public class DoctorAppointmentController {

    private final DoctorAppointmentService service;

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming appointments")
    public ResponseEntity<ApiResponse<List<DoctorAppointmentResponse>>> getUpcoming() {
        return ResponseEntity.ok(ApiResponse.success(
                "Upcoming appointments retrieved", service.getUpcomingAppointments()));
    }

    @GetMapping
    @Operation(summary = "Get all appointments")
    public ResponseEntity<ApiResponse<List<DoctorAppointmentResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(
                "All appointments retrieved", service.getAllAppointments()));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update appointment status")
    public ResponseEntity<ApiResponse<DoctorAppointmentResponse>> updateStatus(
            @PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(
                "Status updated", service.updateStatus(id, status)));
    }

    @PostMapping
    @Operation(summary = "Create a new appointment")
    public ResponseEntity<ApiResponse<DoctorAppointmentResponse>> createAppointment(
            @jakarta.validation.Valid @RequestBody com.project.dto.request.DoctorCreateAppointmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Appointment created successfully", service.createAppointment(request)));
    }

    @PutMapping("/{id}/reschedule")
    @Operation(summary = "Reschedule an existing appointment")
    public ResponseEntity<ApiResponse<DoctorAppointmentResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.project.dto.request.DoctorCreateAppointmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lịch hẹn đã được dời thành công", service.rescheduleAppointment(id, request)));
    }
}
