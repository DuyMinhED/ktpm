package com.project.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter for login endpoint.
 * Limits each IP to max 10 login attempts per 60 seconds.
 * In production, replace with Redis-based solution.
 */
@Component
@Order(1)
@Slf4j
public class RateLimitFilter implements Filter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 60_000; // 60 seconds

    private final Map<String, RateInfo> rateLimitMap = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpReq = (HttpServletRequest) request;
        String path = httpReq.getRequestURI();

        // Only rate-limit login endpoint
        if (path.contains("/api/v1/auth/login") && "POST".equalsIgnoreCase(httpReq.getMethod())) {
            String clientIp = getClientIp(httpReq);
            RateInfo info = rateLimitMap.compute(clientIp, (ip, existing) -> {
                long now = System.currentTimeMillis();
                if (existing == null || (now - existing.windowStart) > WINDOW_MS) {
                    return new RateInfo(now, new AtomicInteger(1));
                }
                existing.count.incrementAndGet();
                return existing;
            });

            if (info.count.get() > MAX_ATTEMPTS) {
                log.warn("Rate limit exceeded for IP: {} on login endpoint", clientIp);
                HttpServletResponse httpRes = (HttpServletResponse) response;
                httpRes.setStatus(429);
                httpRes.setContentType("application/json;charset=UTF-8");
                httpRes.getWriter().write("{\"success\":false,\"message\":\"Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 1 phút.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateInfo {
        final long windowStart;
        final AtomicInteger count;

        RateInfo(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
