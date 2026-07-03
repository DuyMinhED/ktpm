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

class SendMessageRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void validTextMessage_passesValidation() {
        SendMessageRequest request = SendMessageRequest.builder()
                .conversationId(1L)
                .receiverId(2L)
                .content("Hello")
                .messageType("TEXT")
                .build();

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void blankContent_failsValidation() {
        SendMessageRequest request = SendMessageRequest.builder()
                .conversationId(1L)
                .receiverId(2L)
                .content(" ")
                .messageType("TEXT")
                .build();

        assertTrue(hasViolationOn(validator.validate(request), "content"));
    }

    @Test
    void missingConversationAndReceiver_currentlyPassDtoValidationDocumentingGap() {
        SendMessageRequest request = SendMessageRequest.builder()
                .content("Hello")
                .messageType("INVALID")
                .build();

        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        assertFalse(hasViolationOn(violations, "conversationId"));
        assertFalse(hasViolationOn(violations, "receiverId"));
        assertFalse(hasViolationOn(violations, "messageType"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
