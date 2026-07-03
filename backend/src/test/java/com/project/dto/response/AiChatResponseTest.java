package com.project.dto.response;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiChatResponseTest {

    @Test
    void ok_returnsSuccessfulReply() {
        AiChatResponse response = AiChatResponse.ok("Hello");

        assertTrue(response.isSuccess());
        assertEquals("Hello", response.getReply());
        assertNull(response.getError());
    }

    @Test
    void fail_returnsErrorResponse() {
        AiChatResponse response = AiChatResponse.fail("Service unavailable");

        assertFalse(response.isSuccess());
        assertNull(response.getReply());
        assertEquals("Service unavailable", response.getError());
    }

    @Test
    void noArgsConstructorAndSettersWork() {
        AiChatResponse response = new AiChatResponse();
        response.setSuccess(true);
        response.setReply("Hi");
        response.setError(null);

        assertTrue(response.isSuccess());
        assertEquals("Hi", response.getReply());
        assertNull(response.getError());
    }
}
