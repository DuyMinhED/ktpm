package com.project.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AppointmentSnippetDto {
    private Long id;
    private String patientName;
    private String displayTime; // Example: "Today 14:30"
    private String type;
    private boolean isPast;
    private String avatarUrl;
    private Integer age;
    private String condition;
    private String gender;
}
