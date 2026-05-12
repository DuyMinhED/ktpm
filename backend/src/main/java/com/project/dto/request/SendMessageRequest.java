package com.project.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    private Long conversationId;
    private Long receiverId;

    @NotBlank(message = "Content is required")
    private String content;

    private String messageType; // TEXT, IMAGE, FILE

    private String attachmentUrl;
}
