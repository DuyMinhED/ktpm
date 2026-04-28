package com.project.service.impl;

import com.project.dto.request.CreateUserRequest;
import com.project.dto.request.UpdateUserRequest;
import com.project.dto.response.AdminUserResponse;
import com.project.dto.response.AdminUserStatsResponse;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.exception.ResourceNotFoundException;
import com.project.mapper.UserMapper;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.service.AdminUserService;
import com.project.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public AdminUserStatsResponse getUserStats() {
        return AdminUserStatsResponse.builder()
                .totalUsers(userRepository.countByIsDeletedFalse())
                .adminCount(userRepository.countByRoleAndIsDeletedFalse(UserRole.ADMIN))
                .doctorCount(userRepository.countByRoleAndIsDeletedFalse(UserRole.DOCTOR))
                .clinicManagerCount(userRepository.countByRoleAndIsDeletedFalse(UserRole.CLINIC_MANAGER))
                .patientCount(userRepository.countByRoleAndIsDeletedFalse(UserRole.PATIENT))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(UserRole role, String status, Long clinicId, String keyword, Pageable pageable) {
        String search = (keyword != null && !keyword.isBlank()) ? "%" + keyword.toLowerCase().trim() + "%" : null;
        return userRepository.findByFilters(role, status, clinicId, null, null, null, search, pageable).map(userMapper::toAdminUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        return userRepository.findById(id).map(userMapper::toAdminUserResponse).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    @Transactional
    public AdminUserResponse createUser(CreateUserRequest request) {
        User user = User.builder()
                .fullName(request.getFullName()).email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.valueOf(request.getRole().toUpperCase()))
                .clinicId(request.getClinicId()).status("ACTIVE").build();
        User saved = userRepository.save(user);

        if (UserRole.PATIENT.equals(saved.getRole())) {
            patientRepository.save(com.project.entity.Patient.builder()
                    .userId(saved.getId()).clinicId(saved.getClinicId()).fullName(saved.getFullName())
                    .patientCode("PT-" + (1000 + (int) (Math.random() * 9000)))
                    .joinedDate(java.time.LocalDate.now()).riskLevel("Chưa xác định").build());
        }

        auditService.recordActivity("Tạo mới", "Quản lý người dùng", "Tạo tài khoản: " + saved.getEmail(), "success");
        return userMapper.toAdminUserResponse(saved);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id).orElseThrow();
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getRole() != null) user.setRole(UserRole.valueOf(request.getRole().toUpperCase()));
        if (request.getStatus() != null) user.setStatus(request.getStatus());
        user.setClinicId(request.getClinicId());
        
        User saved = userRepository.save(user);
        auditService.recordActivity("Cập nhật", "Quản lý người dùng", "Cập nhật tài khoản: " + saved.getEmail(), "success");
        return userMapper.toAdminUserResponse(saved);
    }

    @Override
    @Transactional
    public void toggleUserStatus(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        String nextStatus = "ACTIVE".equals(user.getStatus()) ? "INACTIVE" : "ACTIVE";
        user.setStatus(nextStatus);
        userRepository.save(user);
        auditService.recordActivity("Đổi trạng thái", "Quản lý người dùng", "Đổi trạng thái tài khoản " + user.getEmail() + " sang " + nextStatus, "warning");
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setDeleted(true);
        userRepository.save(user);
        
        if (UserRole.PATIENT.equals(user.getRole())) {
            patientRepository.findByUserIdAndIsDeletedFalse(user.getId()).ifPresent(p -> {
                p.setDeleted(true);
                patientRepository.save(p);
            });
        }
        
        auditService.recordActivity("Xóa", "Quản lý người dùng", "Xóa tài khoản: " + user.getEmail(), "danger");
    }
}
