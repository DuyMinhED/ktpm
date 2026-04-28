package com.project.service;

import com.project.dto.response.AdminDashboardResponse;
import com.project.dto.response.AdminReportsResponse;
import com.project.dto.response.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminDashboardService {
    AdminDashboardResponse getDashboardData(String timeRange, String metric);
    AdminReportsResponse getReportsData(String reportType, String performanceFilter);
    Page<AuditLogResponse> getAuditLogs(String userName, String module, String keyword, Pageable pageable);
}
