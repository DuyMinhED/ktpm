package com.project.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ResourceNotFoundExceptionTest {

    @Test
    void constructorStoresMessage() {
        ResourceNotFoundException exception = new ResourceNotFoundException("Patient not found");

        assertEquals("Patient not found", exception.getMessage());
    }
}
