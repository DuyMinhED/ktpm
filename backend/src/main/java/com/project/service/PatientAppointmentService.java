package com.project.service;

import com.project.dto.request.CreateAppointmentRequest;
import com.project.dto.response.PatientAppointmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PatientAppointmentService {

    PatientAppointmentResponse create(CreateAppointmentRequest request);

    List<PatientAppointmentResponse> getUpcoming();

    Page<PatientAppointmentResponse> getHistory(Pageable pageable);

    void cancel(Long id);
    
    List<com.project.dto.response.DoctorSimpleResponse> getAvailableDoctors();
    
    void toggleReminder(Long id, boolean enabled);
}
