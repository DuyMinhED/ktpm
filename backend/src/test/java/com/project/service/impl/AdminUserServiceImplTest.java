package com.project.service.impl;

import com.project.dto.request.CreateUserRequest;
import com.project.dto.request.UpdateUserRequest;
import com.project.dto.response.AdminUserResponse;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.mapper.UserMapper;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.repository.SystemConfigRepository;
import com.project.service.AuditService;
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

@ExtendWith(MockitoExtension.class)
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
    // PASSWORD LENGTH BVA TEST CASES (MIN = 8)
    // =========================================================================

    @Test
    void testPasswordLengthMinMinusOne() {
        // Boundary Value: 7 chars (Expected to FAIL under SRS but currently PASSES in code)
        request.setPassword("P@ssw12"); 

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        // We mock save to return a non-null User so that if validatePasswordPolicy passes (bug),
        // it doesn't throw NullPointerException but completes normally, letting our assertThrows catch the bug!
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(new User());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.createUser(request);
        }, "Password with 7 characters should throw IllegalArgumentException under SRS requirements");
        
        assertEquals("Mật khẩu phải có ít nhất 8 ký tự", exception.getMessage());
    }

    @Test
    void testPasswordLengthMin() {
        // Boundary Value: 8 chars
        request.setPassword("P@ssw123"); 

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(new User());

        assertDoesNotThrow(() -> {
            adminUserService.createUser(request);
        });
    }

    @Test
    void testPasswordLengthMinPlusOne() {
        // Boundary Value: 9 chars
        request.setPassword("P@ssw1234"); 

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(new User());

        assertDoesNotThrow(() -> {
            adminUserService.createUser(request);
        });
    }

    // =========================================================================
    // EMAIL LENGTH BVA TEST CASES (MAX = 100)
    // =========================================================================

    @Test
    void testEmailLengthMax() {
        // Boundary Value: 100 chars (Local part 60 chars <= 64 limit, Domain part 35 + 4 = 39 chars)
        String longEmail = "a".repeat(60) + "@" + "b".repeat(35) + ".com";
        request.setEmail(longEmail);

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Email with 100 chars should be valid");
    }

    @Test
    void testEmailLengthMaxPlusOne() {
        // Boundary Value: 101 chars (Local part 60 chars <= 64 limit, Domain part 36 + 4 = 40 chars)
        // Expected to FAIL under SRS but currently PASSES DTO validation because of missing @Size(max=100)
        String longEmail = "a".repeat(60) + "@" + "b".repeat(36) + ".com";
        request.setEmail(longEmail);

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Email with 101 chars should fail validation");
    }

    // =========================================================================
    // FULL NAME LENGTH BVA TEST CASES (MAX = 100)
    // =========================================================================

    @Test
    void testFullNameLengthMaxMinusOne() {
        // Boundary Value: 99 chars
        request.setFullName("a".repeat(99));

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Full name with 99 chars should be valid");
    }

    @Test
    void testFullNameLengthMax() {
        // Boundary Value: 100 chars
        request.setFullName("a".repeat(100));

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Full name with 100 chars should be valid");
    }

    @Test
    void testFullNameLengthMaxPlusOne() {
        // Boundary Value: 101 chars
        request.setFullName("a".repeat(101));

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Full name with 101 chars should fail validation");
        
        ConstraintViolation<CreateUserRequest> violation = violations.iterator().next();
        assertEquals("Họ và tên không được quá 100 ký tự", violation.getMessage());
    }

    // =========================================================================
    // PHONE NUMBER LENGTH BVA TEST CASES (MAX = 20)
    // =========================================================================

    @Test
    void testPhoneLengthMax() {
        // Boundary Value: 20 chars
        request.setPhone("01234567890123456789");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Phone with 20 chars should be valid");
    }

    @Test
    void testPhoneLengthMaxPlusOne() {
        // Boundary Value: 21 chars
        request.setPhone("012345678901234567890");

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Phone with 21 chars should fail validation");

        ConstraintViolation<CreateUserRequest> violation = violations.iterator().next();
        assertEquals("Số điện thoại không được quá 20 ký tự", violation.getMessage());
    }

    // =========================================================================
    // ACCOUNT STATUS LENGTH BVA TEST CASES (MAX = 30)
    // =========================================================================

    @Test
    void testStatusLengthMaxPlusOne() {
        // Boundary Value: 31 chars (Expected to FAIL under SRS but currently PASSES DTO validation)
        UpdateUserRequest updateRequest = new UpdateUserRequest();
        updateRequest.setStatus("A".repeat(31));

        Set<ConstraintViolation<UpdateUserRequest>> violations = validator.validate(updateRequest);
        assertFalse(violations.isEmpty(), "Status with 31 chars should fail validation");
    }
}
