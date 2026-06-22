package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class UpdatePatientProfileRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void validate_success() {
        UpdatePatientProfileRequest request = UpdatePatientProfileRequest.builder()
                .fullName("John Doe")
                .phone("0123456789")
                .email("john@example.com")
                .build();

        Set<ConstraintViolation<UpdatePatientProfileRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }

    @Test
    void validate_blankFullName() {
        UpdatePatientProfileRequest request = UpdatePatientProfileRequest.builder()
                .fullName("")
                .phone("0123456789")
                .email("john@example.com")
                .build();

        Set<ConstraintViolation<UpdatePatientProfileRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Full name is required")));
    }

    @Test
    void validate_invalidEmail() {
        UpdatePatientProfileRequest request = UpdatePatientProfileRequest.builder()
                .fullName("John Doe")
                .phone("0123456789")
                .email("invalid-email")
                .build();

        Set<ConstraintViolation<UpdatePatientProfileRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Invalid email address")));
    }

    @Test
    void validate_invalidPhonePattern() {
        UpdatePatientProfileRequest request = UpdatePatientProfileRequest.builder()
                .fullName("John Doe")
                .phone("123") // Invalid phone number pattern
                .email("john@example.com")
                .build();

        Set<ConstraintViolation<UpdatePatientProfileRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Invalid phone number")));
    }
}
