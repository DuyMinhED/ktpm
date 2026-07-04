package com.project.exception;

import com.project.dto.response.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleResourceNotFound_returns404ErrorResponse() {
        ResponseEntity<ApiResponse<Object>> response =
                handler.handleResourceNotFound(new ResourceNotFoundException("Patient not found"));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Patient not found", response.getBody().getMessage());
    }

    @Test
    void handleAccessDenied_returns403ErrorResponse() {
        ResponseEntity<ApiResponse<Object>> response =
                handler.handleAccessDenied(new AccessDeniedException("missing role"));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Access Denied: missing role", response.getBody().getMessage());
    }

    @Test
    void handleAuthenticationException_returns401ErrorResponse() {
        ResponseEntity<ApiResponse<Object>> response =
                handler.handleAuthenticationException(new BadCredentialsException("bad token"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertNotNull(response.getBody().getMessage());
    }

    @Test
    void handleValidationExceptions_returnsFieldErrorMap() {
        BindingResult bindingResult = mock(BindingResult.class);
        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        when(exception.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
                new FieldError("request", "email", "Email is invalid"),
                new FieldError("request", "password", "Password is required")
        ));

        ResponseEntity<ApiResponse<Map<String, String>>> response =
                handler.handleValidationExceptions(exception);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Validation failed", response.getBody().getMessage());
        assertEquals("Email is invalid", response.getBody().getData().get("email"));
        assertEquals("Password is required", response.getBody().getData().get("password"));
    }

    @Test
    void handleBadRequest_returns400ErrorResponse() {
        ResponseEntity<ApiResponse<Object>> response =
                handler.handleBadRequest(new IllegalArgumentException("missing subject"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertNotNull(response.getBody().getMessage());
    }

    @Test
    void handleRuntimeException_returns500WithoutLeakingOriginalMessage() {
        ResponseEntity<ApiResponse<Object>> response =
                handler.handleRuntimeException(new RuntimeException("database password leaked"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertNotNull(response.getBody().getMessage());
    }

    @Test
    void handleGeneralException_returns500GenericResponse() {
        ResponseEntity<ApiResponse<Object>> response =
                handler.handleGeneralException(new Exception("unknown"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertNotNull(response.getBody().getMessage());
    }
}
