package com.project.controller;

import com.project.dto.response.ApiResponse;
import com.project.dto.response.NotificationResponse;
import com.project.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationControllerTest {

    private final NotificationService service = mock(NotificationService.class);
    private final NotificationController controller = new NotificationController(service);

    @Test
    void getMyNotifications_returnsWrappedList() {
        List<NotificationResponse> notifications = List.of(NotificationResponse.builder()
                .id(1L)
                .title("Title")
                .message("Message")
                .type("info")
                .build());
        when(service.getMyNotifications()).thenReturn(notifications);

        ResponseEntity<ApiResponse<List<NotificationResponse>>> response = controller.getMyNotifications();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertSame(notifications, response.getBody().getData());
    }

    @Test
    void getUnreadCount_returnsWrappedCount() {
        when(service.getUnreadCount()).thenReturn(5L);

        ResponseEntity<ApiResponse<Long>> response = controller.getUnreadCount();

        assertEquals(5L, response.getBody().getData());
    }

    @Test
    void markReadMarkAllAndDelete_delegateAndReturnSuccess() {
        ResponseEntity<ApiResponse<Void>> read = controller.markAsRead(1L);
        ResponseEntity<ApiResponse<Void>> readAll = controller.markAllAsRead();
        ResponseEntity<ApiResponse<Void>> delete = controller.delete(2L);

        assertTrue(read.getBody().isSuccess());
        assertTrue(readAll.getBody().isSuccess());
        assertTrue(delete.getBody().isSuccess());
        assertNull(read.getBody().getData());
        verify(service).markAsRead(1L);
        verify(service).markAllAsRead();
        verify(service).delete(2L);
    }
}
