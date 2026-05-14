package com.project.service;

import com.project.entity.AuditLog;
import com.project.repository.AuditLogRepository;
import com.project.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordActivity(String action, String module, String details, String status) {
        try {
            Long userId = 1L;
            String userName = "Hệ thống";
            String userAvatar = null;

            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof CustomUserDetails user) {
                    userId = user.getId();
                    userName = user.getFullName();
                    userAvatar = user.getAvatarUrl();
                }
            } catch (Exception ignored) {}

            String ipAddress = "127.0.0.1";
            try {
                ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attributes != null) {
                    HttpServletRequest request = attributes.getRequest();
                    ipAddress = request.getHeader("X-Forwarded-For");
                    if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                        ipAddress = request.getRemoteAddr();
                    }
                }
            } catch (Exception ignored) {}

            // Convert IPv6 loopback to conventional v4 label if it occurs on local testing
            if ("0:0:0:0:0:0:0:1".equals(ipAddress)) {
                ipAddress = "127.0.0.1";
            }

            auditLogRepository.save(Objects.requireNonNull(AuditLog.builder()
                    .userId(userId)
                    .userName(userName)
                    .userAvatar(userAvatar)
                    .action(action)
                    .module(module)
                    .details(details)
                    .ipAddress(ipAddress)
                    .status(status)
                    .build()));
        } catch (Exception e) {
            log.error("Failed to record audit activity: {}", e.getMessage());
        }
    }

    /**
     * Version that accepts explicit user info
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordActivity(Long userId, String userName, String action, String module, String details, String status) {
        try {
            String ipAddress = "127.0.0.1";
            try {
                ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attributes != null) {
                    HttpServletRequest request = attributes.getRequest();
                    ipAddress = request.getHeader("X-Forwarded-For");
                    if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                        ipAddress = request.getRemoteAddr();
                    }
                }
            } catch (Exception ignored) {}

            if ("0:0:0:0:0:0:0:1".equals(ipAddress)) {
                ipAddress = "127.0.0.1";
            }

            auditLogRepository.save(Objects.requireNonNull(AuditLog.builder()
                    .userId(userId)
                    .userName(userName)
                    .action(action)
                    .module(module)
                    .details(details)
                    .ipAddress(ipAddress)
                    .status(status)
                    .build()));
        } catch (Exception e) {
            log.error("Failed to record audit activity: {}", e.getMessage());
        }
    }
}
