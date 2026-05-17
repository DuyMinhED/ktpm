package com.project.mapper;

import com.project.dto.response.PrescriptionResponse;
import com.project.entity.Prescription;
import com.project.entity.PrescriptionStatus;
import org.springframework.stereotype.Component;

@Component
public class PrescriptionMapper {

    public PrescriptionResponse toResponseDTO(Prescription prescription) {
        String patientName = prescription.getPatient().getFullName();
        String initial = getInitials(patientName);
        
        return PrescriptionResponse.builder()
                .id(prescription.getId())
                .prescriptionCode(prescription.getPrescriptionCode())
                .patientName(patientName)
                .patientInitial(initial)
                .diagnosis(prescription.getDiagnosis())
                .status(mapStatusForUI(prescription.getStatus()))
                .colorCode(mapColorCode(prescription.getStatus()))
                .patientAvatarUrl(prescription.getPatient().getAvatarUrl())
                .medicationCount(prescription.getItems() != null ? prescription.getItems().size() : 0)
                .createdAt(prescription.getCreatedAt())
                .build();
    }
    
    private String getInitials(String fullName) {
        if (fullName == null || fullName.isEmpty()) return "";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length >= 2) {
            String first = parts[0];
            String last = parts[parts.length - 1];
            return (first.substring(0, 1) + last.substring(0, 1)).toUpperCase();
        }
        return fullName.substring(0, 1).toUpperCase();
    }

    private String mapStatusForUI(PrescriptionStatus status) {
        return switch (status) {
            case ACTIVE -> "Active";
            case EXPIRED -> "Expired";
            case CANCELLED -> "Cancelled";
            case PENDING_RENEWAL -> "Pending Renewal";
            case COMPLETED -> "Completed";
        };
    }
    
    private String mapColorCode(PrescriptionStatus status) {
        return switch (status) {
            case ACTIVE, COMPLETED -> "emerald";
            case EXPIRED -> "slate";
            case CANCELLED -> "red";
            case PENDING_RENEWAL -> "orange";
        };
    }
}
