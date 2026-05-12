package com.project.service;

import com.project.dto.request.CreateHealthMetricRequest;
import com.project.dto.response.HealthMetricResponse;
import com.project.dto.response.HealthMetricSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PatientHealthMetricService {

    HealthMetricResponse create(CreateHealthMetricRequest request);
    HealthMetricResponse recordMetricForPatient(Long patientId, CreateHealthMetricRequest request);

    List<HealthMetricSummaryResponse> getMetricsSummary(String period);

    List<HealthMetricResponse> getChartData(String metricType, String period);

    Page<HealthMetricResponse> getHistory(Pageable pageable);

    void delete(Long id);
}
