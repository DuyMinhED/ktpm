package com.project.controller;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // Use test profile if available, or remove if not needed
public class AdminControllerSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Value("${jwt.secret}")
    private String jwtSecret;

    // 1. Test không có Token (No Token)
    @Test
    void whenCallAdminApiWithoutToken_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // 2. Test Token giả mạo (Fake Token) - Chữ ký không hợp lệ
    @Test
    void whenCallAdminApiWithFakeToken_thenUnauthorized() throws Exception {
        String fakeSecret = "ThisIsAFakeSecretKeyThatIsVeryLongAndSecureForTestingPurposeOnly";
        SecretKey fakeKey = Keys.hmacShaKeyFor(fakeSecret.getBytes(StandardCharsets.UTF_8));
        
        String fakeToken = Jwts.builder()
                .setSubject("admin@example.com")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .claim("id", 1L)
                .signWith(fakeKey, SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + fakeToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // 3. Test Token hết hạn (Expired Token)
    @Test
    void whenCallAdminApiWithExpiredToken_thenUnauthorized() throws Exception {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        
        // Expiration date is in the past
        String expiredToken = Jwts.builder()
                .setSubject("admin@example.com")
                .setIssuedAt(new Date(System.currentTimeMillis() - 7200000)) // 2 hours ago
                .setExpiration(new Date(System.currentTimeMillis() - 3600000)) // 1 hour ago
                .claim("id", 1L)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + expiredToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // 4. Test Token sai định dạng (Malformed Token)
    @Test
    void whenCallAdminApiWithMalformedToken_thenUnauthorized() throws Exception {
        String malformedToken = "Bearer this.is.not.a.valid.jwt.token";

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", malformedToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // 5. Test bảo mật phân quyền (RBAC): Đóng giả làm Bệnh nhân (PATIENT) gọi API Admin
    @Test
    @org.springframework.security.test.context.support.WithMockUser(username = "patient@example.com", roles = {"PATIENT"})
    void whenPatientCallsAdminApi_thenForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden()); // 403 Forbidden (Có token nhưng sai quyền)
    }

    // 6. Test bảo mật phân quyền (RBAC): Đóng giả làm Bác sĩ (DOCTOR) gọi API Admin
    @Test
    @org.springframework.security.test.context.support.WithMockUser(username = "doctor@example.com", roles = {"DOCTOR"})
    void whenDoctorCallsAdminApi_thenForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

}
