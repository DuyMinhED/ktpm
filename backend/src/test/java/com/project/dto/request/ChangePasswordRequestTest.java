package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ChangePasswordRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private ChangePasswordRequest validRequest() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("Current123");
        request.setNewPassword("NewPass123");
        return request;
    }

    @Test
    void newPasswordBoundaryValues_matchSizeMinMax() {
        ChangePasswordRequest request = validRequest();

        request.setNewPassword("a".repeat(7));
        assertTrue(hasViolationOn(validator.validate(request), "newPassword"));

        request.setNewPassword("a".repeat(8));
        assertTrue(validator.validate(request).isEmpty());

        request.setNewPassword("a".repeat(9));
        assertTrue(validator.validate(request).isEmpty());

        request.setNewPassword("a".repeat(99));
        assertTrue(validator.validate(request).isEmpty());

        request.setNewPassword("a".repeat(100));
        assertTrue(validator.validate(request).isEmpty());

        request.setNewPassword("a".repeat(101));
        assertTrue(hasViolationOn(validator.validate(request), "newPassword"));
    }

    @Test
    void blankCurrentOrNewPassword_failsValidation() {
        ChangePasswordRequest request = validRequest();
        request.setCurrentPassword("");
        assertTrue(hasViolationOn(validator.validate(request), "currentPassword"));

        request = validRequest();
        request.setNewPassword("");
        assertTrue(hasViolationOn(validator.validate(request), "newPassword"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
