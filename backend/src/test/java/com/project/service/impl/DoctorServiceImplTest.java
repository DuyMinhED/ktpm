package com.project.service.impl;

import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.DoctorResponse;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DoctorServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DoctorServiceImpl doctorService;

    private User sampleDoctor;
    private CreateDoctorRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleDoctor = User.builder()
                .id(1L)
                .email("doctor@example.com")
                .fullName("Dr. John Smith")
                .phone("0123456789")
                .role(UserRole.DOCTOR)
                .specialization("Cardiology")
                .licenseNumber("12345-CCHN")
                .status("ACTIVE")
                .build();

        sampleRequest = new CreateDoctorRequest();
        sampleRequest.setName("Dr. John Smith");
        sampleRequest.setEmail("doctor@example.com");
        sampleRequest.setPhone("0123456789");
        sampleRequest.setSpecialty("Cardiology");
        sampleRequest.setLicenseNumber("12345-CCHN");
        sampleRequest.setPassword("securePassword123");
    }

    @Test
    void getDoctors_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(Collections.singletonList(sampleDoctor));

        when(userRepository.findByFilters(
                eq(UserRole.DOCTOR), eq("ACTIVE"), isNull(), eq("Cardiology"),
                isNull(), isNull(), eq("Smith"), eq(pageable)
        )).thenReturn(userPage);

        Page<DoctorResponse> result = doctorService.getDoctors("Cardiology", "Smith", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Dr. John Smith", result.getContent().get(0).getFullName());
        verify(userRepository, times(1)).findByFilters(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void getDoctorById_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        DoctorResponse result = doctorService.getDoctorById(1L);

        assertNotNull(result);
        assertEquals("Dr. John Smith", result.getFullName());
        assertEquals("Cardiology", result.getSpecialization());
    }

    @Test
    void getDoctorById_notFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> doctorService.getDoctorById(99L));
    }

    @Test
    void getDoctorById_wrongRole() {
        User patientUser = User.builder()
                .id(2L)
                .email("patient@example.com")
                .role(UserRole.PATIENT)
                .build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(patientUser));

        assertThrows(RuntimeException.class, () -> doctorService.getDoctorById(2L));
    }

    @Test
    void createDoctor_success() {
        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleDoctor);

        DoctorResponse result = doctorService.createDoctor(sampleRequest);

        assertNotNull(result);
        assertEquals("Dr. John Smith", result.getFullName());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void createDoctor_nullPassword_success() {
        sampleRequest.setPassword(null);
        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("DefaultPassword123")).thenReturn("hashedDefaultPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleDoctor);

        DoctorResponse result = doctorService.createDoctor(sampleRequest);

        assertNotNull(result);
        verify(passwordEncoder, times(1)).encode("DefaultPassword123");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void createDoctor_duplicateDoctorEmail_returnsExistingDoctor() {
        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(sampleDoctor));

        DoctorResponse result = doctorService.createDoctor(sampleRequest);

        assertNotNull(result);
        assertEquals("doctor@example.com", result.getEmail());
        assertEquals("Dr. John Smith", result.getFullName());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createDoctor_duplicateNonDoctorEmailThrowsBadRequest() {
        User patient = User.builder()
                .id(2L)
                .email("doctor@example.com")
                .role(UserRole.PATIENT)
                .status("ACTIVE")
                .build();
        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(patient));

        assertThrows(IllegalArgumentException.class, () -> doctorService.createDoctor(sampleRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateDoctor_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(userRepository.save(any(User.class))).thenReturn(sampleDoctor);

        DoctorResponse result = doctorService.updateDoctor(1L, sampleRequest);

        assertNotNull(result);
        assertEquals("Dr. John Smith", result.getFullName());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void updateDoctor_notFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> doctorService.updateDoctor(99L, sampleRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateDoctor_deletedDoctor_shouldThrowException() {
        sampleDoctor.setDeleted(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        assertThrows(RuntimeException.class, () -> doctorService.updateDoctor(1L, sampleRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateDoctor_wrongRole_shouldThrowException() {
        sampleDoctor.setRole(UserRole.PATIENT);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        assertThrows(RuntimeException.class, () -> doctorService.updateDoctor(1L, sampleRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateDoctor_withAllOptionalFields_success() {
        sampleRequest.setAvatarUrl("http://avatar.url");
        sampleRequest.setLicenseImageUrl("http://license.url");
        sampleRequest.setBio("Experienced doctor");
        sampleRequest.setPassword("newSecurePassword");
        sampleRequest.setStatus("INACTIVE");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(passwordEncoder.encode("newSecurePassword")).thenReturn("hashedNewPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DoctorResponse result = doctorService.updateDoctor(1L, sampleRequest);

        assertNotNull(result);
        verify(passwordEncoder, times(1)).encode("newSecurePassword");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void updateDoctor_withEmptyOptionalFields_success() {
        sampleRequest.setAvatarUrl("");
        sampleRequest.setLicenseImageUrl("");
        sampleRequest.setBio(null);
        sampleRequest.setPassword("");
        sampleRequest.setStatus(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DoctorResponse result = doctorService.updateDoctor(1L, sampleRequest);

        assertNotNull(result);
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void getDoctorById_deletedDoctor_shouldThrowException() {
        sampleDoctor.setDeleted(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        assertThrows(RuntimeException.class, () -> doctorService.getDoctorById(1L));
    }

    @Test
    void getDoctorById_wrongRole_shouldThrowException() {
        sampleDoctor.setRole(UserRole.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        assertThrows(RuntimeException.class, () -> doctorService.getDoctorById(1L));
    }

    @Test
    void deleteDoctor_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(userRepository.save(any(User.class))).thenReturn(sampleDoctor);

        doctorService.deleteDoctor(1L);

        assertTrue(sampleDoctor.isDeleted());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void deleteDoctor_notFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> doctorService.deleteDoctor(99L));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteDoctor_deletedDoctor_shouldThrowException() {
        sampleDoctor.setDeleted(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        assertThrows(RuntimeException.class, () -> doctorService.deleteDoctor(1L));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteDoctor_wrongRole_shouldThrowException() {
        sampleDoctor.setRole(UserRole.CLINIC_MANAGER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        assertThrows(RuntimeException.class, () -> doctorService.deleteDoctor(1L));
        verify(userRepository, never()).save(any(User.class));
    }
}

