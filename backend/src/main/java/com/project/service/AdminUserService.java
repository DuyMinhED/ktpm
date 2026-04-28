package com.project.service;

import com.project.dto.request.CreateUserRequest;
import com.project.dto.request.UpdateUserRequest;
import com.project.dto.response.AdminUserResponse;
import com.project.dto.response.AdminUserStatsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.project.entity.UserRole;

public interface AdminUserService {
    AdminUserStatsResponse getUserStats();
    Page<AdminUserResponse> getUsers(UserRole role, String status, Long clinicId, String keyword, Pageable pageable);
    AdminUserResponse getUserById(Long id);
    AdminUserResponse createUser(CreateUserRequest request);
    AdminUserResponse updateUser(Long id, UpdateUserRequest request);
    void toggleUserStatus(Long id);
    void deleteUser(Long id);
}
