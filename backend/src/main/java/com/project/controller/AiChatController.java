package com.project.controller;

import com.project.dto.request.AiChatRequest;
import com.project.dto.response.AiChatResponse;
import com.project.service.AiChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI Chat", description = "AI-powered health assistant APIs")
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    @Operation(summary = "Chat with AI health assistant",
               description = "Send a message to DamDiep AI health assistant and get a response")
    public AiChatResponse chat(@Valid @RequestBody AiChatRequest request) {
        return aiChatService.chat(request);
    }
}
