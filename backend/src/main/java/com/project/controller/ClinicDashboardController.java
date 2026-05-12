package com.project.controller;

import com.project.dto.request.CreatePatientRequest;
import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.ClinicDashboardResponse;
import com.project.dto.response.ClinicPatientResponse;
import com.project.dto.response.ClinicDoctorResponse;
import com.project.dto.response.DoctorSnippetDto;
import com.project.service.ClinicDashboardService;
import com.project.service.ClinicPatientService;
import com.project.service.ClinicDoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.project.util.RoleUtils;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/clinics/{clinicId}")
@RequiredArgsConstructor
@Tag(name = "Clinic Management", description = "APIs for clinic managers")
public class ClinicDashboardController {

    private final ClinicDashboardService clinicDashboardService;
    private final ClinicPatientService clinicPatientService;
    private final ClinicDoctorService clinicDoctorService;
    private final com.project.service.PatientHealthMetricService patientHealthMetricService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    @Operation(summary = "Get clinic dashboard", description = "Returns statistics for the specified clinic")
    public ApiResponse<ClinicDashboardResponse> getDashboard(
            @PathVariable Long clinicId,
            @RequestParam(defaultValue = "6m") String period) {

        return ApiResponse.success("Dashboard info fetched", clinicDashboardService.getDashboardData(clinicId, period));
    }

    @GetMapping("/patients")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    @Operation(summary = "Get patients", description = "Returns active patient records for the specified clinic")
    public ApiResponse<Page<ClinicPatientResponse>> getPatients(
            @PathVariable Long clinicId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String doctor,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.success("Patients fetched",
                clinicPatientService.getPatientRecords(clinicId, keyword, condition, riskLevel, status, doctor,
                        pageable));
    }

