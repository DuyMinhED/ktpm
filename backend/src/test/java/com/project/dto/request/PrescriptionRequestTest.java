package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class PrescriptionRequestTest {

    private static Validator validator;

    @BeforeAll
    public static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidRequest() {
        PrescriptionItemRequest itemRequest = new PrescriptionItemRequest();
        itemRequest.setMedicationName("Paracetamol");
        itemRequest.setDosage("500mg");

        PrescriptionRequest request = new PrescriptionRequest();
        request.setPatientId(1L);
        request.setDiagnosis("Flu");
        request.setNotes("Drink water");
        request.setItems(List.of(itemRequest));

        Set<ConstraintViolation<PrescriptionRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }

    @Test
    void testNullPatientId() {
        PrescriptionItemRequest itemRequest = new PrescriptionItemRequest();
        itemRequest.setMedicationName("Paracetamol");
        itemRequest.setDosage("500mg");

        PrescriptionRequest request = new PrescriptionRequest();
        request.setPatientId(null);
        request.setDiagnosis("Flu");
        request.setItems(List.of(itemRequest));

        Set<ConstraintViolation<PrescriptionRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("Patient ID is required", violations.iterator().next().getMessage());
    }

    @Test
    void testBlankDiagnosis() {
        PrescriptionItemRequest itemRequest = new PrescriptionItemRequest();
        itemRequest.setMedicationName("Paracetamol");
        itemRequest.setDosage("500mg");

        PrescriptionRequest request = new PrescriptionRequest();
        request.setPatientId(1L);
        request.setDiagnosis("");
        request.setItems(List.of(itemRequest));

        Set<ConstraintViolation<PrescriptionRequest>> violations = validator.validate(request);
        // Under jakarta.validation, a blank string violates both NotBlank and size might be fine, but let's check
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().equals("Diagnosis is required")));
    }

    @Test
    void testDiagnosisTooLong() {
        PrescriptionItemRequest itemRequest = new PrescriptionItemRequest();
        itemRequest.setMedicationName("Paracetamol");
        itemRequest.setDosage("500mg");

        PrescriptionRequest request = new PrescriptionRequest();
        request.setPatientId(1L);
        request.setDiagnosis("A".repeat(256));
        request.setItems(List.of(itemRequest));

        Set<ConstraintViolation<PrescriptionRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("Diagnosis must not exceed 255 characters", violations.iterator().next().getMessage());
    }

    @Test
    void testNullItems() {
        PrescriptionRequest request = new PrescriptionRequest();
        request.setPatientId(1L);
        request.setDiagnosis("Flu");
        request.setItems(null);

        Set<ConstraintViolation<PrescriptionRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("Prescription items cannot be null", violations.iterator().next().getMessage());
    }

    @Test
    void testEmptyItems() {
        PrescriptionRequest request = new PrescriptionRequest();
        request.setPatientId(1L);
        request.setDiagnosis("Flu");
        request.setItems(Collections.emptyList());

        Set<ConstraintViolation<PrescriptionRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("At least one medication is required", violations.iterator().next().getMessage());
    }
}
