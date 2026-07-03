package com.project.service.impl;

import com.project.dto.response.NotificationResponse;
import com.project.entity.Notification;
import com.project.repository.NotificationRepository;
import com.project.util.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationServiceImplTest {

    private final NotificationRepository repository = mock(NotificationRepository.class);
    private final NotificationServiceImpl service = new NotificationServiceImpl(repository);

    @Test
    void getMyNotifications_mapsEntitiesForCurrentUser() {
        Notification notification = notification(1L);
        notification.setCreatedAt(LocalDateTime.now().withHour(8).withMinute(15));
        when(repository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(7L))
                .thenReturn(List.of(notification));

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            List<NotificationResponse> responses = service.getMyNotifications();

            assertEquals(1, responses.size());
            assertEquals(1L, responses.get(0).getId());
            assertEquals("Title", responses.get(0).getTitle());
            assertEquals("Message", responses.get(0).getMessage());
            assertEquals("info", responses.get(0).getType());
            assertFalse(responses.get(0).isRead());
            assertEquals("/target", responses.get(0).getTargetUrl());
        }
    }

    @Test
    void getUnreadCount_usesCurrentUserId() {
        when(repository.countByUserIdAndReadFalseAndIsDeletedFalse(7L)).thenReturn(3L);

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            assertEquals(3L, service.getUnreadCount());
        }
    }

    @Test
    void markAsRead_updatesOnlyWhenNotificationExists() {
        Notification notification = notification(2L);
        when(repository.findById(2L)).thenReturn(Optional.of(notification));
        when(repository.findById(404L)).thenReturn(Optional.empty());

        service.markAsRead(2L);
        service.markAsRead(404L);

        assertTrue(notification.isRead());
        verify(repository).save(notification);
    }

    @Test
    void markAllAsRead_marksUnreadNotificationsForCurrentUser() {
        Notification first = notification(1L);
        Notification second = notification(2L);
        when(repository.findAllByUserIdAndReadFalseAndIsDeletedFalse(7L)).thenReturn(List.of(first, second));

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            service.markAllAsRead();
        }

        assertTrue(first.isRead());
        assertTrue(second.isRead());
        verify(repository).saveAll(List.of(first, second));
    }

    @Test
    void deleteAndSendNotification_delegateToRepository() {
        when(repository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.delete(9L);
        service.sendNotification(7L, "Title", "Message", "warning", "/x");

        verify(repository).deleteById(9L);
        verify(repository).save(any(Notification.class));
    }

    private static Notification notification(Long id) {
        return Notification.builder()
                .id(id)
                .userId(7L)
                .title("Title")
                .message("Message")
                .type("info")
                .read(false)
                .targetUrl("/target")
                .build();
    }
}
