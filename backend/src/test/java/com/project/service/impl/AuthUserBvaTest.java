package com.project.service.impl;

import com.project.dto.request.CreateUserRequest;
import com.project.dto.request.UpdateUserRequest;
import com.project.entity.User;
import com.project.entity.SystemConfig;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.repository.SystemConfigRepository;
import com.project.service.AuditService;
import com.project.mapper.UserMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith({MockitoExtension.class, JiraBugSyncExtension.class})
public class AuthUserBvaTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private AuditService auditService;

    @Mock
    private SystemConfigRepository systemConfigRepository;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private static Validator validator;
    private CreateUserRequest request;

    @BeforeAll
    public static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @BeforeEach
    void setUp() {
        request = new CreateUserRequest();
        request.setFullName("Nguyen Van A");
        request.setEmail("test@gmail.com");
        request.setPassword("P@ssw123");
        request.setRole("PATIENT");
        request.setPhone("0123456789");
    }

    // =========================================================================
    // TC-BVA-AUTH-01: Password Length Min = 8 (Boundary: Min - 1 = 7)
    // Expected: Thất bại (Ném IllegalArgumentException hoặc Validation Error)
    // =========================================================================
    @Test
    void testPasswordLength7_TC_BVA_AUTH_01() {
        request.setPassword("P@ssw12"); // 7 ký tự

        SystemConfig config = SystemConfig.builder()
                .specialCharRequired(true)
                .upperNumberRequired(true)
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(config));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        
        // Mock saved user to avoid NullPointerException in service
        User savedUser = User.builder()
                .id(1L)
                .email(request.getEmail())
                .role(com.project.entity.UserRole.PATIENT)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Dưới yêu cầu SRS, mật khẩu phải từ 8 ký tự trở lên. Do đó mong đợi ném exception.
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.createUser(request);
        }, "Mật khẩu dưới 8 ký tự phải ném ngoại lệ theo SRS");

        assertEquals("Mật khẩu phải có ít nhất 8 ký tự", exception.getMessage());
    }

    // =========================================================================
    // TC-BVA-AUTH-02: Password Length Min = 8 (Boundary: Min = 8)
    // Expected: Thành công (Tạo tài khoản thành công)
    // =========================================================================
    @Test
    void testPasswordLength8_TC_BVA_AUTH_02() {
        request.setPassword("P@ssw123"); // 8 ký tự

        SystemConfig config = SystemConfig.builder()
                .specialCharRequired(true)
                .upperNumberRequired(true)
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(config));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        
        User savedUser = User.builder()
                .id(1L)
                .email(request.getEmail())
                .role(com.project.entity.UserRole.PATIENT)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        assertDoesNotThrow(() -> {
            adminUserService.createUser(request);
        });
    }

    // =========================================================================
    // TC-BVA-AUTH-03: Email Length Max = 100 (Boundary: Max = 100)
    // Expected: Thành công
    // =========================================================================
    @Test
    void testEmailLength100_TC_BVA_AUTH_03() {
        // Tạo email 100 ký tự với phần local-part hợp lệ (<= 64 ký tự) theo tiêu chuẩn RFC
        request.setEmail("a".repeat(60) + "@" + "b".repeat(35) + ".com"); // 60 + 1 + 35 + 4 = 100
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Email 100 ký tự phải hợp lệ");
    }

    // =========================================================================
    // TC-BVA-AUTH-04: Email Length Max = 100 (Boundary: Max + 1 = 101)
    // Expected: Thất bại (Lỗi Validation)
    // =========================================================================
    @Test
    void testEmailLength101_TC_BVA_AUTH_04() {
        // Tạo email 101 ký tự với phần local-part hợp lệ (<= 64 ký tự) theo tiêu chuẩn RFC
        request.setEmail("a".repeat(60) + "@" + "b".repeat(36) + ".com"); // 60 + 1 + 36 + 4 = 101
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Email 101 ký tự phải bị loại trừ (Validation Error)");
    }

    // =========================================================================
    // TC-BVA-AUTH-05: Full Name Length Max = 100 (Boundary: Max - 1 = 99)
    // Expected: Thành công
    // =========================================================================
    @Test
    void testFullNameLength99_TC_BVA_AUTH_05() {
        request.setFullName("n".repeat(99));
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Họ tên 99 ký tự phải hợp lệ");
    }

    // =========================================================================
    // TC-BVA-AUTH-06: Full Name Length Max = 100 (Boundary: Max = 100)
    // Expected: Thành công
    // =========================================================================
    @Test
    void testFullNameLength100_TC_BVA_AUTH_06() {
        request.setFullName("n".repeat(100));
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Họ tên 100 ký tự phải hợp lệ");
    }

    // =========================================================================
    // TC-BVA-AUTH-07: Full Name Length Max = 100 (Boundary: Max + 1 = 101)
    // Expected: Thất bại (Lỗi Validation)
    // =========================================================================
    @Test
    void testFullNameLength101_TC_BVA_AUTH_07() {
        request.setFullName("n".repeat(101));
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Họ tên 101 ký tự phải không hợp lệ");
    }

    // =========================================================================
    // TC-BVA-AUTH-08: Phone Length Max = 20 (Boundary: Max = 20)
    // Expected: Thành công
    // =========================================================================
    @Test
    void testPhoneLength20_TC_BVA_AUTH_08() {
        request.setPhone("01234567890123456789"); // 20 ký tự
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Số điện thoại 20 ký tự phải hợp lệ");
    }

    // =========================================================================
    // TC-BVA-AUTH-09: Phone Length Max = 20 (Boundary: Max + 1 = 21)
    // Expected: Thất bại (Lỗi Validation)
    // =========================================================================
    @Test
    void testPhoneLength21_TC_BVA_AUTH_09() {
        request.setPhone("012345678901234567890"); // 21 ký tự
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Số điện thoại 21 ký tự phải không hợp lệ");
    }

    // =========================================================================
    // TC-BVA-AUTH-10: Status Length Max = 30 (Boundary: Max + 1 = 31)
    // Expected: Thất bại (Lỗi Validation)
    // =========================================================================
    @Test
    void testStatusLength31_TC_BVA_AUTH_10() {
        UpdateUserRequest updateRequest = new UpdateUserRequest();
        updateRequest.setStatus("A".repeat(31)); // 31 ký tự
        Set<ConstraintViolation<UpdateUserRequest>> violations = validator.validate(updateRequest);
        assertFalse(violations.isEmpty(), "Trạng thái tài khoản 31 ký tự phải không hợp lệ");
    }
}
