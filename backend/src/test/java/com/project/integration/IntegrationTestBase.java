package com.project.integration;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlConfig;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@SqlConfig(errorMode = SqlConfig.ErrorMode.CONTINUE_ON_ERROR)
@Sql(scripts = "/integration/cleanup-integration.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Sql(scripts = "/integration/seed-integration.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Sql(scripts = "/integration/cleanup-integration.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
public abstract class IntegrationTestBase {

    protected static final String PASSWORD = "admin123";
    protected static final String ADMIN_EMAIL = "admin@care.com";
    protected static final String MANAGER_EMAIL = "manager@care.com";
    protected static final String DOCTOR_EMAIL = "mai.le@care.com";
    protected static final String PATIENT_EMAIL = "truongquocan@patient.com";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected AuthTestClient authTestClient;

    @Value("${jwt.secret}")
    private String jwtSecret;

    protected String adminToken;
    protected String managerToken;
    protected String doctorToken;
    protected String patientToken;

    @BeforeEach
    void createSeedUserTokens() {
        adminToken = bearerToken(ADMIN_EMAIL, 1L);
        managerToken = bearerToken(MANAGER_EMAIL, 2L);
        doctorToken = bearerToken(DOCTOR_EMAIL, 4L);
        patientToken = bearerToken(PATIENT_EMAIL, 7L);
    }

    private String bearerToken(String email, Long userId) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86_400_000))
                .claim("id", userId)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        return "Bearer " + token;
    }
}
