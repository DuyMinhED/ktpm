package com.project.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

public class PrescriptionItemTest {

    @Test
    void testPrescriptionItemGettersAndSetters() {
        Prescription prescription = new Prescription();
        prescription.setId(100L);

        PrescriptionItem item = new PrescriptionItem();
        item.setId(1L);
        item.setPrescription(prescription);
        item.setMedicationName("Aspirin");
        item.setDosage("100mg");
        item.setUsageInstructions("Uong sau khi an no");
        
        LocalDateTime now = LocalDateTime.now();
        item.setCreatedAt(now);
        item.setUpdatedAt(now);

        assertEquals(1L, item.getId());
        assertEquals(prescription, item.getPrescription());
        assertEquals("Aspirin", item.getMedicationName());
        assertEquals("100mg", item.getDosage());
        assertEquals("Uong sau khi an no", item.getUsageInstructions());
        assertEquals(now, item.getCreatedAt());
        assertEquals(now, item.getUpdatedAt());
    }

    @Test
    void testPrescriptionItemBuilder() {
        Prescription prescription = new Prescription();
        prescription.setId(200L);

        PrescriptionItem item = PrescriptionItem.builder()
                .id(2L)
                .prescription(prescription)
                .medicationName("Ibuprofen")
                .dosage("200mg")
                .usageInstructions("Uong khi sot")
                .build();

        assertEquals(2L, item.getId());
        assertEquals(prescription, item.getPrescription());
        assertEquals("Ibuprofen", item.getMedicationName());
        assertEquals("200mg", item.getDosage());
        assertEquals("Uong khi sot", item.getUsageInstructions());
    }

    @Test
    void testPrescriptionAddItemRelationship() {
        Prescription prescription = Prescription.builder()
                .id(300L)
                .items(new ArrayList<>())
                .build();

        PrescriptionItem item = PrescriptionItem.builder()
                .id(3L)
                .medicationName("Metformin")
                .dosage("500mg")
                .build();

        prescription.addItem(item);

        assertEquals(1, prescription.getItems().size());
        assertEquals(item, prescription.getItems().get(0));
        assertEquals(prescription, item.getPrescription());
    }
}
