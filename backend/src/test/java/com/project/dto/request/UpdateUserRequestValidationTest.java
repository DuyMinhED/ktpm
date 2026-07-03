package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class UpdateUserRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void statusAllowsOnlyActiveOrInactive() {
        UpdateUserRequest request = new UpdateUserRequest();

        request.setStatus("ACTIVE");
        assertTrue(validator.validate(request).isEmpty());

        request.setStatus("INACTIVE");
        assertTrue(validator.validate(request).isEmpty());

        request.setStatus("active");
        assertTrue(hasViolationOn(validator.validate(request), "status"));

        request.setStatus("SUSPENDED");
        assertTrue(hasViolationOn(validator.validate(request), "status"));
    }

    @Test
    void statusLength31_failsValidation() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setStatus("A".repeat(31));

        Set<ConstraintViolation<UpdateUserRequest>> violations = validator.validate(request);

        assertTrue(hasViolationOn(violations, "status"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
