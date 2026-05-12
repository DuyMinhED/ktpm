package com.project.service;

import com.project.dto.response.DoctorPatientDetailResponse;
import com.project.dto.response.DoctorPatientResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DoctorPatientService {
    Page<DoctorPatientResponse> getMyPatients(Long doctorUserId, String search, String condition, String riskLevel, Pageable pageable);
    long getTotalPatientCount(Long doctorUserId);
    long getHighRiskCount(Long doctorUserId);
    long getMonitoringCount(Long doctorUserId);
    DoctorPatientDetailResponse getPatientDetail(Long patientId);
    java.util.List<Double> getDailyMetricTrend(Long doctorUserId, com.project.entity.MetricType type, int days);
}
