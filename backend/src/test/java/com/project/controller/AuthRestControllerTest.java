package com.project.controller;

import com.project.dto.request.LoginRequest;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.JwtAuthenticationResponse;
import com.project.security.CustomUserDetails;
import com.project.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthRestControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthRestController authRestController;

    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setEmail("patient@care.com");
        loginRequest.setPassword("admin123");
    }

    // =========================================================================
    // TC-WB-01: Path 1 - Đăng nhập thành công (Success path)
    // =========================================================================
    @Test
    @SuppressWarnings("unchecked")
    void authenticateUser_Success_TC_WB_01() {
        Authentication authentication = mock(Authentication.class);
        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(tokenProvider.generateToken(authentication)).thenReturn("valid_jwt_token");
        when(authentication.getPrincipal()).thenReturn(userDetails);
        
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_PATIENT");
        doReturn(Collections.singletonList(authority)).when(userDetails).getAuthorities();
        
        when(userDetails.getId()).thenReturn(1L);
        when(userDetails.getClinicId()).thenReturn(2L);
        when(userDetails.getFullName()).thenReturn("Nguyen Van A");
        when(userDetails.getAvatarUrl()).thenReturn("avatar.png");

        ApiResponse<JwtAuthenticationResponse> response = authRestController.authenticateUser(loginRequest);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("Login successful", response.getMessage());
        assertEquals("valid_jwt_token", response.getData().getAccessToken());
        assertEquals(1L, response.getData().getId());
        assertEquals(2L, response.getData().getClinicId());
        assertEquals("ROLE_PATIENT", response.getData().getRole());
        assertEquals("Nguyen Van A", response.getData().getFullName());
        assertEquals("avatar.png", response.getData().getAvatarUrl());
    }

    // =========================================================================
    // TC-WB-02: Path 2 - Lỗi xác thực thông tin đăng nhập (Bad credentials)
    // =========================================================================
    @Test
    void authenticateUser_BadCredentials_TC_WB_02() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid username or password"));

        assertThrows(BadCredentialsException.class, () -> {
            authRestController.authenticateUser(loginRequest);
        });

        verify(tokenProvider, never()).generateToken(any(Authentication.class));
    }

    // =========================================================================
    // TC-WB-03: Path 3 - Lỗi hệ thống khi tạo Token (System error during token generation)
    // =========================================================================
    @Test
    void authenticateUser_TokenGenerationError_TC_WB_03() {
        Authentication authentication = mock(Authentication.class);
        
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(tokenProvider.generateToken(authentication))
                .thenThrow(new IllegalArgumentException("JWT secret cannot be null"));

        assertThrows(IllegalArgumentException.class, () -> {
            authRestController.authenticateUser(loginRequest);
        });
    }
}
