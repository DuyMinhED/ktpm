package com.project.controller;

import com.project.dto.request.CreateAppointmentRequest;
import com.project.dto.response.DoctorSimpleResponse;
import com.project.dto.response.PatientAppointmentResponse;
import com.project.service.PatientAppointmentService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PatientAppointmentControllerTest {

    private final PatientAppointmentService service = mock(PatientAppointmentService.class);
    private final PatientAppointmentController controller = new PatientAppointmentController(service);

    @Test
    void createReturnsCreatedAndWrappedAppointment() {
        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .doctorId(5L)
                .appointmentTime(LocalDateTime.now().plusHours(4))
                .appointmentType("ONLINE")
                .build();
        PatientAppointmentResponse appointment = PatientAppointmentResponse.builder().id(1L).build();
        when(service.create(request)).thenReturn(appointment);

        var response = controller.create(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertSame(appointment, response.getBody().getData());
    }

    @Test
    void readEndpointsWrapServiceResponses() {
        List<PatientAppointmentResponse> upcoming = List.of(PatientAppointmentResponse.builder().id(1L).build());
        Page<PatientAppointmentResponse> history = new PageImpl<>(upcoming);
        List<DoctorSimpleResponse> doctors = List.of(DoctorSimpleResponse.builder().id(2L).name("Dr").build());
        PageRequest pageable = PageRequest.of(0, 10);
        when(service.getUpcoming()).thenReturn(upcoming);
        when(service.getHistory(pageable)).thenReturn(history);
        when(service.getAvailableDoctors()).thenReturn(doctors);

        assertSame(upcoming, controller.getUpcoming().getBody().getData());
        assertSame(history, controller.getHistory(pageable).getBody().getData());
        assertSame(doctors, controller.getDoctors().getBody().getData());
    }

    @Test
    void cancelAndReminderDelegateToService() {
        controller.cancel(10L);
        controller.toggleReminder(11L, true);

        verify(service).cancel(10L);
        verify(service).toggleReminder(11L, true);
    }
}
