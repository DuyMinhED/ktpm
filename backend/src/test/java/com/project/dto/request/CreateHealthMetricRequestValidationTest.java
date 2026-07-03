package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CreateHealthMetricRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private CreateHealthMetricRequest validRequest() {
        return CreateHealthMetricRequest.builder()
                .metricType("BLOOD_SUGAR")
                .value(new BigDecimal("5.5"))
                .unit("mmol/L")
                .build();
    }

    @Test
    void requiredFieldsNullOrBlank_failValidation() {
        CreateHealthMetricRequest request = validRequest();
        request.setMetricType(null);
        assertTrue(hasViolationOn(validator.validate(request), "metricType"));

        request = validRequest();
        request.setValue(null);
        assertTrue(hasViolationOn(validator.validate(request), "value"));

        request = validRequest();
        request.setUnit("");
        assertTrue(hasViolationOn(validator.validate(request), "unit"));
    }

    @Test
    void unknownMetricType_documentsCurrentDtoValidationGap() {
        CreateHealthMetricRequest request = validRequest();
        request.setMetricType("UNKNOWN");

        Set<ConstraintViolation<CreateHealthMetricRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(),
                "DTO only requires metricType to be non-null; supported enum validation happens later in service logic");
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
