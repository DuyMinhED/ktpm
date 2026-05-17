package com.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiChatResponse {
    private boolean success;
    private String reply;
    private String error;

    public static AiChatResponse ok(String reply) {
        return new AiChatResponse(true, reply, null);
    }

    public static AiChatResponse fail(String error) {
        return new AiChatResponse(false, null, error);
    }
}
