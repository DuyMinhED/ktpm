package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class CreatePatientRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void validate_success() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("Nguyen Van A");
        request.setGender("MALE");
        request.setPhone("0987654321");

        Set<ConstraintViolation<CreatePatientRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }

    @Test
    void validate_blankName() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setName(""); // Blank name violates @NotBlank
        request.setGender("MALE");
        request.setPhone("0987654321");

        Set<ConstraintViolation<CreatePatientRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Tên bệnh nhân không được để trống")));
    }

    @Test
    void validate_blankGender() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("Nguyen Van A");
        request.setGender(""); // Blank gender violates @NotBlank
        request.setPhone("0987654321");

        Set<ConstraintViolation<CreatePatientRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Giới tính không được để trống")));
    }

    @Test
    void validate_blankPhone() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("Nguyen Van A");
        request.setGender("MALE");
        request.setPhone("   "); // Blank/space phone violates @NotBlank

        Set<ConstraintViolation<CreatePatientRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Số điện thoại không được để trống")));
    }

    @Test
    void validate_nameTooLong() {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setName("a".repeat(101)); // Exceeds @Size(max=100)
        request.setGender("MALE");
        request.setPhone("0987654321");

        Set<ConstraintViolation<CreatePatientRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Tên không được vượt quá 100 ký tự")));
    }
}
