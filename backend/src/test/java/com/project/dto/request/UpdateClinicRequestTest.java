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

class UpdateClinicRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void nameAndPhoneAtMaxBoundary_passValidation() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        request.setName("n".repeat(200));
        request.setPhone("0".repeat(20));

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void nameAndPhoneOverMaxBoundary_failValidation() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        request.setName("n".repeat(201));
        request.setPhone("0".repeat(21));

        Set<ConstraintViolation<UpdateClinicRequest>> violations = validator.validate(request);

        assertTrue(hasViolationOn(violations, "name"));
        assertTrue(hasViolationOn(violations, "phone"));
    }

    @Test
    void emailAndStatus_currentlyPassWithoutFormatOrEnumValidationDocumentingGap() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        request.setEmail("not-an-email");
        request.setStatus("UNKNOWN");

        Set<ConstraintViolation<UpdateClinicRequest>> violations = validator.validate(request);

        assertFalse(hasViolationOn(violations, "email"));
        assertFalse(hasViolationOn(violations, "status"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
