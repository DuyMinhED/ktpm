package com.project.controller;

import com.project.dto.request.ChangePasswordRequest;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.UserProfileResponse;
import com.project.entity.User;
import com.project.repository.UserRepository;
import com.project.security.CustomUserDetails;
import com.project.util.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

class UserProfileControllerTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final UserProfileController controller = new UserProfileController(userRepository, passwordEncoder);

    @Test
    void getCurrentUser_returnsProfileWhenAuthenticated() {
        CustomUserDetails principal = principal(7L);

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserDetails).thenReturn(Optional.of(principal));

            ApiResponse<UserProfileResponse> response = controller.getCurrentUser();

            assertTrue(response.isSuccess());
            assertEquals(7L, response.getData().getId());
            assertEquals("doctor@example.com", response.getData().getEmail());
            assertEquals("ROLE_DOCTOR", response.getData().getRole());
        }
    }

    @Test
    void getCurrentUser_returnsErrorWhenUnauthenticated() {
        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserDetails).thenReturn(Optional.empty());

            ApiResponse<UserProfileResponse> response = controller.getCurrentUser();

            assertFalse(response.isSuccess());
            assertNull(response.getData());
        }
    }

    @Test
    void changePassword_updatesPasswordWhenCurrentPasswordMatches() {
        CustomUserDetails principal = principal(7L);
        User user = User.builder().id(7L).password("encoded-old").build();
        ChangePasswordRequest request = passwordRequest("old-pass", "new-pass-123");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-pass", "encoded-old")).thenReturn(true);
        when(passwordEncoder.encode("new-pass-123")).thenReturn("encoded-new");

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserDetails).thenReturn(Optional.of(principal));

            ApiResponse<String> response = controller.changePassword(request);

            assertTrue(response.isSuccess());
            assertEquals("encoded-new", user.getPassword());
            verify(userRepository).save(user);
        }
    }

    @Test
    void changePassword_returnsErrorsForBoundaryCases() {
        ChangePasswordRequest request = passwordRequest("old-pass", "short");
        User user = User.builder().id(7L).password("encoded-old").build();

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserDetails).thenReturn(Optional.empty());
            assertFalse(controller.changePassword(request).isSuccess());

            security.when(SecurityUtils::getCurrentUserDetails).thenReturn(Optional.of(principal(null)));
            assertFalse(controller.changePassword(request).isSuccess());

            security.when(SecurityUtils::getCurrentUserDetails).thenReturn(Optional.of(principal(7L)));
            when(userRepository.findById(7L)).thenReturn(Optional.empty());
            assertFalse(controller.changePassword(request).isSuccess());

            when(userRepository.findById(7L)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("old-pass", "encoded-old")).thenReturn(false);
            assertFalse(controller.changePassword(request).isSuccess());

            when(passwordEncoder.matches("old-pass", "encoded-old")).thenReturn(true);
            assertFalse(controller.changePassword(request).isSuccess());
        }
    }

    @Test
    void changePassword_withNullNewPasswordReturnsError() {
        ChangePasswordRequest request = passwordRequest("old-pass", null);
        User user = User.builder().id(7L).password("encoded-old").build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-pass", "encoded-old")).thenReturn(true);

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::getCurrentUserDetails).thenReturn(Optional.of(principal(7L)));

            ApiResponse<String> response = controller.changePassword(request);

            assertFalse(response.isSuccess());
            verify(passwordEncoder, never()).encode(any());
        }
    }

    private static CustomUserDetails principal(Long id) {
        return CustomUserDetails.builder()
                .id(id)
                .email("doctor@example.com")
                .fullName("Dr Test")
                .role("ROLE_DOCTOR")
                .avatarUrl("/avatar.png")
                .authorities(List.of())
                .build();
    }

    private static ChangePasswordRequest passwordRequest(String currentPassword, String newPassword) {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword(currentPassword);
        request.setNewPassword(newPassword);
        return request;
    }
}
