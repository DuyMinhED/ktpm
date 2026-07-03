package com.project.controller;

import com.project.dto.response.AdminMedicalServiceStatsResponse;
import com.project.dto.response.ApiResponse;
import com.project.entity.MedicalService;
import com.project.service.MedicalServiceService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MedicalServiceControllerTest {

    private final MedicalServiceService service = mock(MedicalServiceService.class);
    private final MedicalServiceController controller = new MedicalServiceController(service);

    @Test
    void getAllAndGetById_returnWrappedServiceResults() {
        MedicalService medicalService = serviceEntity(1L);
        List<MedicalService> services = List.of(medicalService);
        when(service.getAllServices(10L)).thenReturn(services);
        when(service.getServiceById(1L)).thenReturn(medicalService);

        ResponseEntity<ApiResponse<List<MedicalService>>> all = controller.getAllServices(10L);
        ResponseEntity<ApiResponse<MedicalService>> byId = controller.getServiceById(1L);

        assertSame(services, all.getBody().getData());
        assertSame(medicalService, byId.getBody().getData());
    }

    @Test
    void createUpdateToggleAndDelete_delegateToService() {
        MedicalService request = serviceEntity(null);
        MedicalService saved = serviceEntity(2L);
        when(service.createService(request)).thenReturn(saved);
        when(service.updateService(2L, request)).thenReturn(saved);
        when(service.toggleStatus(2L)).thenReturn(saved);

        assertSame(saved, controller.createService(request).getBody().getData());
        assertSame(saved, controller.updateService(2L, request).getBody().getData());
        assertSame(saved, controller.toggleStatus(2L).getBody().getData());

        ResponseEntity<ApiResponse<String>> delete = controller.deleteService(2L);
        assertEquals(HttpStatus.OK, delete.getStatusCode());
        assertTrue(delete.getBody().isSuccess());
        verify(service).deleteService(2L);
    }

    @Test
    void getServiceStats_returnsWrappedStats() {
        AdminMedicalServiceStatsResponse stats = AdminMedicalServiceStatsResponse.builder()
                .totalServices(10)
                .activeServices(8)
                .totalEstimatedValue(1000)
                .newRegistrations(2)
                .registrationGrowth("+10%")
                .build();
        when(service.getServiceStats()).thenReturn(stats);

        ResponseEntity<ApiResponse<AdminMedicalServiceStatsResponse>> response = controller.getServiceStats();

        assertSame(stats, response.getBody().getData());
    }

    private static MedicalService serviceEntity(Long id) {
        return MedicalService.builder()
                .id(id)
                .name("Blood test")
                .category("Lab")
                .price(new BigDecimal("100.00"))
                .duration("30m")
                .status("ACTIVE")
                .clinicId(10L)
                .build();
    }
}
