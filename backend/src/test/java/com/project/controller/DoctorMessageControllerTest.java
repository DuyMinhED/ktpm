package com.project.controller;

import com.project.dto.request.SendMessageRequest;
import com.project.dto.response.ConversationResponse;
import com.project.dto.response.MessageResponse;
import com.project.service.DoctorMessageService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DoctorMessageControllerTest {

    private final DoctorMessageService service = mock(DoctorMessageService.class);
    private final DoctorMessageController controller = new DoctorMessageController(service);

    @Test
    void getConversationsAndMessages_returnWrappedServiceResults() {
        List<ConversationResponse> conversations = List.of(ConversationResponse.builder().id(1L).build());
        PageRequest pageable = PageRequest.of(0, 10);
        Page<MessageResponse> messages = new PageImpl<>(List.of(MessageResponse.builder().id(2L).build()));
        when(service.getConversations()).thenReturn(conversations);
        when(service.getMessages(1L, pageable)).thenReturn(messages);

        assertSame(conversations, controller.getConversations().getBody().getData());
        assertSame(messages, controller.getMessages(1L, pageable).getBody().getData());
    }

    @Test
    void sendAndMarkAsRead_delegateToService() {
        SendMessageRequest request = SendMessageRequest.builder()
                .receiverId(2L)
                .content("Hello")
                .build();
        MessageResponse sent = MessageResponse.builder().id(3L).content("Hello").build();
        when(service.sendMessage(request)).thenReturn(sent);

        assertSame(sent, controller.send(request).getBody().getData());
        assertTrue(controller.markAsRead(4L).getBody().isSuccess());
        assertNull(controller.markAsRead(5L).getBody().getData());
        verify(service).sendMessage(request);
        verify(service).markAsRead(4L);
        verify(service).markAsRead(5L);
    }
}
