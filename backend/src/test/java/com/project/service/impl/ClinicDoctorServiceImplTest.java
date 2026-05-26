package com.project.service.impl;

import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.ClinicDoctorResponse;
import com.project.dto.response.DoctorSnippetDto;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.repository.PatientRepository;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ClinicDoctorServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private ClinicDoctorServiceImpl clinicDoctorService;

    private User sampleDoctor;

    @BeforeEach
    void setUp() {
        sampleDoctor = User.builder()
                .id(1L)
                .email("doctor@example.com")
                .password("password")
                .role(UserRole.DOCTOR)
                .fullName("Dr. Test")
                .phone("0123456789")
                .clinicId(10L)
                .specialization("Cardiology")
                .degree("MD")
                .experience("5 years")
                .licenseNumber("LIC123")
                .avatarUrl("http://avatar.url")
                .licenseImageUrl("http://license.url")
                .bio("Test bio")
                .status("ACTIVE")
                .build();
    }

    @Test
    void getDoctorRecords_shouldReturnMappedResponsesWithLoadCounts() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> doctorPage = new PageImpl<>(Collections.singletonList(sampleDoctor));
        List<Object[]> counts = Collections.singletonList(new Object[]{sampleDoctor.getId(), 3L});

        when(userRepository.findByFilters(eq(UserRole.DOCTOR), eq("ACTIVE"), eq(10L), eq("Cardiology"), eq("MD"), eq("5 years"), eq("Test"), eq(pageable)))
                .thenReturn(doctorPage);
        when(patientRepository.countPatientsByDoctorIds(10L)).thenReturn(counts);

        Page<ClinicDoctorResponse> result = clinicDoctorService.getDoctorRecords(10L, "Test", "ACTIVE", "Cardiology", "MD", "5 years", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        ClinicDoctorResponse response = result.getContent().get(0);
        assertEquals(sampleDoctor.getId(), response.getDbId());
        assertEquals("D-1001", response.getId());
        assertEquals("Dr. Test", response.getName());
        assertEquals(3, response.getLoad());
    }

    @Test
    void createDoctor_shouldSaveNewDoctor() {
        CreateDoctorRequest request = new CreateDoctorRequest();
        request.setName("Dr. New");
        request.setEmail("newdoctor@example.com");
        request.setPhone("0987654321");
        request.setSpecialty("Dermatology");
        request.setLicenseNumber("LIC999");
        request.setDegree("PhD");
        request.setExperience("10 years");
        request.setBio("New doctor bio");
        request.setPassword("secret");
        request.setAvatarUrl("http://avatar.new");
        request.setLicenseImageUrl("http://license.new");

        when(userRepository.findByEmail("newdoctor@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("encoded-secret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        clinicDoctorService.createDoctor(10L, request);

        verify(userRepository, times(1)).findByEmail("newdoctor@example.com");
        verify(passwordEncoder, times(1)).encode("secret");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void createDoctor_existingEmail_shouldThrowException() {
        CreateDoctorRequest request = new CreateDoctorRequest();
        request.setEmail("doctor@example.com");

        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(sampleDoctor));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> clinicDoctorService.createDoctor(10L, request));
        assertEquals("Email already exists", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateDoctor_unauthorizedClinic_shouldThrowAccessDeniedException() {
        CreateDoctorRequest request = new CreateDoctorRequest();
        request.setName("Hacker");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));

        assertThrows(AccessDeniedException.class, () -> clinicDoctorService.updateDoctor(99L, 1L, request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteDoctor_shouldMarkDoctorDeleted() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleDoctor));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        clinicDoctorService.deleteDoctor(10L, 1L);

        assertTrue(sampleDoctor.isDeleted());
        verify(userRepository, times(1)).save(sampleDoctor);
    }

    @Test
    void deleteDoctor_notFound_shouldThrowException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> clinicDoctorService.deleteDoctor(10L, 99L));
        assertEquals("Doctor not found", ex.getMessage());
    }

    @Test
    void getDoctorNames_shouldReturnNamesFromDoctors() {
        User anotherDoctor = User.builder()
                .id(2L)
                .fullName("Dr. Second")
                .build();
        when(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(10L, UserRole.DOCTOR))
                .thenReturn(Arrays.asList(sampleDoctor, anotherDoctor));

        List<String> names = clinicDoctorService.getDoctorNames(10L);

        assertEquals(2, names.size());
        assertTrue(names.contains("Dr. Test"));
        assertTrue(names.contains("Dr. Second"));
    }

    @Test
    void getAvailableDoctors_shouldReturnSnippetDtosWithPatientCounts() {
        User secondDoctor = User.builder()
                .id(2L)
                .fullName("Dr. Second")
                .specialization("Neurology")
                .avatarUrl("http://avatar.second")
                .build();

        when(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(10L, UserRole.DOCTOR))
                .thenReturn(Arrays.asList(sampleDoctor, secondDoctor));
        when(patientRepository.countPatientsByDoctorIds(10L))
                .thenReturn(Arrays.asList(new Object[]{1L, 4L}, new Object[]{2L, 2L}));

        List<DoctorSnippetDto> snippets = clinicDoctorService.getAvailableDoctors(10L);

        assertEquals(2, snippets.size());
        assertEquals(4, snippets.get(0).getPatientCount());
        assertEquals(2, snippets.get(1).getPatientCount());
        assertEquals("Dr. Test", snippets.get(0).getName());
        assertEquals("Dr. Second", snippets.get(1).getName());
    }
}
