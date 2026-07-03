package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DoctorCreateAppointmentRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void validRequiredFields_passValidation() {
        DoctorCreateAppointmentRequest request = DoctorCreateAppointmentRequest.builder()
                .patientId(1L)
                .appointmentDate("2026-07-03")
                .appointmentTime("09:30")
                .type("OFFLINE")
                .notes("Follow up")
                .build();

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void nullOrBlankRequiredFields_failValidation() {
        DoctorCreateAppointmentRequest request = DoctorCreateAppointmentRequest.builder()
                .patientId(null)
                .appointmentDate("")
                .appointmentTime(" ")
                .type(null)
                .build();

        Set<ConstraintViolation<DoctorCreateAppointmentRequest>> violations = validator.validate(request);

        assertTrue(hasViolationOn(violations, "patientId"));
        assertTrue(hasViolationOn(violations, "appointmentDate"));
        assertTrue(hasViolationOn(violations, "appointmentTime"));
        assertTrue(hasViolationOn(violations, "type"));
    }

    @Test
    void malformedDateTimeAndUnknownType_currentlyPassDtoValidationDocumentingGap() {
        DoctorCreateAppointmentRequest request = DoctorCreateAppointmentRequest.builder()
                .patientId(1L)
                .appointmentDate("03/07/2026")
                .appointmentTime("25:99")
                .type("UNKNOWN")
                .build();

        Set<ConstraintViolation<DoctorCreateAppointmentRequest>> violations = validator.validate(request);

        assertFalse(hasViolationOn(violations, "appointmentDate"));
        assertFalse(hasViolationOn(violations, "appointmentTime"));
        assertFalse(hasViolationOn(violations, "type"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
