package com.project.service.impl;

import com.project.dto.response.NotificationResponse;
import com.project.entity.Notification;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.NotificationRepository;
import com.project.util.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
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

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            service.markAsRead(2L);

            assertThrows(ResourceNotFoundException.class, () -> service.markAsRead(404L));
        }

        assertTrue(notification.isRead());
        verify(repository).save(notification);
    }

    @Test
    void markAsRead_otherUsersNotification_isDenied() {
        Notification notification = notification(2L);
        notification.setUserId(8L);
        when(repository.findById(2L)).thenReturn(Optional.of(notification));

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            assertThrows(AccessDeniedException.class, () -> service.markAsRead(2L));
        }

        assertFalse(notification.isRead());
        verify(repository, never()).save(notification);
    }

    @Test
    void markAsRead_deletedNotification_throwsAccessDeniedException() {
        Notification notification = notification(2L);
        notification.setDeleted(true);
        when(repository.findById(2L)).thenReturn(Optional.of(notification));

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            assertThrows(AccessDeniedException.class, () -> service.markAsRead(2L));
        }

        verify(repository, never()).save(notification);
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
    void delete_marksOwnedNotificationAsDeletedAndSendNotificationSavesNewRecord() {
        Notification notification = notification(9L);
        when(repository.findById(9L)).thenReturn(Optional.of(notification));
        when(repository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            service.delete(9L);
        }
        service.sendNotification(7L, "Title", "Message", "warning", "/x");

        assertTrue(notification.isDeleted());
        verify(repository, never()).deleteById(9L);
        verify(repository).save(notification);
        verify(repository).save(argThat(n -> "warning".equals(n.getType()) && "/x".equals(n.getTargetUrl())));
    }

    @Test
    void delete_otherUsersNotification_isDenied() {
        Notification notification = notification(9L);
        notification.setUserId(8L);
        when(repository.findById(9L)).thenReturn(Optional.of(notification));

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            assertThrows(AccessDeniedException.class, () -> service.delete(9L));
        }

        assertFalse(notification.isDeleted());
        verify(repository, never()).save(notification);
    }

    @Test
    void delete_nonExistentNotification_throwsResourceNotFoundException() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(7L));

            assertThrows(ResourceNotFoundException.class, () -> service.delete(999L));
        }
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
