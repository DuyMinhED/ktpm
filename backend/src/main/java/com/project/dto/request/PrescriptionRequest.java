package com.project.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class PrescriptionRequest {
    
    @NotNull(message = "Patient ID is required")
    private Long patientId;
    
    @NotBlank(message = "Diagnosis is required")
    @Size(max = 255, message = "Diagnosis must not exceed 255 characters")
    private String diagnosis;
    
    private String notes;
    
    @NotNull(message = "Prescription items cannot be null")
    @Size(min = 1, message = "At least one medication is required")
    @Valid
    private List<PrescriptionItemRequest> items;
}
