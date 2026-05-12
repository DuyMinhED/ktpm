package com.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtAuthenticationResponse {
    private String accessToken;
    private Long id;
    private Long clinicId;
    private String role;
    private String fullName;
    private String avatarUrl;
    private String tokenType = "Bearer";

    public JwtAuthenticationResponse(String accessToken, Long id, Long clinicId, String role, String fullName, String avatarUrl) {
        this.accessToken = accessToken;
        this.id = id;
        this.clinicId = clinicId;
        this.role = role;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
    }
}
