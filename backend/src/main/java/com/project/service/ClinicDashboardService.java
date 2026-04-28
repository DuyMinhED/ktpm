package com.project.service;

import com.project.dto.response.ClinicDashboardResponse;
import java.util.List;

public interface ClinicDashboardService {
        ClinicDashboardResponse getDashboardData(Long clinicId, String period);

        List<String> getChronicConditions();

        org.springframework.data.domain.Page<com.project.dto.response.ClinicAppointmentResponse> getAppointmentRecords(
                        Long clinicId, org.springframework.data.domain.Pageable pageable);

        com.project.dto.response.ClinicResponse getClinicDetails(Long clinicId);

        void updateClinicDetails(Long clinicId, com.project.dto.request.UpdateClinicRequest request);

        void updateAppointmentStatus(Long clinicId, Long appointmentId, String status);
}
