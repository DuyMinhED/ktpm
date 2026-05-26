package com.project.service;

import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.DoctorResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DoctorService {
    Page<DoctorResponse> getDoctors(String specialty, String keyword, Pageable pageable);
    DoctorResponse getDoctorById(Long id);
    DoctorResponse createDoctor(CreateDoctorRequest request);
    DoctorResponse updateDoctor(Long id, CreateDoctorRequest request);
    void deleteDoctor(Long id);
}
