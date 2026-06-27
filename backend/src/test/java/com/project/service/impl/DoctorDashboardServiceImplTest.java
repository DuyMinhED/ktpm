package com.project.service.impl;

import com.project.dto.response.DoctorDashboardResponse;
import com.project.dto.response.DoctorPatientResponse;
import com.project.entity.Appointment;
import com.project.entity.AppointmentStatus;
import com.project.entity.Patient;
import com.project.repository.AppointmentRepository;
import com.project.repository.MessageRepository;
import com.project.service.ClinicalAnalyticsService;
import com.project.service.DoctorPatientService;
import com.project.util.AppConstants;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DoctorDashboardServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private DoctorPatientService doctorPatientService;
    @Mock
    private ClinicalAnalyticsService clinicalAnalyticsService;

    @InjectMocks
    private DoctorDashboardServiceImpl doctorDashboardService;

    @Test
    void getDashboardData_success() {
        Long doctorId = 1L;

        // Stub stats futures
        when(doctorPatientService.getTotalPatientCount(doctorId)).thenReturn(10L);
        when(doctorPatientService.getHighRiskCount(doctorId)).thenReturn(2L);
        when(appointmentRepository.countByDoctorIdAndStatusInAndAppointmentTimeAfter(
                eq(doctorId), any(), any(LocalDateTime.class))).thenReturn(3L);
        when(messageRepository.countByConversationDoctorIdAndIsReadFalseAndSenderIdNot(doctorId, doctorId)).thenReturn(5L);

        // Stub lists futures
        Patient patient = Patient.builder().id(2L).fullName("Jane Doe").build();
        Appointment appointment = Appointment.builder().id(100L).patient(patient).appointmentTime(LocalDateTime.now().plusDays(1)).status(AppointmentStatus.SCHEDULED).build();

        when(appointmentRepository.findUpcomingAppointments(eq(doctorId), any(LocalDateTime.class), eq(PageRequest.of(0, 5))))
                .thenReturn(List.of(appointment));

        DoctorPatientResponse patientResponse = DoctorPatientResponse.builder().id(2L).fullName("Jane Doe").build();
        when(doctorPatientService.getMyPatients(doctorId, null, null, null, PageRequest.of(0, 5)))
                .thenReturn(new PageImpl<>(List.of(patientResponse)));
        when(doctorPatientService.getMyPatients(doctorId, null, null, AppConstants.RISK_HIGH, PageRequest.of(0, 5)))
                .thenReturn(new PageImpl<>(List.of(patientResponse)));

        when(clinicalAnalyticsService.getDoctorInsights(doctorId)).thenReturn(List.of("Insight 1", "Insight 2"));

        DoctorDashboardResponse response = doctorDashboardService.getDashboardData(doctorId);

        assertNotNull(response);
        assertEquals(10L, response.getStats().getTotalPatients());
        assertEquals(2L, response.getStats().getHighRiskCount());
        assertEquals(3L, response.getStats().getPendingAppointmentsCount());
        assertEquals(5L, response.getStats().getUnreadMessagesCount());
        assertEquals(1, response.getUpcomingAppointments().size());
        assertEquals("Jane Doe", response.getUpcomingAppointments().get(0).getPatientName());
        assertEquals(1, response.getRecentPatients().size());
        assertEquals(1, response.getHighRiskPatients().size());
        assertEquals(2, response.getInsights().size());
    }
}
