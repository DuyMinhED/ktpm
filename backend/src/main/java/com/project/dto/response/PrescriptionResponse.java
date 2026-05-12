package com.project.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class PrescriptionResponse {
    private Long id;
    private String prescriptionCode;
    private String patientName;
    private String patientInitial;
    private String diagnosis;
    private String status;
    private String colorCode;
    private String patientAvatarUrl;
    private LocalDateTime createdAt;
}
