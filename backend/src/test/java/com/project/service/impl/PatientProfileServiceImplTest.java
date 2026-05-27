package com.project.service.impl;

import com.project.dto.request.EmergencyContactRequest;
import com.project.dto.request.UpdatePatientProfileRequest;
import com.project.dto.response.EmergencyContactResponse;
import com.project.dto.response.PatientProfileResponse;
import com.project.entity.EmergencyContact;
import com.project.entity.Patient;
import com.project.entity.User;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.EmergencyContactRepository;
import com.project.repository.PatientRepository;
import com.project.repository.PrescriptionRepository;
import com.project.repository.UserRepository;
import com.project.util.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class PatientProfileServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private EmergencyContactRepository emergencyContactRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @InjectMocks
    private PatientProfileServiceImpl patientProfileService;

    private Patient samplePatient;
    private User sampleUser;
    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .email("patient@example.com")
                .fullName("John Doe")
                .phone("123456789")
                .build();

        samplePatient = Patient.builder()
                .id(100L)
                .userId(1L)
                .fullName("John Doe")
                .email("patient@example.com")
                .phone("123456789")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .gender("MALE")
                .build();

        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    @Test
    void getCurrentPatientProfile_success() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));
        when(emergencyContactRepository.findByPatientId(100L)).thenReturn(Collections.emptyList());
        when(prescriptionRepository.findByPatientIdAndStatus(eq(100L), any())).thenReturn(Collections.emptyList());

        PatientProfileResponse response = patientProfileService.getCurrentPatientProfile();

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("John Doe", response.getFullName());
    }

    @Test
    void getCurrentPatientProfile_userNotAuthenticated() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> patientProfileService.getCurrentPatientProfile());
    }

    @Test
    void getPatientProfileById_success() {
        when(patientRepository.findById(100L)).thenReturn(Optional.of(samplePatient));
        when(emergencyContactRepository.findByPatientId(100L)).thenReturn(Collections.emptyList());
        when(prescriptionRepository.findByPatientIdAndStatus(eq(100L), any())).thenReturn(Collections.emptyList());

        PatientProfileResponse response = patientProfileService.getPatientProfileById(100L);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("John Doe", response.getFullName());
    }

    @Test
    void getPatientProfileById_notFound() {
        when(patientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> patientProfileService.getPatientProfileById(999L));
    }

    @Test
    void updateProfile_success() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));
        
        UpdatePatientProfileRequest request = new UpdatePatientProfileRequest();
        request.setFullName("Jane Doe");
        request.setPhone("987654321");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(patientRepository.save(any(Patient.class))).thenReturn(samplePatient);
        when(emergencyContactRepository.findByPatientId(100L)).thenReturn(Collections.emptyList());
        when(prescriptionRepository.findByPatientIdAndStatus(eq(100L), any())).thenReturn(Collections.emptyList());

        PatientProfileResponse response = patientProfileService.updateProfile(request);

        assertNotNull(response);
        verify(userRepository, times(1)).save(any(User.class));
        verify(patientRepository, times(1)).save(any(Patient.class));
        assertEquals("Jane Doe", sampleUser.getFullName());
    }

    @Test
    void getEmergencyContacts_success() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));

        EmergencyContact contact = EmergencyContact.builder()
                .id(10L)
                .contactName("Wife")
                .relationship("Spouse")
                .phone("111222333")
                .isPrimary(true)
                .build();

        when(emergencyContactRepository.findByPatientId(100L)).thenReturn(List.of(contact));

        List<EmergencyContactResponse> responses = patientProfileService.getEmergencyContacts();

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("Wife", responses.get(0).getContactName());
    }

    @Test
    void addEmergencyContact_success() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));

        EmergencyContactRequest request = new EmergencyContactRequest();
        request.setContactName("Brother");
        request.setRelationship("Sibling");
        request.setPhone("444555666");
        request.setPrimary(false);

        EmergencyContact savedContact = EmergencyContact.builder()
                .id(11L)
                .contactName("Brother")
                .relationship("Sibling")
                .phone("444555666")
                .isPrimary(false)
                .build();

        when(emergencyContactRepository.save(any(EmergencyContact.class))).thenReturn(savedContact);

        EmergencyContactResponse response = patientProfileService.addEmergencyContact(request);

        assertNotNull(response);
        assertEquals("Brother", response.getContactName());
        verify(emergencyContactRepository, times(1)).save(any(EmergencyContact.class));
    }

    @Test
    void updateEmergencyContact_success() {
        EmergencyContact existingContact = EmergencyContact.builder()
                .id(10L)
                .contactName("Old Name")
                .relationship("Spouse")
                .phone("111222333")
                .isPrimary(true)
                .build();

        when(emergencyContactRepository.findById(10L)).thenReturn(Optional.of(existingContact));

        EmergencyContactRequest request = new EmergencyContactRequest();
        request.setContactName("New Name");
        request.setRelationship("Spouse");
        request.setPhone("999888777");
        request.setPrimary(true);

        when(emergencyContactRepository.save(any(EmergencyContact.class))).thenReturn(existingContact);

        EmergencyContactResponse response = patientProfileService.updateEmergencyContact(10L, request);

        assertNotNull(response);
        assertEquals("New Name", response.getContactName());
        assertEquals("999888777", response.getPhone());
    }

    @Test
    void generateReport_success() {
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(Optional.of(1L));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(samplePatient));

        byte[] report = patientProfileService.generateReport();

        assertNotNull(report);
        assertTrue(report.length > 0);
        String reportStr = new String(report, java.nio.charset.StandardCharsets.UTF_8);
        assertTrue(reportStr.contains("John Doe"));
    }
}
