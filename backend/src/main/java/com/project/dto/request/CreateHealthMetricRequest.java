package com.project.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateHealthMetricRequest {

    @NotNull(message = "Metric type is required")
    @Pattern(regexp = "BLOOD_SUGAR|BLOOD_PRESSURE|HEART_RATE|HBA1C|SPO2", message = "Metric type is not supported")
    private String metricType; // BLOOD_SUGAR, BLOOD_PRESSURE, HEART_RATE, HBA1C, SPO2

    @NotNull(message = "Value is required")
    @Positive(message = "Value must be greater than 0")
    private BigDecimal value;

    @Positive(message = "Secondary value must be greater than 0")
    private BigDecimal valueSecondary; // For blood pressure diastolic

    @NotBlank(message = "Unit is required")
    private String unit;

    private String notes;

    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime measuredAt;
}
