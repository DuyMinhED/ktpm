package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CreateUserRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private CreateUserRequest validRequest() {
        CreateUserRequest request = new CreateUserRequest();
        request.setFullName("Nguyen Van A");
        request.setEmail("test@example.com");
        request.setPassword("P@ssw123");
        request.setPhone("0123456789");
        request.setRole("PATIENT");
        return request;
    }

    @Test
    void passwordLength7_failsValidation() {
        CreateUserRequest request = validRequest();
        request.setPassword("P@ssw12");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);

        assertTrue(hasViolationOn(violations, "password"));
    }

    @Test
    void passwordLength8_passesValidation() {
        CreateUserRequest request = validRequest();
        request.setPassword("P@ssw123");

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void passwordLength9_passesValidation() {
        CreateUserRequest request = validRequest();
        request.setPassword("P@ssw1234");

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void blankPassword_failsValidation() {
        CreateUserRequest request = validRequest();
        request.setPassword("");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);

        assertTrue(hasViolationOn(violations, "password"));
    }

    @Test
    void emailLength99_passesValidation() {
        CreateUserRequest request = validRequest();
        request.setEmail("a".repeat(60) + "@" + "b".repeat(34) + ".com");

        assertEquals(99, request.getEmail().length());
        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void emailLength100_passesValidation() {
        CreateUserRequest request = validRequest();
        request.setEmail("a".repeat(60) + "@" + "b".repeat(35) + ".com");

        assertEquals(100, request.getEmail().length());
        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void emailLength101_failsValidation() {
        CreateUserRequest request = validRequest();
        request.setEmail("a".repeat(60) + "@" + "b".repeat(36) + ".com");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);

        assertEquals(101, request.getEmail().length());
        assertTrue(hasViolationOn(violations, "email"));
    }

    @Test
    void invalidEmailFormat_failsValidation() {
        CreateUserRequest request = validRequest();
        request.setEmail("abc.example.com");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);

        assertTrue(hasViolationOn(violations, "email"));
    }

    @Test
    void fullNameBoundaries_matchDtoSizeRule() {
        CreateUserRequest request = validRequest();

        request.setFullName("n".repeat(99));
        assertTrue(validator.validate(request).isEmpty());

        request.setFullName("n".repeat(100));
        assertTrue(validator.validate(request).isEmpty());

        request.setFullName("n".repeat(101));
        assertTrue(hasViolationOn(validator.validate(request), "fullName"));
    }

    @Test
    void phoneBoundaries_matchDtoSizeRule() {
        CreateUserRequest request = validRequest();

        request.setPhone("0".repeat(19));
        assertTrue(validator.validate(request).isEmpty());

        request.setPhone("0".repeat(20));
        assertTrue(validator.validate(request).isEmpty());

        request.setPhone("0".repeat(21));
        assertTrue(hasViolationOn(validator.validate(request), "phone"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
