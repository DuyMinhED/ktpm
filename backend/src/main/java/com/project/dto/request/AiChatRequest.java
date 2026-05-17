package com.project.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class AiChatRequest {
    private String message;
    private List<ChatMessage> history;

    @Data
    public static class ChatMessage {
        private String role; // "user" or "assistant"
        private String content;
    }
}