    @PostMapping("/patients")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN + "', '" + RoleUtils.DOCTOR
            + "') and (@securityService.isClinicManagerOf(#clinicId) or @securityService.isDoctorOfClinic(#clinicId))")
    @Operation(summary = "Add patient", description = "Registers a new patient for the specified clinic")
    public ApiResponse<Void> createPatient(@PathVariable Long clinicId,
            @Valid @RequestBody CreatePatientRequest request) {

        clinicPatientService.createPatient(clinicId, request);
        return ApiResponse.success("Patient registered successfully", null);
    }

    @PutMapping("/patients/{patientId}")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    @Operation(summary = "Update patient", description = "Updates patient record")
    public ApiResponse<Void> updatePatient(@PathVariable Long clinicId, @PathVariable Long patientId,
            @Valid @RequestBody CreatePatientRequest request) {

        clinicPatientService.updatePatient(clinicId, patientId, request);
        return ApiResponse.success("Patient updated successfully", null);
    }

    @DeleteMapping("/patients/{patientId}")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    @Operation(summary = "Delete patient", description = "Deletes patient record")
    public ApiResponse<Void> deletePatient(@PathVariable Long clinicId, @PathVariable Long patientId) {

        clinicPatientService.deletePatient(clinicId, patientId);
        return ApiResponse.success("Patient deleted successfully", null);
    }

    @GetMapping("/doctors")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    @Operation(summary = "Get doctors", description = "Returns active doctor records for the specified clinic")
    public ApiResponse<Page<ClinicDoctorResponse>> getDoctors(
            @PathVariable Long clinicId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String degree,
            @RequestParam(required = false) String experience,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.success("Doctors fetched",
                clinicDoctorService.getDoctorRecords(clinicId, keyword, status, specialty, degree, experience,
                        pageable));
    }

    @PostMapping("/doctors")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    @Operation(summary = "Add doctor", description = "Registers a new doctor for the specified clinic")
    public ApiResponse<Void> createDoctor(@PathVariable Long clinicId,
            @Valid @RequestBody CreateDoctorRequest request) {

        clinicDoctorService.createDoctor(clinicId, request);
        return ApiResponse.success("Doctor registered successfully", null);
    }

    @PutMapping("/doctors/{doctorId}")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    @Operation(summary = "Update doctor", description = "Updates doctor record")
    public ApiResponse<Void> updateDoctor(@PathVariable Long clinicId, @PathVariable Long doctorId,
            @Valid @RequestBody CreateDoctorRequest request) {

        clinicDoctorService.updateDoctor(clinicId, doctorId, request);
        return ApiResponse.success("Doctor updated successfully", null);
    }

    @DeleteMapping("/doctors/{doctorId}")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    @Operation(summary = "Delete doctor", description = "Deletes doctor record (Soft delete)")
    public ApiResponse<Void> deleteDoctor(@PathVariable Long clinicId, @PathVariable Long doctorId) {

        clinicDoctorService.deleteDoctor(clinicId, doctorId);
        return ApiResponse.success("Doctor deleted successfully", null);
    }

    @GetMapping("/doctors/available")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN + "', '" + RoleUtils.DOCTOR
            + "') and (@securityService.isClinicManagerOf(#clinicId) or @securityService.isDoctorOfClinic(#clinicId))")
    public ApiResponse<List<DoctorSnippetDto>> getAvailableDoctors(@PathVariable Long clinicId) {

        return ApiResponse.success("Doctors fetched successfully",
                clinicDoctorService.getAvailableDoctors(clinicId));
    }

    @GetMapping("/conditions")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN + "', '" + RoleUtils.DOCTOR
            + "') and (@securityService.isClinicManagerOf(#clinicId) or @securityService.isDoctorOfClinic(#clinicId))")
    public ApiResponse<List<String>> getConditions(@PathVariable Long clinicId) {

        return ApiResponse.success("Conditions fetched successfully", clinicDashboardService.getChronicConditions());
    }

    @GetMapping("/appointments")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    public ApiResponse<Page<com.project.dto.response.ClinicAppointmentResponse>> getAppointments(
            @PathVariable Long clinicId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.success("Appointments fetched",
                clinicDashboardService.getAppointmentRecords(clinicId, pageable));
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    public ApiResponse<Void> createAppointment(
            @PathVariable Long clinicId,
            @RequestBody com.project.dto.request.DoctorCreateAppointmentRequest request) {

        clinicDashboardService.createAppointment(clinicId, request);
        return ApiResponse.success("Appointment created successfully", null);
    }

    @PostMapping("/patients/{patientId}/notify")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    public ApiResponse<Void> notifyPatient(
            @PathVariable Long clinicId,
            @PathVariable Long patientId,
            @RequestBody Map<String, String> body) {

        clinicPatientService.sendNotificationToPatient(clinicId, patientId, body.get("message"));
        return ApiResponse.success("Notification sent", null);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    public ApiResponse<com.project.dto.response.ClinicResponse> getProfile(@PathVariable Long clinicId) {

        return ApiResponse.success("Clinic profile fetched", clinicDashboardService.getClinicDetails(clinicId));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    public ApiResponse<Void> updateProfile(@PathVariable Long clinicId,
            @Valid @RequestBody com.project.dto.request.UpdateClinicRequest request) {

        clinicDashboardService.updateClinicDetails(clinicId, request);
        return ApiResponse.success("Clinic profile updated", null);
    }

    @PatchMapping("/appointments/{appointmentId}/status")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN
            + "') and @securityService.isClinicManagerOf(#clinicId)")
    public ApiResponse<Void> updateAppointmentStatus(
            @PathVariable Long clinicId,
            @PathVariable Long appointmentId,
            @RequestBody Map<String, String> body) {

        clinicDashboardService.updateAppointmentStatus(clinicId, appointmentId, body.get("status"));
        return ApiResponse.success("Appointment status updated", null);
    }

    @PostMapping("/patients/{patientId}/health-metrics")
    @PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN + "', '" + RoleUtils.DOCTOR
            + "') and (@securityService.isClinicManagerOf(#clinicId) or @securityService.isDoctorOfClinic(#clinicId))")
    @Operation(summary = "Record patient health metric", description = "Allows doctor or clinic manager to record measurements during visits")
    public ApiResponse<com.project.dto.response.HealthMetricResponse> recordPatientMetric(
            @PathVariable Long clinicId,
            @PathVariable Long patientId,
            @Valid @RequestBody com.project.dto.request.CreateHealthMetricRequest request) {

        com.project.dto.response.HealthMetricResponse response = patientHealthMetricService.recordMetricForPatient(patientId, request);
        return ApiResponse.success("Health metric recorded successfully", response);
    }
}
