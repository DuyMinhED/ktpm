package com.project.service.impl;

import com.project.dto.request.AiChatRequest;
import com.project.dto.response.AiChatResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GeminiAiChatServiceImplTest {

    private GeminiAiChatServiceImpl service;
    private WebClient webClient;

    @BeforeEach
    void setUp() {
        service = new GeminiAiChatServiceImpl();
        webClient = mock(WebClient.class, RETURNS_DEEP_STUBS);
        ReflectionTestUtils.setField(service, "webClient", webClient);
        ReflectionTestUtils.setField(service, "model", "gemini-test");
    }

    @Test
    @DisplayName("chat - returns failure when API key is missing")
    void chat_missingApiKey() {
        ReflectionTestUtils.setField(service, "apiKey", " ");

        AiChatResponse response = service.chat(request("Tôi nên ăn gì?", null));

        assertFalse(response.isSuccess());
        assertTrue(response.getError().contains("AI"));
        verify(webClient, never()).post();
    }

    @Test
    @DisplayName("chat - returns failure when API key is null")
    void chat_nullApiKey() {
        ReflectionTestUtils.setField(service, "apiKey", null);

        AiChatResponse response = service.chat(request("Hello", null));

        assertFalse(response.isSuccess());
        assertTrue(response.getError().contains("AI"));
        verify(webClient, never()).post();
    }

    @Test
    @DisplayName("chat - sends history and maps successful Gemini response")
    void chat_successWithHistory() {
        ReflectionTestUtils.setField(service, "apiKey", "secret");
        Map<String, Object> geminiResponse = Map.of(
                "candidates", List.of(Map.of(
                        "content", Map.of(
                                "parts", List.of(Map.of("text", "Bạn nên theo dõi chỉ số đều đặn."))
                        ))));
        when(webClient.post()
                .uri(anyString())
                .contentType(any())
                .bodyValue(any())
                .retrieve()
                .bodyToMono(Map.class)
                .block()).thenReturn(geminiResponse);

        AiChatRequest.ChatMessage history = new AiChatRequest.ChatMessage();
        history.setRole("assistant");
        history.setContent("Tôi có thể hỗ trợ sức khỏe chung.");

        AiChatResponse response = service.chat(request("Tư vấn ăn uống", List.of(history)));

        assertTrue(response.isSuccess());
        assertEquals("Bạn nên theo dõi chỉ số đều đặn.", response.getReply());
    }

    @Test
    @DisplayName("chat - maps user role in history")
    void chat_successWithUserHistoryRole() {
        ReflectionTestUtils.setField(service, "apiKey", "secret");
        when(webClient.post()
                .uri(anyString())
                .contentType(any())
                .bodyValue(any())
                .retrieve()
                .bodyToMono(Map.class)
                .block()).thenReturn(Map.of(
                        "candidates", List.of(Map.of(
                                "content", Map.of("parts", List.of(Map.of("text", "ok")))))));

        AiChatRequest.ChatMessage history = new AiChatRequest.ChatMessage();
        history.setRole("user");
        history.setContent("Track glucose");

        AiChatResponse response = service.chat(request("Advice", List.of(history)));

        assertTrue(response.isSuccess());
        assertEquals("ok", response.getReply());
    }

    @Test
    @DisplayName("chat - handles null response from Gemini")
    void chat_nullGeminiResponse() {
        ReflectionTestUtils.setField(service, "apiKey", "secret");
        when(webClient.post()
                .uri(anyString())
                .contentType(any())
                .bodyValue(any())
                .retrieve()
                .bodyToMono(Map.class)
                .block()).thenReturn(null);

        AiChatResponse response = service.chat(request("Hello", null));

        assertFalse(response.isSuccess());
        assertTrue(response.getError().contains("AI"));
    }

    @Test
    @DisplayName("chat - returns fallback reply when candidates are empty")
    void chat_emptyCandidates() {
        ReflectionTestUtils.setField(service, "apiKey", "secret");
        when(webClient.post()
                .uri(anyString())
                .contentType(any())
                .bodyValue(any())
                .retrieve()
                .bodyToMono(Map.class)
                .block()).thenReturn(Map.of("candidates", List.of()));

        AiChatResponse response = service.chat(request("Hello", null));

        assertTrue(response.isSuccess());
        assertTrue(response.getReply().contains("Xin"));
    }

    @Test
    @DisplayName("chat - returns fallback reply when candidates are null")
    void chat_nullCandidates() {
        ReflectionTestUtils.setField(service, "apiKey", "secret");
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("candidates", null);
        when(webClient.post()
                .uri(anyString())
                .contentType(any())
                .bodyValue(any())
                .retrieve()
                .bodyToMono(Map.class)
                .block()).thenReturn(responseBody);

        AiChatResponse response = service.chat(request("Hello", null));

        assertTrue(response.isSuccess());
        assertTrue(response.getReply().contains("Xin"));
    }

    @Test
    @DisplayName("chat - returns fallback reply when parts are empty")
    void chat_emptyParts() {
        ReflectionTestUtils.setField(service, "apiKey", "secret");
        when(webClient.post()
                .uri(anyString())
                .contentType(any())
                .bodyValue(any())
                .retrieve()
                .bodyToMono(Map.class)
                .block()).thenReturn(Map.of("candidates", List.of(Map.of("content", Map.of("parts", List.of())))));

        AiChatResponse response = service.chat(request("Hello", null));

        assertTrue(response.isSuccess());
        assertTrue(response.getReply().contains("Xin"));
    }

    @Test
    @DisplayName("chat - returns fallback reply when parts are null")
    void chat_nullParts() {
        ReflectionTestUtils.setField(service, "apiKey", "secret");
        Map<String, Object> content = new HashMap<>();
        content.put("parts", null);
        when(webClient.post()
                .uri(anyString())
                .contentType(any())
                .bodyValue(any())
                .retrieve()
                .bodyToMono(Map.class)
                .block()).thenReturn(Map.of("candidates", List.of(Map.of("content", content))));

        AiChatResponse response = service.chat(request("Hello", null));

        assertTrue(response.isSuccess());
        assertTrue(response.getReply().contains("Xin"));
    }

    @Test
    @DisplayName("chat - returns parse error fallback when response shape is invalid")
    void chat_invalidResponseShape() {
        ReflectionTestUtils.setField(service, "apiKey", "secret");
        when(webClient.post()
                .uri(anyString())
                .contentType(any())
                .bodyValue(any())
                .retrieve()
                .bodyToMono(Map.class)
                .block()).thenReturn(Map.of("candidates", List.of(Map.of("content", "bad"))));

        AiChatResponse response = service.chat(request("Hello", null));

        assertTrue(response.isSuccess());
        assertTrue(response.getReply().contains("Xin"));
    }

    @Test
    @DisplayName("chat - returns failure when WebClient throws")
    void chat_webClientThrows() {
        ReflectionTestUtils.setField(service, "apiKey", "secret");
        when(webClient.post()
                .uri(anyString())
                .contentType(any())
                .bodyValue(any())
                .retrieve()
                .bodyToMono(Map.class)).thenReturn(Mono.error(new RuntimeException("network down")));

        AiChatResponse response = service.chat(request("Hello", null));

        assertFalse(response.isSuccess());
        assertTrue(response.getError().contains("network down"));
    }

    private static AiChatRequest request(String message, List<AiChatRequest.ChatMessage> history) {
        AiChatRequest request = new AiChatRequest();
        request.setMessage(message);
        request.setHistory(history);
        return request;
    }
}
