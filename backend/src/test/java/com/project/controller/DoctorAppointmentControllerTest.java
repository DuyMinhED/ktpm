package com.project.controller;

import com.project.dto.request.DoctorCreateAppointmentRequest;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.DoctorAppointmentResponse;
import com.project.service.DoctorAppointmentService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DoctorAppointmentControllerTest {

    private final DoctorAppointmentService service = mock(DoctorAppointmentService.class);
    private final DoctorAppointmentController controller = new DoctorAppointmentController(service);

    @Test
    void listEndpointsWrapServiceResponses() {
        List<DoctorAppointmentResponse> upcoming = List.of(DoctorAppointmentResponse.builder().id(1L).build());
        List<DoctorAppointmentResponse> all = List.of(DoctorAppointmentResponse.builder().id(2L).build());
        when(service.getUpcomingAppointments()).thenReturn(upcoming);
        when(service.getAllAppointments()).thenReturn(all);

        assertSame(upcoming, controller.getUpcoming().getBody().getData());
        assertSame(all, controller.getAll().getBody().getData());
    }

    @Test
    void mutationEndpointsDelegateToService() {
        DoctorCreateAppointmentRequest request = DoctorCreateAppointmentRequest.builder()
                .patientId(3L)
                .appointmentDate("2026-07-03")
                .appointmentTime("09:00")
                .type("ONLINE")
                .build();
        DoctorAppointmentResponse response = DoctorAppointmentResponse.builder().id(8L).build();
        when(service.updateStatus(8L, "SCHEDULED", "meet", "notes")).thenReturn(response);
        when(service.createAppointment(request)).thenReturn(response);
        when(service.rescheduleAppointment(8L, request)).thenReturn(response);

        assertSame(response, controller.updateStatus(8L, "SCHEDULED", "meet", "notes").getBody().getData());
        assertSame(response, controller.createAppointment(request).getBody().getData());
        assertSame(response, controller.rescheduleAppointment(8L, request).getBody().getData());
    }

    @Test
    void batchRescheduleParsesDatesAndReturnsMovedCount() {
        when(service.batchReschedule(
                java.time.LocalDate.of(2026, 7, 3),
                java.time.LocalDate.of(2026, 7, 4)))
                .thenReturn(4);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.batchReschedule("2026-07-03", "2026-07-04");

        assertEquals(4, response.getBody().getData().get("movedCount"));
        verify(service).batchReschedule(
                java.time.LocalDate.of(2026, 7, 3),
                java.time.LocalDate.of(2026, 7, 4));
    }
}
