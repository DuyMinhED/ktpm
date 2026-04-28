package com.project.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditAspect {

    private final com.project.service.AuditService auditService;

    @Around("@annotation(audit)")
    public Object logAudit(ProceedingJoinPoint joinPoint, Audit audit) throws Throwable {
        Object result;
        String status = "success";
        String details = "";

        try {
            result = joinPoint.proceed();
            details = "Action completed successfully";
        } catch (Throwable e) {
            status = "danger";
            details = "Error: " + e.getMessage();
            throw e;
        } finally {
            saveLog(audit, status, details);
        }

        return result;
    }

    private void saveLog(Audit audit, String status, String details) {
        try {
            auditService.recordActivity(audit.action(), audit.module(), details, status);
        } catch (Exception e) {
            log.error("Failed to trigger audit log", e);
        }
    }
}
