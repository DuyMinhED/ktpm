package com.project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.beans.factory.annotation.Value;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableAsync
@org.springframework.cache.annotation.EnableCaching
@Slf4j
public class BackendApplication {

    @Value("${app.admin.default-password:#{null}}")
    private String adminDefaultPassword;

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initSchema(JdbcTemplate jdbcTemplate) {
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        return args -> {
            try {
                String email = "admin@care.com";
                String password = (adminDefaultPassword != null && !adminDefaultPassword.isBlank())
                        ? adminDefaultPassword
                        : "password";
                String hashedPwd = passwordEncoder.encode(password);
                
                log.info("Checking data for user: {}", email);
                
                // Check if admin exists — only seed if missing, never overwrite existing password
                Integer adminCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
                if (adminCount == null || adminCount == 0) {
                    log.info("Admin user not found. Seeding system admin...");
                    jdbcTemplate.update("INSERT INTO users (email, password, role, full_name, status, created_at, is_deleted) VALUES (?, ?, 'ADMIN', 'System Admin', 'ACTIVE', NOW(), false)", 
                        email, hashedPwd);
                } else {
                    log.info("Admin user already exists. Skipping password update.");
                }

                // Check if patient exists
                Integer patientCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM patients", Integer.class);
                if (patientCount == null || patientCount == 0) {
                    log.info("No patients found. Seeding a mock patient for development...");
                    String patientEmail = "mock@patient.com";
                    String patientHashedPwd = passwordEncoder.encode(password);
                    
                    jdbcTemplate.update("INSERT INTO users (email, password, role, full_name, status, created_at, is_deleted) VALUES (?, ?, 'PATIENT', 'Bệnh nhân Test', 'ACTIVE', NOW(), false)",
                        patientEmail, patientHashedPwd);
                        
                    Long userId = jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ? LIMIT 1", Long.class, patientEmail);
                    jdbcTemplate.update("INSERT INTO patients (user_id, full_name, phone, gender, created_at, is_deleted) VALUES (?, 'Bệnh nhân Test', '0123456789', 'MALE', NOW(), false)",
                        userId);
                    log.info("Mock data seeded successfully.");
                } else {
                    log.info("Database has {} patients. Skipping mock seed.", patientCount);
                }
            } catch (Exception e) {
                log.error("Auto-seeder failed: {}", e.getMessage(), e);
            }
        };
    }
}

