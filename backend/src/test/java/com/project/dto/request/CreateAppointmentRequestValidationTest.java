package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CreateAppointmentRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private CreateAppointmentRequest validRequest() {
        return CreateAppointmentRequest.builder()
                .doctorId(1L)
                .appointmentTime(LocalDateTime.now().plusDays(1))
                .appointmentType("IN_PERSON")
                .build();
    }

    @Test
    void requiredFieldsNullOrBlank_failValidation() {
        CreateAppointmentRequest request = validRequest();
        request.setDoctorId(null);
        assertTrue(hasViolationOn(validator.validate(request), "doctorId"));

        request = validRequest();
        request.setAppointmentTime(null);
        assertTrue(hasViolationOn(validator.validate(request), "appointmentTime"));

        request = validRequest();
        request.setAppointmentType("");
        assertTrue(hasViolationOn(validator.validate(request), "appointmentType"));
    }

    @Test
    void validRequiredFields_passValidation() {
        assertTrue(validator.validate(validRequest()).isEmpty());
    }

    @Test
    void pastAppointmentTime_failValidation() {
        CreateAppointmentRequest request = validRequest();
        request.setAppointmentTime(LocalDateTime.now().minusMinutes(1));

        assertTrue(hasViolationOn(validator.validate(request), "appointmentTime"));
    }

    @Test
    void unsupportedAppointmentType_failValidation() {
        CreateAppointmentRequest request = validRequest();
        request.setAppointmentType("VIDEO_CALL");

        assertTrue(hasViolationOn(validator.validate(request), "appointmentType"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
