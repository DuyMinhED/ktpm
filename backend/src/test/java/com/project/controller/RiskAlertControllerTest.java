package com.project.controller;

import com.project.dto.response.ApiResponse;
import com.project.dto.response.RiskAlertResponse;
import com.project.security.CustomUserDetails;
import com.project.service.RiskAlertService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RiskAlertControllerTest {

    private final RiskAlertService riskAlertService = mock(RiskAlertService.class);
    private final RiskAlertController controller = new RiskAlertController(riskAlertService);

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getDashboard_allowsAdminForAnyClinic() {
        authenticate("ADMIN", null);
        RiskAlertResponse dashboard = RiskAlertResponse.builder().build();
        when(riskAlertService.getRiskAlertDashboard(99L)).thenReturn(dashboard);

        ApiResponse<RiskAlertResponse> response = controller.getDashboard(99L);

        assertTrue(response.isSuccess());
        assertSame(dashboard, response.getData());
    }

    @Test
    void getHighRiskPatients_allowsClinicManagerForOwnClinic() {
        authenticate("CLINIC_MANAGER", 10L);
        Page<RiskAlertResponse.RiskPatientItem> page = new PageImpl<>(List.of());
        when(riskAlertService.getHighRiskPatients(eq(10L), any())).thenReturn(page);

        ApiResponse<Page<RiskAlertResponse.RiskPatientItem>> response = controller.getHighRiskPatients(10L, 2, 5);

        assertSame(page, response.getData());
        verify(riskAlertService).getHighRiskPatients(eq(10L), any());
    }

    @Test
    void markAndDismiss_delegateToServiceAfterAccessCheck() {
        authenticate("CLINIC_MANAGER", 10L);

        ApiResponse<Void> read = controller.markAsRead(10L, 50L);
        ApiResponse<Void> dismiss = controller.dismissAlert(10L, 51L);

        assertTrue(read.isSuccess());
        assertTrue(dismiss.isSuccess());
        verify(riskAlertService).markAlertAsRead(50L);
        verify(riskAlertService).dismissAlert(51L);
    }

    @Test
    void clinicManagerCannotAccessAnotherClinic() {
        authenticate("CLINIC_MANAGER", 10L);

        assertThrows(AccessDeniedException.class, () -> controller.getDashboard(11L));
    }

    @Test
    void nullClinicOnPrincipalFailsAccessCheckForManager() {
        authenticate("CLINIC_MANAGER", null);

        assertThrows(NullPointerException.class, () -> controller.getDashboard(11L));
    }

    private static void authenticate(String role, Long clinicId) {
        CustomUserDetails principal = CustomUserDetails.builder()
                .id(7L)
                .role(role)
                .clinicId(clinicId)
                .authorities(List.of())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
