package com.project.controller;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.project.security.CustomUserDetails;
import com.project.security.CustomUserDetailsService;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ClinicDashboardSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    private String generateValidToken(String email, Long id) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .claim("id", id)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 1. Không có token -> 401 Unauthorized
    @Test
    void whenCallClinicApiWithoutToken_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/clinics/1/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // 2. Token giả mạo -> 401 Unauthorized
    @Test
    void whenCallClinicApiWithFakeToken_thenUnauthorized() throws Exception {
        String fakeSecret = "ThisIsAFakeSecretKeyThatIsVeryLongAndSecureForTestingPurposeOnly";
        SecretKey fakeKey = Keys.hmacShaKeyFor(fakeSecret.getBytes(StandardCharsets.UTF_8));
        
        String fakeToken = Jwts.builder()
                .setSubject("manager@clinic.com")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .claim("id", 1L)
                .signWith(fakeKey, SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/api/v1/clinics/1/dashboard")
                        .header("Authorization", "Bearer " + fakeToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // 3. Patient truy cập API của Clinic Manager -> 403 Forbidden
    @Test
    void whenPatientCallsClinicDashboard_thenForbidden() throws Exception {
        String email = "patient@example.com";
        String token = generateValidToken(email, 100L);

        CustomUserDetails patientDetails = CustomUserDetails.builder()
                .id(100L)
                .email(email)
                .role("PATIENT")
                .build();

        when(customUserDetailsService.loadUserByUsername(email)).thenReturn(patientDetails);

        mockMvc.perform(get("/api/v1/clinics/1/dashboard")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    // 4. Doctor truy cập Dashboard (chỉ dành cho CLINIC_MANAGER / ADMIN) -> 403 Forbidden
    @Test
    void whenDoctorCallsClinicDashboard_thenForbidden() throws Exception {
        String email = "doctor@example.com";
        String token = generateValidToken(email, 101L);

        CustomUserDetails doctorDetails = CustomUserDetails.builder()
                .id(101L)
                .email(email)
                .role("DOCTOR")
                .clinicId(1L) // Thuộc clinic 1 nhưng không phải manager
                .build();

        when(customUserDetailsService.loadUserByUsername(email)).thenReturn(doctorDetails);

        mockMvc.perform(get("/api/v1/clinics/1/dashboard")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    // 5. Clinic Manager truy cập Dashboard của Clinic KHÁC -> 403 Forbidden
    @Test
    void whenManagerCallsOtherClinicDashboard_thenForbidden() throws Exception {
        String email = "manager2@example.com";
        String token = generateValidToken(email, 102L);

        CustomUserDetails manager2Details = CustomUserDetails.builder()
                .id(102L)
                .email(email)
                .role("CLINIC_MANAGER")
                .clinicId(2L) // Manager của clinic 2
                .build();

        when(customUserDetailsService.loadUserByUsername(email)).thenReturn(manager2Details);

        // Cố gắng truy cập dashboard của clinic 1
        mockMvc.perform(get("/api/v1/clinics/1/dashboard")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    // 6. Admin truy cập Dashboard của bất kỳ Clinic nào -> 200 OK (hoặc ít nhất là qua được lớp Security filter và vào service, vì mock service không cấu hình nên có thể bị 404/500 nhưng chắc chắn không phải 401/403. Thực tế ta chỉ expect không bị 401/403).
    // Ta có thể bỏ qua việc test 200 ở đây vì `@SpringBootTest` sẽ gọi logic thực và tuỳ vào DB. Ta tập trung vào Security 401/403.
}
