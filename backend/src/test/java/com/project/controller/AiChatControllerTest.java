package com.project.controller;

import com.project.dto.request.AiChatRequest;
import com.project.dto.response.AiChatResponse;
import com.project.service.AiChatService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiChatControllerTest {

    private final AiChatService service = mock(AiChatService.class);
    private final AiChatController controller = new AiChatController(service);

    @Test
    void chat_delegatesToService() {
        AiChatRequest request = new AiChatRequest();
        request.setMessage("Hello");
        AiChatResponse expected = AiChatResponse.ok("Hi");
        when(service.chat(request)).thenReturn(expected);

        AiChatResponse response = controller.chat(request);

        assertSame(expected, response);
        verify(service).chat(request);
    }
}
