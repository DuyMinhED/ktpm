package com.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DoctorSnippetDto {
    private Long id;
    private String name;
    private String specialty;
    private String avatarUrl;
    private int patientCount;
}
