package com.project.controller;

import com.project.dto.response.ApiResponse;
import com.project.dto.response.DoctorDashboardResponse;
import com.project.service.DoctorDashboardService;
import com.project.util.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

class DashboardControllerTest {

    private final DoctorDashboardService dashboardService = mock(DoctorDashboardService.class);
    private final DashboardController controller = new DashboardController(dashboardService);

    @Test
    void getDashboardUsesCurrentUserId() {
        DoctorDashboardResponse dashboard = DoctorDashboardResponse.builder().build();
        when(dashboardService.getDashboardData(7L)).thenReturn(dashboard);

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            ApiResponse<DoctorDashboardResponse> response = controller.getDashboard();

            assertTrue(response.isSuccess());
            assertSame(dashboard, response.getData());
        }
    }

    @Test
    void getDashboardThrowsWhenUserMissing() {
        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.empty());

            assertThrows(java.util.NoSuchElementException.class, controller::getDashboard);
        }
    }
}
