package com.project.dto.request;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

public class ClinicRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    // =========================================================================
    // CreateClinicRequest
    // =========================================================================

    @Nested
    @DisplayName("CreateClinicRequest Validation")
    class CreateClinicRequestTests {

        @Test
        @DisplayName("Valid request → no violations")
        void validRequest() {
            CreateClinicRequest request = new CreateClinicRequest();
            request.setName("Phòng khám ABC");
            request.setClinicCode("PK001");
            request.setAdminFullName("Nguyen Van A");
            request.setAdminEmail("admin@abc.com");
            request.setAdminPassword("password123");

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty());
        }

        @Test
        @DisplayName("Name blank → violation")
        void nameBlank() {
            CreateClinicRequest request = new CreateClinicRequest();
            request.setName("");
            request.setClinicCode("PK001");
            request.setAdminFullName("Nguyen Van A");
            request.setAdminEmail("admin@abc.com");
            request.setAdminPassword("password123");

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
        }

        @Test
        @DisplayName("Name exceeds 200 chars → violation")
        void nameTooLong() {
            CreateClinicRequest request = new CreateClinicRequest();
            request.setName("A".repeat(201));
            request.setClinicCode("PK001");
            request.setAdminFullName("Nguyen Van A");
            request.setAdminEmail("admin@abc.com");
            request.setAdminPassword("password123");

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
        }

        @Test
        @DisplayName("ClinicCode blank → violation")
        void clinicCodeBlank() {
            CreateClinicRequest request = new CreateClinicRequest();
            request.setName("Phòng khám ABC");
            request.setClinicCode("");
            request.setAdminFullName("Nguyen Van A");
            request.setAdminEmail("admin@abc.com");
            request.setAdminPassword("password123");

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("clinicCode")));
        }

        @Test
        @DisplayName("ClinicCode exceeds 20 chars → violation")
        void clinicCodeTooLong() {
            CreateClinicRequest request = new CreateClinicRequest();
            request.setName("Phòng khám ABC");
            request.setClinicCode("A".repeat(21));
            request.setAdminFullName("Nguyen Van A");
            request.setAdminEmail("admin@abc.com");
            request.setAdminPassword("password123");

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("clinicCode")));
        }

        @Test
        @DisplayName("AdminFullName blank → violation")
        void adminFullNameBlank() {
            CreateClinicRequest request = new CreateClinicRequest();
            request.setName("Phòng khám ABC");
            request.setClinicCode("PK001");
            request.setAdminFullName("");
            request.setAdminEmail("admin@abc.com");
            request.setAdminPassword("password123");

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("adminFullName")));
        }

        @Test
        @DisplayName("AdminEmail blank → violation")
        void adminEmailBlank() {
            CreateClinicRequest request = new CreateClinicRequest();
            request.setName("Phòng khám ABC");
            request.setClinicCode("PK001");
            request.setAdminFullName("Nguyen Van A");
            request.setAdminEmail("");
            request.setAdminPassword("password123");

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("adminEmail")));
        }

        @Test
        @DisplayName("AdminPassword blank → violation")
        void adminPasswordBlank() {
            CreateClinicRequest request = new CreateClinicRequest();
            request.setName("Phòng khám ABC");
            request.setClinicCode("PK001");
            request.setAdminFullName("Nguyen Van A");
            request.setAdminEmail("admin@abc.com");
            request.setAdminPassword("");

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("adminPassword")));
        }

        @Test
        @DisplayName("Phone exceeds 20 chars → violation")
        void phoneTooLong() {
            CreateClinicRequest request = new CreateClinicRequest();
            request.setName("Phòng khám ABC");
            request.setClinicCode("PK001");
            request.setPhone("1".repeat(21));
            request.setAdminFullName("Nguyen Van A");
            request.setAdminEmail("admin@abc.com");
            request.setAdminPassword("password123");

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("phone")));
        }

        @Test
        @DisplayName("All required fields null → multiple violations")
        void allRequiredNull() {
            CreateClinicRequest request = new CreateClinicRequest();

            Set<ConstraintViolation<CreateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.size() >= 5); // name, clinicCode, adminFullName, adminEmail, adminPassword
        }
    }

    // =========================================================================
    // UpdateClinicRequest
    // =========================================================================

    @Nested
    @DisplayName("UpdateClinicRequest Validation")
    class UpdateClinicRequestTests {

        @Test
        @DisplayName("Valid request → no violations")
        void validRequest() {
            UpdateClinicRequest request = new UpdateClinicRequest();
            request.setName("Updated Name");
            request.setPhone("0281234567");

            Set<ConstraintViolation<UpdateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty());
        }

        @Test
        @DisplayName("All fields null → no violations (all optional)")
        void allNull() {
            UpdateClinicRequest request = new UpdateClinicRequest();

            Set<ConstraintViolation<UpdateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty());
        }

        @Test
        @DisplayName("Name exceeds 200 chars → violation")
        void nameTooLong() {
            UpdateClinicRequest request = new UpdateClinicRequest();
            request.setName("A".repeat(201));

            Set<ConstraintViolation<UpdateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
        }

        @Test
        @DisplayName("Phone exceeds 20 chars → violation")
        void phoneTooLong() {
            UpdateClinicRequest request = new UpdateClinicRequest();
            request.setPhone("1".repeat(21));

            Set<ConstraintViolation<UpdateClinicRequest>> violations = validator.validate(request);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("phone")));
        }
    }
}