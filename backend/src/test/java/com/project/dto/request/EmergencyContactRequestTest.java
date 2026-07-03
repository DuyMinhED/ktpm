package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class EmergencyContactRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private EmergencyContactRequest validRequest() {
        EmergencyContactRequest request = new EmergencyContactRequest();
        request.setContactName("Nguyen Van B");
        request.setRelationship("Father");
        request.setPhone("0901234567");
        request.setPrimary(true);
        return request;
    }

    @Test
    void contactNameBoundaries_matchDtoSizeRule() {
        EmergencyContactRequest request = validRequest();

        request.setContactName("a");
        assertTrue(validator.validate(request).isEmpty());

        request.setContactName("a".repeat(99));
        assertTrue(validator.validate(request).isEmpty());

        request.setContactName("a".repeat(100));
        assertTrue(validator.validate(request).isEmpty());

        request.setContactName("a".repeat(101));
        assertTrue(hasViolationOn(validator.validate(request), "contactName"));
    }

    @Test
    void relationshipBoundaries_matchDtoSizeRule() {
        EmergencyContactRequest request = validRequest();

        request.setRelationship("a");
        assertTrue(validator.validate(request).isEmpty());

        request.setRelationship("a".repeat(49));
        assertTrue(validator.validate(request).isEmpty());

        request.setRelationship("a".repeat(50));
        assertTrue(validator.validate(request).isEmpty());

        request.setRelationship("a".repeat(51));
        assertTrue(hasViolationOn(validator.validate(request), "relationship"));
    }

    @Test
    void phoneBoundaryAndFormatValues_matchRegexRule() {
        EmergencyContactRequest request = validRequest();

        request.setPhone("1".repeat(9));
        assertTrue(hasViolationOn(validator.validate(request), "phone"));

        request.setPhone("1".repeat(10));
        assertTrue(validator.validate(request).isEmpty());

        request.setPhone("+84 901 234 567");
        assertTrue(validator.validate(request).isEmpty());

        request.setPhone("1".repeat(20));
        assertTrue(validator.validate(request).isEmpty());

        request.setPhone("1".repeat(21));
        assertTrue(hasViolationOn(validator.validate(request), "phone"));

        request.setPhone("09012abcde");
        assertTrue(hasViolationOn(validator.validate(request), "phone"));
    }

    @Test
    void requiredFieldsBlank_failValidation() {
        EmergencyContactRequest request = validRequest();
        request.setContactName("");
        assertTrue(hasViolationOn(validator.validate(request), "contactName"));

        request = validRequest();
        request.setRelationship("");
        assertTrue(hasViolationOn(validator.validate(request), "relationship"));

        request = validRequest();
        request.setPhone("");
        assertTrue(hasViolationOn(validator.validate(request), "phone"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
