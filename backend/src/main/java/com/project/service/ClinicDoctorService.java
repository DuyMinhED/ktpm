package com.project.service;

import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.ClinicDoctorResponse;
import com.project.dto.response.DoctorSnippetDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ClinicDoctorService {
    Page<ClinicDoctorResponse> getDoctorRecords(Long clinicId, String keyword, String status, String specialty, 
                                               String degree, String experience, Pageable pageable);

    void createDoctor(Long clinicId, CreateDoctorRequest request);

    void updateDoctor(Long clinicId, Long doctorId, CreateDoctorRequest request);

    void deleteDoctor(Long clinicId, Long doctorId);

    List<String> getDoctorNames(Long clinicId);

    List<DoctorSnippetDto> getAvailableDoctors(Long clinicId);
}
