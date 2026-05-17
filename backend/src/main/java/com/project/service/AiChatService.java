package com.project.service;

import com.project.dto.request.AiChatRequest;
import com.project.dto.response.AiChatResponse;

public interface AiChatService {
    AiChatResponse chat(AiChatRequest request);
}
