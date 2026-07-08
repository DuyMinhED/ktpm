package com.project.controller;

import com.project.dto.response.ApiResponse;
import com.project.dto.response.RiskAlertResponse;
import com.project.security.CustomUserDetails;
import com.project.service.RiskAlertService;
import com.project.util.RoleUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/clinics/{clinicId}/risk-alerts")
@RequiredArgsConstructor
@Tag(name = "Risk Alert Management", description = "APIs for clinic managers to monitor high-risk patients")
@PreAuthorize("hasAnyRole('" + RoleUtils.CLINIC_MANAGER + "', '" + RoleUtils.ADMIN + "')")
public class RiskAlertController {

    private final RiskAlertService riskAlertService;

    private void validateClinicAccess(Long pathClinicId) {
        CustomUserDetails user = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        if (RoleUtils.ADMIN.equals(user.getRole())) {
            return;
        }
        if (!user.getClinicId().equals(pathClinicId)) {
            throw new AccessDeniedException("You do not have permission to access data from this clinic");
        }
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get risk alert dashboard", description = "Returns high-risk patients and recent alerts summary")
    public ApiResponse<RiskAlertResponse> getDashboard(@PathVariable Long clinicId) {
        validateClinicAccess(clinicId);
        return ApiResponse.success("Risk dashboard fetched", riskAlertService.getRiskAlertDashboard(clinicId));
    }

    @GetMapping("/high-risk-patients")
    @Operation(summary = "Get all high-risk patients", description = "Returns paginated list of high-risk patients")
    public ApiResponse<Page<RiskAlertResponse.RiskPatientItem>> getHighRiskPatients(
            @PathVariable Long clinicId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        validateClinicAccess(clinicId);
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.success("High-risk patients fetched", riskAlertService.getHighRiskPatients(clinicId, pageable));
    }

    @PatchMapping("/alerts/{alertId}/read")
    @Operation(summary = "Mark alert as read")
    public ApiResponse<Void> markAsRead(@PathVariable Long clinicId, @PathVariable Long alertId) {
        validateClinicAccess(clinicId);
        riskAlertService.markAlertAsRead(alertId);
        return ApiResponse.success("Alert marked as read", null);
    }

    @PatchMapping("/alerts/{alertId}/dismiss")
    @Operation(summary = "Dismiss alert")
    public ApiResponse<Void> dismissAlert(@PathVariable Long clinicId, @PathVariable Long alertId) {
        validateClinicAccess(clinicId);
        riskAlertService.dismissAlert(alertId);
        return ApiResponse.success("Alert dismissed", null);
    }
}
