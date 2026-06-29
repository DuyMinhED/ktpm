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
public class AdminUserServiceImplTest {

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

    @BeforeAll
    public static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private CreateUserRequest request;

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
    // TC-EP-AUTH-01: Valid Email Partition
    // =========================================================================
    @Test
    void testEmailValid_TC_EP_AUTH_01() {
        request.setEmail("patient@gmail.com");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Email should be valid");
    }

    // =========================================================================
    // TC-EP-AUTH-02: Invalid Email Partition - Missing '@'
    // =========================================================================
    @Test
    void testEmailMissingAtSymbol_TC_EP_AUTH_02() {
        request.setEmail("patientgmail.com");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Email missing @ should fail validation");
    }

    // =========================================================================
    // TC-EP-AUTH-03: Invalid Email Partition - Missing Domain
    // =========================================================================
    @Test
    void testEmailMissingDomain_TC_EP_AUTH_03() {
        request.setEmail("patient@");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Email missing domain should fail validation");
    }

    // =========================================================================
    // TC-EP-AUTH-04: Valid Password Partition
    // =========================================================================
    @Test
    void testPasswordValid_TC_EP_AUTH_04() {
        request.setPassword("P@ssw123");

        SystemConfig config = SystemConfig.builder()
                .specialCharRequired(true)
                .upperNumberRequired(true)
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(config));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(new User());

        assertDoesNotThrow(() -> {
            adminUserService.createUser(request);
        });
    }

    // =========================================================================
    // TC-EP-AUTH-05: Invalid Password Partition - Too Short (< 8 chars)
    // =========================================================================
    @Test
    void testPasswordTooShort_TC_EP_AUTH_05() {
        request.setPassword("P@ss1"); // 5 chars

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.createUser(request);
        }, "Password under 8 characters should throw exception under SRS requirements");

        assertEquals("Mật khẩu phải có ít nhất 8 ký tự", exception.getMessage());
    }

    // =========================================================================
    // TC-EP-AUTH-06: Invalid Password Partition - Missing Complexity
    // =========================================================================
    @Test
    void testPasswordMissingComplexity_TC_EP_AUTH_06() {
        request.setPassword("p@ssword"); // Length >= 8 but lacks uppercase and digit

        SystemConfig config = SystemConfig.builder()
                .specialCharRequired(true)
                .upperNumberRequired(true)
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(config));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.createUser(request);
        }, "Password missing uppercase and digit complexity should throw exception");

        assertEquals("Mật khẩu phải chứa ít nhất một chữ hoa và một chữ số", exception.getMessage());
    }

    // =========================================================================
    // TC-EP-AUTH-07: Valid Account Status Partition
    // =========================================================================
    @Test
    void testStatusValid_TC_EP_AUTH_07() {
        UpdateUserRequest updateRequest = new UpdateUserRequest();
        updateRequest.setStatus("ACTIVE");

        Set<ConstraintViolation<UpdateUserRequest>> violations = validator.validate(updateRequest);
        assertTrue(violations.isEmpty(), "Status 'ACTIVE' should be valid");
    }

    // =========================================================================
    // TC-EP-AUTH-08: Invalid Account Status Partition
    // =========================================================================
    @Test
    void testStatusInvalid_TC_EP_AUTH_08() {
        UpdateUserRequest updateRequest = new UpdateUserRequest();
        updateRequest.setStatus("SUSPENDED");

        Set<ConstraintViolation<UpdateUserRequest>> violations = validator.validate(updateRequest);
        assertFalse(violations.isEmpty(), "Status 'SUSPENDED' should be invalid");
    }
}
