package com.project.controller;

import com.project.dto.request.CreateHealthMetricRequest;
import com.project.dto.response.HealthMetricResponse;
import com.project.dto.response.HealthMetricSummaryResponse;
import com.project.service.PatientHealthMetricService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PatientHealthMetricControllerTest {

    private final PatientHealthMetricService service = mock(PatientHealthMetricService.class);
    private final PatientHealthMetricController controller = new PatientHealthMetricController(service);

    @Test
    void createReturnsCreatedAndWrappedMetric() {
        CreateHealthMetricRequest request = CreateHealthMetricRequest.builder()
                .metricType("BLOOD_SUGAR")
                .value(new BigDecimal("6.5"))
                .unit("mmol/L")
                .build();
        HealthMetricResponse metric = HealthMetricResponse.builder().id(1L).build();
        when(service.create(request)).thenReturn(metric);

        var response = controller.create(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertSame(metric, response.getBody().getData());
    }

    @Test
    void readEndpointsWrapServiceResponses() {
        List<HealthMetricSummaryResponse> summary = List.of(HealthMetricSummaryResponse.builder().build());
        List<HealthMetricResponse> chart = List.of(HealthMetricResponse.builder().id(1L).build());
        Page<HealthMetricResponse> history = new PageImpl<>(chart);
        PageRequest pageable = PageRequest.of(0, 10);
        when(service.getMetricsSummary("MONTH")).thenReturn(summary);
        when(service.getChartData("SPO2", "WEEK")).thenReturn(chart);
        when(service.getHistory(pageable)).thenReturn(history);

        assertSame(summary, controller.getSummary("MONTH").getBody().getData());
        assertSame(chart, controller.getChartData("SPO2", "WEEK").getBody().getData());
        assertSame(history, controller.getHistory(pageable).getBody().getData());
    }

    @Test
    void deleteDelegatesToService() {
        controller.delete(10L);

        verify(service).delete(10L);
    }
}
