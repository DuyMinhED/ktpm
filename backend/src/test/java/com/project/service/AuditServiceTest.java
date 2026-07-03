package com.project.service;

import com.project.entity.AuditLog;
import com.project.repository.AuditLogRepository;
import com.project.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AuditServiceTest {

    private final AuditLogRepository auditLogRepository = mock(AuditLogRepository.class);
    private final AuditService auditService = new AuditService(auditLogRepository);

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void recordActivity_withoutAuthenticationUsesSystemDefaultsAndLocalhost() {
        auditService.recordActivity("CREATE", "PATIENT", "Created patient", "success");

        AuditLog saved = captureSavedAuditLog();

        assertEquals(1L, saved.getUserId());
        assertEquals("Hệ thống", saved.getUserName());
        assertEquals("127.0.0.1", saved.getIpAddress());
        assertEquals("CREATE", saved.getAction());
        assertEquals("PATIENT", saved.getModule());
        assertEquals("Created patient", saved.getDetails());
        assertEquals("success", saved.getStatus());
    }

    @Test
    void recordActivity_usesAuthenticatedCustomUserAndForwardedIp() {
        CustomUserDetails principal = CustomUserDetails.builder()
                .id(9L)
                .fullName("Doctor A")
                .avatarUrl("avatar.png")
                .email("doctor@example.com")
                .authorities(List.of())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "203.0.113.10");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        auditService.recordActivity("UPDATE", "APPOINTMENT", "Updated appointment", "warning");

        AuditLog saved = captureSavedAuditLog();

        assertEquals(9L, saved.getUserId());
        assertEquals("Doctor A", saved.getUserName());
        assertEquals("avatar.png", saved.getUserAvatar());
        assertEquals("203.0.113.10", saved.getIpAddress());
    }

    @Test
    void recordActivity_fallsBackToRemoteAddrWhenForwardedHeaderUnknownAndNormalizesIpv6Loopback() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "unknown");
        request.setRemoteAddr("0:0:0:0:0:0:0:1");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        auditService.recordActivity("READ", "DASHBOARD", "Viewed dashboard", "success");

        assertEquals("127.0.0.1", captureSavedAuditLog().getIpAddress());
    }

    @Test
    void recordActivityWithExplicitUser_savesProvidedUserInfo() {
        auditService.recordActivity(11L, "Admin A", "DELETE", "USER", "Deleted user", "danger");

        AuditLog saved = captureSavedAuditLog();

        assertEquals(11L, saved.getUserId());
        assertEquals("Admin A", saved.getUserName());
        assertEquals("DELETE", saved.getAction());
        assertEquals("USER", saved.getModule());
        assertEquals("Deleted user", saved.getDetails());
        assertEquals("danger", saved.getStatus());
    }

    @Test
    void recordActivity_swallowsRepositoryExceptions() {
        doThrow(new RuntimeException("db down")).when(auditLogRepository).save(any(AuditLog.class));

        assertDoesNotThrow(() -> auditService.recordActivity("CREATE", "PATIENT", "Created", "success"));
        assertDoesNotThrow(() -> auditService.recordActivity(1L, "User", "CREATE", "PATIENT", "Created", "success"));
    }

    private AuditLog captureSavedAuditLog() {
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        return captor.getValue();
    }
}
