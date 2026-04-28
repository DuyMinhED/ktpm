package com.project.service;

import com.project.dto.request.CreateClinicRequest;
import com.project.dto.request.UpdateClinicRequest;
import com.project.dto.response.AdminClinicResponse;
import com.project.dto.response.AdminClinicStatsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminClinicService {
    AdminClinicStatsResponse getClinicStats();
    Page<AdminClinicResponse> getClinics(String status, String keyword, Pageable pageable);
    AdminClinicResponse getClinicById(Long id);
    AdminClinicResponse createClinic(CreateClinicRequest request);
    AdminClinicResponse updateClinic(Long id, UpdateClinicRequest request);
    void toggleClinicStatus(Long id);
}
