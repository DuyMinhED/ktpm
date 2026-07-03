package com.project.dto.request;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class AiChatRequestTest {

    @Test
    void dataHolder_storesMessageAndHistory() {
        AiChatRequest.ChatMessage historyItem = new AiChatRequest.ChatMessage();
        historyItem.setRole("user");
        historyItem.setContent("Xin chao");

        AiChatRequest request = new AiChatRequest();
        request.setMessage("Can tu van?");
        request.setHistory(List.of(historyItem));

        assertEquals("Can tu van?", request.getMessage());
        assertEquals(1, request.getHistory().size());
        assertEquals("user", request.getHistory().get(0).getRole());
        assertEquals("Xin chao", request.getHistory().get(0).getContent());
        assertNotNull(request.toString());
    }

    @Test
    void defaultConstructor_leavesFieldsNull() {
        AiChatRequest request = new AiChatRequest();
        AiChatRequest.ChatMessage historyItem = new AiChatRequest.ChatMessage();

        assertNull(request.getMessage());
        assertNull(request.getHistory());
        assertNull(historyItem.getRole());
        assertNull(historyItem.getContent());
    }
}
