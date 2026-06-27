package com.project.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class PrescriptionItemRequestTest {

    private static Validator validator;

    @BeforeAll
    public static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidRequest() {
        PrescriptionItemRequest request = new PrescriptionItemRequest();
        request.setMedicationName("Paracetamol");
        request.setDosage("500mg");
        request.setUsageInstructions("Take after meals");

        Set<ConstraintViolation<PrescriptionItemRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }

    @Test
    void testBlankMedicationName() {
        PrescriptionItemRequest request = new PrescriptionItemRequest();
        request.setMedicationName("   ");
        request.setDosage("500mg");

        Set<ConstraintViolation<PrescriptionItemRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("Medication name is required", violations.iterator().next().getMessage());
    }

    @Test
    void testBlankDosage() {
        PrescriptionItemRequest request = new PrescriptionItemRequest();
        request.setMedicationName("Paracetamol");
        request.setDosage("");

        Set<ConstraintViolation<PrescriptionItemRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("Dosage is required", violations.iterator().next().getMessage());
    }
}
