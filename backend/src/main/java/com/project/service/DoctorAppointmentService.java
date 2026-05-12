package com.project.service;

import com.project.dto.request.DoctorCreateAppointmentRequest;
import com.project.dto.response.DoctorAppointmentResponse;
import java.util.List;

public interface DoctorAppointmentService {
    List<DoctorAppointmentResponse> getUpcomingAppointments();
    List<DoctorAppointmentResponse> getAllAppointments();
    DoctorAppointmentResponse updateStatus(Long appointmentId, String status);
    DoctorAppointmentResponse createAppointment(DoctorCreateAppointmentRequest request);
    DoctorAppointmentResponse rescheduleAppointment(Long appointmentId, DoctorCreateAppointmentRequest request);
}
