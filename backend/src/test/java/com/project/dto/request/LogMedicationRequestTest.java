package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LogMedicationRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void requiredFields_presentPassValidation() {
        LogMedicationRequest request = LogMedicationRequest.builder()
                .scheduleId(1L)
                .status("TAKEN")
                .notes("After breakfast")
                .build();

        assertTrue(validator.validate(request).isEmpty());
        assertEquals(1L, request.getScheduleId());
    }

    @Test
    void requiredFields_nullOrBlankFailValidation() {
        LogMedicationRequest request = LogMedicationRequest.builder()
                .scheduleId(null)
                .status("")
                .build();

        Set<ConstraintViolation<LogMedicationRequest>> violations = validator.validate(request);

        assertTrue(hasViolationOn(violations, "scheduleId"));
        assertTrue(hasViolationOn(violations, "status"));
    }

    @Test
    void unsupportedStatus_currentlyPassesDtoValidationDocumentingGap() {
        LogMedicationRequest request = LogMedicationRequest.builder()
                .scheduleId(1L)
                .status("INVALID_STATUS")
                .build();

        assertFalse(hasViolationOn(validator.validate(request), "status"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
