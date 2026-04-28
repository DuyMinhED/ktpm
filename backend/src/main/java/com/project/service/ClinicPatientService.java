package com.project.service;

import com.project.dto.request.CreatePatientRequest;
import com.project.dto.response.ClinicPatientResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClinicPatientService {
    Page<ClinicPatientResponse> getPatientRecords(Long clinicId, String keyword, String condition, String riskLevel,
                                                 String status, String doctor, Pageable pageable);

    void createPatient(Long clinicId, CreatePatientRequest request);

    void updatePatient(Long clinicId, Long patientId, CreatePatientRequest request);

    void deletePatient(Long clinicId, Long patientId);

    void sendNotificationToPatient(Long clinicId, Long patientId, String message);
}
