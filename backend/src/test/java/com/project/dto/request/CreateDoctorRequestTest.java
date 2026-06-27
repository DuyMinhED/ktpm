package com.project.dto.request;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

public class CreateDoctorRequestTest {
    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private CreateDoctorRequest createValidRequest() {
        CreateDoctorRequest request = new CreateDoctorRequest();
        request.setName("Dr. John Smith");
        request.setEmail("doctor@example.com");
        request.setPhone("0123456789");
        request.setSpecialty("Cardiology");
        request.setLicenseNumber("12345-CCHN");
        request.setPassword("securePassword123");
        return request;
    }

    @Test
    void validate_success() {
        CreateDoctorRequest request = createValidRequest();
        Set<ConstraintViolation<CreateDoctorRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }

    @Test
    void validate_blankName() {
        CreateDoctorRequest request = createValidRequest();
        request.setName("   ");
        Set<ConstraintViolation<CreateDoctorRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> "name".equals(v.getPropertyPath().toString())));
    }

    @Test
    void validate_blankEmail() {
        CreateDoctorRequest request = createValidRequest();
        request.setEmail("");
        Set<ConstraintViolation<CreateDoctorRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> "email".equals(v.getPropertyPath().toString())));
    }

    @Test
    void validate_invalidEmail() {
        CreateDoctorRequest request = createValidRequest();
        request.setEmail("invalid-email-format");
        Set<ConstraintViolation<CreateDoctorRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> "email".equals(v.getPropertyPath().toString())));
    }

    @Test
    void validate_blankPhone() {
        CreateDoctorRequest request = createValidRequest();
        request.setPhone("");
        Set<ConstraintViolation<CreateDoctorRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> "phone".equals(v.getPropertyPath().toString())));
    }

    @Test
    void validate_blankSpecialty() {
        CreateDoctorRequest request = createValidRequest();
        request.setSpecialty("   ");
        Set<ConstraintViolation<CreateDoctorRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> "specialty".equals(v.getPropertyPath().toString())));
    }

    @Test
    void validate_blankLicenseNumber() {
        CreateDoctorRequest request = createValidRequest();
        request.setLicenseNumber("");
        Set<ConstraintViolation<CreateDoctorRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> "licenseNumber".equals(v.getPropertyPath().toString())));
    }
}
