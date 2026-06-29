package com.project.service.impl;

import com.project.dto.request.CreateUserRequest;
import com.project.dto.request.UpdateUserRequest;
import com.project.entity.User;
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
    // TC-BVA-AUTH-01: Password Length Min-1 (7 chars)
    // =========================================================================
    @Test
    void testPasswordLengthMinMinusOne_TC_BVA_AUTH_01() {
        request.setPassword("P@ssw12"); 

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(new User());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.createUser(request);
        }, "Password with 7 characters should throw IllegalArgumentException under SRS requirements");
        
        assertEquals("Mật khẩu phải có ít nhất 8 ký tự", exception.getMessage());
    }

    // =========================================================================
    // TC-BVA-AUTH-02: Password Length Min (8 chars)
    // =========================================================================
    @Test
    void testPasswordLengthMin_TC_BVA_AUTH_02() {
        request.setPassword("P@ssw123"); 

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(new User());

        assertDoesNotThrow(() -> {
            adminUserService.createUser(request);
        });
    }

    // =========================================================================
    // TC-BVA-AUTH-03: Email Length Max (100 chars)
    // =========================================================================
    @Test
    void testEmailLengthMax_TC_BVA_AUTH_03() {
        String longEmail = "a".repeat(60) + "@" + "b".repeat(35) + ".com";
        request.setEmail(longEmail);

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Email with 100 chars should be valid");
    }

    // =========================================================================
    // TC-BVA-AUTH-04: Email Length Max+1 (101 chars)
    // =========================================================================
    @Test
    void testEmailLengthMaxPlusOne_TC_BVA_AUTH_04() {
        String longEmail = "a".repeat(60) + "@" + "b".repeat(36) + ".com";
        request.setEmail(longEmail);

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Email with 101 chars should fail validation");
    }

    // =========================================================================
    // TC-BVA-AUTH-05: Full Name Length Max-1 (99 chars)
    // =========================================================================
    @Test
    void testFullNameLengthMaxMinusOne_TC_BVA_AUTH_05() {
        request.setFullName("a".repeat(99));

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Full name with 99 chars should be valid");
    }

    // =========================================================================
    // TC-BVA-AUTH-06: Full Name Length Max (100 chars)
    // =========================================================================
    @Test
    void testFullNameLengthMax_TC_BVA_AUTH_06() {
        request.setFullName("a".repeat(100));

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Full name with 100 chars should be valid");
    }

    // =========================================================================
    // TC-BVA-AUTH-07: Full Name Length Max+1 (101 chars)
    // =========================================================================
    @Test
    void testFullNameLengthMaxPlusOne_TC_BVA_AUTH_07() {
        request.setFullName("a".repeat(101));

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Full name with 101 chars should fail validation");
        
        ConstraintViolation<CreateUserRequest> violation = violations.iterator().next();
        assertEquals("Họ và tên không được quá 100 ký tự", violation.getMessage());
    }

    // =========================================================================
    // TC-BVA-AUTH-08: Phone Number Length Max (20 chars)
    // =========================================================================
    @Test
    void testPhoneLengthMax_TC_BVA_AUTH_08() {
        request.setPhone("01234567890123456789");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Phone with 20 chars should be valid");
    }

    // =========================================================================
    // TC-BVA-AUTH-09: Phone Number Length Max+1 (21 chars)
    // =========================================================================
    @Test
    void testPhoneLengthMaxPlusOne_TC_BVA_AUTH_09() {
        request.setPhone("012345678901234567890");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Phone with 21 chars should fail validation");

        ConstraintViolation<CreateUserRequest> violation = violations.iterator().next();
        assertEquals("Số điện thoại không được quá 20 ký tự", violation.getMessage());
    }

    // =========================================================================
    // TC-BVA-AUTH-10: Account Status Length Max+1 (31 chars)
    // =========================================================================
    @Test
    void testStatusLengthMaxPlusOne_TC_BVA_AUTH_10() {
        UpdateUserRequest updateRequest = new UpdateUserRequest();
        updateRequest.setStatus("A".repeat(31));

        Set<ConstraintViolation<UpdateUserRequest>> violations = validator.validate(updateRequest);
        assertFalse(violations.isEmpty(), "Status with 31 chars should fail validation");
    }
}
