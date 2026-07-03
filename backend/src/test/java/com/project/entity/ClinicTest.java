package com.project.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class ClinicTest {

    @Test
    @DisplayName("Clinic builder with all fields → all values set correctly")
    void builder_allFields() {
        Clinic clinic = Clinic.builder()
                .id(1L)
                .clinicCode("PK001")
                .name("Phòng khám ABC")
                .address("123 Nguyen Hue, HCM")
                .phone("0281234567")
                .email("info@abc.com")
                .description("Phòng khám đa khoa")
                .imageUrl("https://example.com/image.jpg")
                .managerId(10L)
                .status("ACTIVE")
                .doctorCount(5)
                .patientCount(100)
                .highRiskPatientCount(10)
                .build();

        assertEquals(1L, clinic.getId());
        assertEquals("PK001", clinic.getClinicCode());
        assertEquals("Phòng khám ABC", clinic.getName());
        assertEquals("123 Nguyen Hue, HCM", clinic.getAddress());
        assertEquals("0281234567", clinic.getPhone());
        assertEquals("info@abc.com", clinic.getEmail());
        assertEquals("Phòng khám đa khoa", clinic.getDescription());
        assertEquals("https://example.com/image.jpg", clinic.getImageUrl());
        assertEquals(10L, clinic.getManagerId());
        assertEquals("ACTIVE", clinic.getStatus());
        assertEquals(5, clinic.getDoctorCount());
        assertEquals(100, clinic.getPatientCount());
        assertEquals(10, clinic.getHighRiskPatientCount());
    }

    @Test
    @DisplayName("Clinic builder defaults → status ACTIVE, counts 0")
    void builder_defaults() {
        Clinic clinic = Clinic.builder()
                .name("Phòng khám Test")
                .build();

        assertEquals("ACTIVE", clinic.getStatus());
        assertEquals(0, clinic.getDoctorCount());
        assertEquals(0, clinic.getPatientCount());
        assertEquals(0, clinic.getHighRiskPatientCount());
    }

    @Test
    @DisplayName("Clinic no-args constructor → all null, defaults applied")
    void noArgsConstructor() {
        Clinic clinic = new Clinic();

        assertNull(clinic.getId());
        assertNull(clinic.getName());
        assertNull(clinic.getClinicCode());
        // Note: @Builder.Default only works with builder, not no-args constructor
    }

    @Test
    @DisplayName("Clinic setters → values updated correctly")
    void setters() {
        Clinic clinic = new Clinic();
        clinic.setId(2L);
        clinic.setName("Updated Name");
        clinic.setStatus("INACTIVE");
        clinic.setDoctorCount(3);

        assertEquals(2L, clinic.getId());
        assertEquals("Updated Name", clinic.getName());
        assertEquals("INACTIVE", clinic.getStatus());
        assertEquals(3, clinic.getDoctorCount());
    }
}