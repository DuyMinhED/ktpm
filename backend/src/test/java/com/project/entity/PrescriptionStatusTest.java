package com.project.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class PrescriptionStatusTest {

    @Test
    void testEnumConstants() {
        PrescriptionStatus[] statuses = PrescriptionStatus.values();
        assertEquals(5, statuses.length);

        assertEquals(PrescriptionStatus.ACTIVE, PrescriptionStatus.valueOf("ACTIVE"));
        assertEquals(PrescriptionStatus.EXPIRED, PrescriptionStatus.valueOf("EXPIRED"));
        assertEquals(PrescriptionStatus.CANCELLED, PrescriptionStatus.valueOf("CANCELLED"));
        assertEquals(PrescriptionStatus.PENDING_RENEWAL, PrescriptionStatus.valueOf("PENDING_RENEWAL"));
        assertEquals(PrescriptionStatus.COMPLETED, PrescriptionStatus.valueOf("COMPLETED"));
    }
}
