package com.project.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private Long id;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialty;
    private String doctorAvatarUrl;
    
    private String doctorExperience;
    private String doctorBio;
    private String doctorClinicName;
    
    private Long patientId;
    private String patientName;
    private String patientAvatarUrl;
    private boolean isOnline;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}
