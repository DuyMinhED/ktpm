package com.project.controller;

import com.project.dto.request.LoginRequest;
import com.project.dto.response.ApiResponse;
import com.project.dto.response.JwtAuthenticationResponse;
import com.project.security.JwtTokenProvider;
import com.project.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthRestController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ApiResponse<JwtAuthenticationResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Attempting login for user: {}", loginRequest.getEmail());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            String role = userDetails.getAuthorities().iterator().next().getAuthority();
            
            log.info("Login successful for user: {}, role: {}", loginRequest.getEmail(), role);
            return ApiResponse.<JwtAuthenticationResponse>success("Login successful", new JwtAuthenticationResponse(jwt, userDetails.getId(), userDetails.getClinicId(), role, userDetails.getFullName(), userDetails.getAvatarUrl()));
        } catch (Exception e) {
            log.error("Login failed for user: {}. Error: {}", loginRequest.getEmail(), e.getMessage());
            throw e;
        }
    }
}
