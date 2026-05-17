package com.project.controller;

import com.project.dto.request.ChangePasswordRequest;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.UserProfileResponse;
import com.project.entity.User;
import com.project.repository.UserRepository;
import com.project.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "User profile management APIs")
public class UserProfileController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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

    @PutMapping("/change-password")
    @Operation(summary = "Change current user password")
    public ApiResponse<String> changePassword(@RequestBody ChangePasswordRequest request) {
        return SecurityUtils.getCurrentUserDetails()
                .map(userDetails -> {
                    User user = userRepository.findById(userDetails.getId())
                            .orElse(null);
                    if (user == null) {
                        return ApiResponse.<String>error("Người dùng không tồn tại", null);
                    }

                    // Verify current password
                    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                        return ApiResponse.<String>error("Mật khẩu hiện tại không đúng", null);
                    }

                    // Validate new password
                    if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
                        return ApiResponse.<String>error("Mật khẩu mới phải có ít nhất 6 ký tự", null);
                    }

                    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                    userRepository.save(user);
                    return ApiResponse.<String>success("Đổi mật khẩu thành công", null);
                })
                .orElse(ApiResponse.error("Not authenticated", null));
    }
}

