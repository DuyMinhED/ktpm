package com.project.security;

import com.project.entity.Patient;
import com.project.repository.PatientRepository;
import com.project.repository.SupportTicketRepository;
import com.project.entity.SupportTicket;
import com.project.util.RoleUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private SupportTicketRepository supportTicketRepository;

    @InjectMocks
    private SecurityService securityService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void canAccessPatient_rejectsMissingUserRolePatientAndUnknownRole() {
        assertFalse(securityService.canAccessPatient(1L));

        authenticate(10L, null, 2L);
        assertFalse(securityService.canAccessPatient(1L));

        authenticate(10L, RoleUtils.DOCTOR, 2L);
        when(patientRepository.findById(1L)).thenReturn(Optional.empty());
        assertFalse(securityService.canAccessPatient(1L));

        authenticate(10L, "SUPPORT", 2L);
        when(patientRepository.findById(2L)).thenReturn(Optional.of(patient(2L, 20L, 3L)));
        assertFalse(securityService.canAccessPatient(2L));
    }

    @Test
    void canAccessPatient_allowsAdminWithoutRepositoryLookup() {
        authenticate(1L, RoleUtils.ADMIN, null);

        assertTrue(securityService.canAccessPatient(99L));
        verify(patientRepository, never()).findById(99L);
    }

    @Test
    void canAccessPatient_clinicManagerRequiresSameClinicAndNonNullClinic() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient(1L, 20L, 2L)));

        authenticate(11L, RoleUtils.CLINIC_MANAGER, 2L);
        assertTrue(securityService.canAccessPatient(1L));

        authenticate(11L, RoleUtils.CLINIC_MANAGER, 3L);
        assertFalse(securityService.canAccessPatient(1L));

        authenticate(11L, RoleUtils.CLINIC_MANAGER, null);
        assertFalse(securityService.canAccessPatient(1L));
    }

    @Test
    void canAccessPatient_doctorRequiresAssignedPatient() {
        Patient assignedPatient = patient(1L, 20L, 2L);
        assignedPatient.setDoctorId(12L);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(assignedPatient));

        authenticate(12L, RoleUtils.DOCTOR, 2L);
        assertTrue(securityService.canAccessPatient(1L));

        authenticate(13L, RoleUtils.DOCTOR, 2L);
        assertFalse(securityService.canAccessPatient(1L));

        authenticate(null, RoleUtils.DOCTOR, 2L);
        assertFalse(securityService.canAccessPatient(1L));
    }

    @Test
    void canAccessPatient_patientRequiresOwnUserId() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient(1L, 20L, 2L)));

        authenticate(20L, RoleUtils.PATIENT, null);
        assertTrue(securityService.canAccessPatient(1L));

        authenticate(21L, RoleUtils.PATIENT, null);
        assertFalse(securityService.canAccessPatient(1L));
    }

    @Test
    void isClinicManagerOf_coversAdminManagerAndRejectedRoles() {
        assertFalse(securityService.isClinicManagerOf(2L));

        authenticate(1L, null, 2L);
        assertFalse(securityService.isClinicManagerOf(2L));

        authenticate(1L, RoleUtils.ADMIN, null);
        assertTrue(securityService.isClinicManagerOf(2L));

        authenticate(1L, RoleUtils.CLINIC_MANAGER, 2L);
        assertTrue(securityService.isClinicManagerOf(2L));

        authenticate(1L, RoleUtils.CLINIC_MANAGER, null);
        assertFalse(securityService.isClinicManagerOf(2L));

        authenticate(1L, RoleUtils.CLINIC_MANAGER, 3L);
        assertFalse(securityService.isClinicManagerOf(2L));

        authenticate(1L, RoleUtils.DOCTOR, 2L);
        assertFalse(securityService.isClinicManagerOf(2L));
    }

    @Test
    void isDoctorOfClinic_coversAdminDoctorAndRejectedRoles() {
        assertFalse(securityService.isDoctorOfClinic(2L));

        authenticate(1L, null, 2L);
        assertFalse(securityService.isDoctorOfClinic(2L));

        authenticate(1L, RoleUtils.ADMIN, null);
        assertTrue(securityService.isDoctorOfClinic(2L));

        authenticate(1L, RoleUtils.DOCTOR, 2L);
        assertTrue(securityService.isDoctorOfClinic(2L));

        authenticate(1L, RoleUtils.DOCTOR, null);
        assertFalse(securityService.isDoctorOfClinic(2L));

        authenticate(1L, RoleUtils.DOCTOR, 3L);
        assertFalse(securityService.isDoctorOfClinic(2L));

        authenticate(1L, RoleUtils.CLINIC_MANAGER, 2L);
        assertFalse(securityService.isDoctorOfClinic(2L));
    }

    @Test
    void isDoctorSelf_requiresDoctorRoleAndMatchingNonNullId() {
        assertFalse(securityService.isDoctorSelf(12L));

        authenticate(12L, null, 2L);
        assertFalse(securityService.isDoctorSelf(12L));

        authenticate(12L, RoleUtils.DOCTOR, 2L);
        assertTrue(securityService.isDoctorSelf(12L));

        authenticate(null, RoleUtils.DOCTOR, 2L);
        assertFalse(securityService.isDoctorSelf(12L));

        authenticate(13L, RoleUtils.DOCTOR, 2L);
        assertFalse(securityService.isDoctorSelf(12L));

        authenticate(12L, RoleUtils.ADMIN, null);
        assertFalse(securityService.isDoctorSelf(12L));
    }

    private void authenticate(Long userId, String role, Long clinicId) {
        CustomUserDetails principal = CustomUserDetails.builder()
                .id(userId)
                .email("user@example.com")
                .role(role)
                .clinicId(clinicId)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private Patient patient(Long id, Long userId, Long clinicId) {
        return Patient.builder()
                .id(id)
                .userId(userId)
                .clinicId(clinicId)
                .fullName("Patient " + id)
                .phone("090000000" + id)
                .gender("M")
                .build();
    }

    @Test
    void isUserSelf_returnsTrueForMatchingUserId() {
        assertFalse(securityService.isUserSelf(10L));

        authenticate(10L, RoleUtils.PATIENT, null);
        assertTrue(securityService.isUserSelf(10L));
        assertFalse(securityService.isUserSelf(11L));
    }

    @Test
    void canAccessTicket_allowsAdminOrManagerOrCreator() {
        SupportTicket ticket = SupportTicket.builder()
                .id(1L)
                .ticketCode("TKT-1")
                .clinicId(2L)
                .creatorId(10L)
                .build();
        
        // Unauthenticated
        assertFalse(securityService.canAccessTicket(1L));

        // Admin
        authenticate(99L, RoleUtils.ADMIN, null);
        assertTrue(securityService.canAccessTicket(1L));

        // Clinic Manager - same clinic
        authenticate(20L, RoleUtils.CLINIC_MANAGER, 2L);
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        assertTrue(securityService.canAccessTicket(1L));

        // Clinic Manager - different clinic
        authenticate(20L, RoleUtils.CLINIC_MANAGER, 3L);
        assertFalse(securityService.canAccessTicket(1L));

        // Creator - patient
        authenticate(10L, RoleUtils.PATIENT, null);
        assertTrue(securityService.canAccessTicket(1L));

        // Non-creator - patient
        authenticate(11L, RoleUtils.PATIENT, null);
        assertFalse(securityService.canAccessTicket(1L));
        
        // Ticket not found
        authenticate(10L, RoleUtils.PATIENT, null);
        when(supportTicketRepository.findById(99L)).thenReturn(Optional.empty());
        assertFalse(securityService.canAccessTicket(99L));
    }

    @Test
    void canAccessTicketByCode_allowsAdminOrManagerOrCreator() {
        SupportTicket ticket = SupportTicket.builder()
                .id(1L)
                .ticketCode("TKT-1")
                .clinicId(2L)
                .creatorId(10L)
                .build();

        // Admin
        authenticate(99L, RoleUtils.ADMIN, null);
        assertTrue(securityService.canAccessTicketByCode("TKT-1"));

        // Creator
        authenticate(10L, RoleUtils.PATIENT, null);
        when(supportTicketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));
        assertTrue(securityService.canAccessTicketByCode("TKT-1"));

        // Ticket not found
        authenticate(10L, RoleUtils.PATIENT, null);
        when(supportTicketRepository.findByTicketCode("INVALID")).thenReturn(Optional.empty());
        assertFalse(securityService.canAccessTicketByCode("INVALID"));
    }
}
