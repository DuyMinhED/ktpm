package com.project.controller;

import com.project.dto.response.ApiResponse;
import com.project.dto.response.UserProfileResponse;
import com.project.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "User profile management APIs")
public class UserProfileController {

    @GetMapping("/me")
    @Operation(summary = "Get current logged in user profile")
    public ApiResponse<UserProfileResponse> getCurrentUser() {
        return SecurityUtils.getCurrentUserDetails()
                .map(userDetails -> {
                    UserProfileResponse response = UserProfileResponse.builder()
                            .id(userDetails.getId())
                            .email(userDetails.getEmail())
                            .fullName(userDetails.getFullName())
                            .role(userDetails.getRole())
                            .avatarUrl(userDetails.getAvatarUrl())
                            .build();
                    return ApiResponse.success("User profile retrieved", response);
                })
                .orElse(ApiResponse.error("Not authenticated", null));
    }
}
