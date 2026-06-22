package com.project.security;

import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CustomUserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsServiceImpl customUserDetailsService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("Test User")
                .password("hashed_password")
                .role(UserRole.DOCTOR)
                .clinicId(5L)
                .avatarUrl("http://avatar.url")
                .build();
    }

    @Test
    void loadUserByUsername_success() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));

        UserDetails result = customUserDetailsService.loadUserByUsername("USER@EXAMPLE.COM");

        assertNotNull(result);
        assertEquals("user@example.com", result.getUsername());
        assertEquals("hashed_password", result.getPassword());
        assertTrue(result.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_DOCTOR")));
        verify(userRepository, times(1)).findByEmail("user@example.com");
    }

    @Test
    void loadUserByUsername_notFound_shouldThrowException() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, 
                () -> customUserDetailsService.loadUserByUsername("nonexistent@example.com"));
        verify(userRepository, times(1)).findByEmail("nonexistent@example.com");
    }
}
