package com.project.service.impl;

import com.project.dto.request.CreateUserRequest;
import com.project.repository.PatientRepository;
import com.project.repository.SystemConfigRepository;
import com.project.repository.UserRepository;
import com.project.service.AuditService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

/**
 * BVA (Boundary Value Analysis) test suite for password length validation
 * on the Auth/User creation flow (SRS §6.2 - min 8 characters).
 *
 * Fix history: originally failed with UnnecessaryStubbingException because
 * mocks for passwordEncoder/userRepository.save/patientRepository.save were
 * stubbed even though createUser() throws before reaching those calls when
 * the password is shorter than 8 characters. This version only stubs the
 * collaborator that is actually invoked before the exception is thrown
 * (userRepository.findByEmail).
 */
@ExtendWith(MockitoExtension.class)
public class AuthUserBvaTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private com.project.mapper.UserMapper userMapper;

    @Mock
    private AuditService auditService;

    @Mock
    private SystemConfigRepository systemConfigRepository;

    @InjectMocks
    private AdminUserServiceImpl service;

    /**
     * TC-BVA-AUTH-01: password length = 7 (min - 1) -> must throw IllegalArgumentException
     * per SRS §6.2 ("Mật khẩu phải có ít nhất 8 ký tự").
     *
     * Only userRepository.findByEmail() is stubbed because validatePasswordPolicy()
     * throws immediately after the email-duplicate check, before passwordEncoder,
     * userRepository.save(), patientRepository.save(), or auditService are ever called.
     */
    @Test
    @DisplayName("TC-BVA-AUTH-01: Password length 7 (min-1) -> IllegalArgumentException")
    void testPasswordLength7_TC_BVA_AUTH_01() {
        CreateUserRequest request = new CreateUserRequest();
        request.setFullName("Nguyen Van A");
        request.setEmail("newuser@example.com");
        request.setPassword("P@ssw12"); // 7 characters
        request.setRole("DOCTOR");

        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.createUser(request));

        assertEquals("Mật khẩu phải có ít nhất 8 ký tự", ex.getMessage());

        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any());
        verify(patientRepository, never()).save(any());
    }

    /**
     * TC-BVA-AUTH-01b: password length = 8 (min) -> must succeed (no exception from
     * the length check). This is the boundary-passing counterpart to TC-BVA-AUTH-01,
     * confirming the ">=" edge is inclusive as required by SRS §6.2.
     */
    @Test
    @DisplayName("TC-BVA-AUTH-01b: Password length 8 (min) -> passes length check")
    void testPasswordLength8_TC_BVA_AUTH_01b() {
        CreateUserRequest request = new CreateUserRequest();
        request.setFullName("Nguyen Van B");
        request.setEmail("newuser2@example.com");
        request.setPassword("P@ssw123"); // 8 characters
        request.setRole("DOCTOR");
        request.setClinicId(1L);

        when(userRepository.findByEmail("newuser2@example.com")).thenReturn(Optional.empty());
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(passwordEncoder.encode("P@ssw123")).thenReturn("encoded-hash");
        when(userRepository.save(any())).thenAnswer(inv -> {
            com.project.entity.User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        assertDoesNotThrow(() -> service.createUser(request));

        verify(passwordEncoder).encode("P@ssw123");
        verify(userRepository).save(any());
    }

}