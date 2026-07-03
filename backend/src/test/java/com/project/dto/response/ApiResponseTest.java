package com.project.dto.response;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiResponseTest {

    @Test
    void successWithData_usesDefaultSuccessMessage() {
        ApiResponse<String> response = ApiResponse.success("payload");

        assertTrue(response.isSuccess());
        assertEquals("payload", response.getData());
        assertEquals("Thành công", response.getMessage());
    }

    @Test
    void successWithCustomMessage_storesMessageAndData() {
        ApiResponse<Integer> response = ApiResponse.success("Created", 1);

        assertTrue(response.isSuccess());
        assertEquals("Created", response.getMessage());
        assertEquals(1, response.getData());
    }

    @Test
    void errorWithMessage_hasNoData() {
        ApiResponse<Object> response = ApiResponse.error("Failed");

        assertFalse(response.isSuccess());
        assertEquals("Failed", response.getMessage());
        assertNull(response.getData());
    }

    @Test
    void errorWithData_storesErrorDetails() {
        Map<String, String> errors = Map.of("field", "required");

        ApiResponse<Map<String, String>> response = ApiResponse.error("Validation failed", errors);

        assertFalse(response.isSuccess());
        assertEquals("Validation failed", response.getMessage());
        assertEquals(errors, response.getData());
    }
}
