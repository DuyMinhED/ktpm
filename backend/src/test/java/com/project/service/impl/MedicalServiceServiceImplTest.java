package com.project.service.impl;

import com.project.dto.response.AdminMedicalServiceStatsResponse;
import com.project.entity.MedicalService;
import com.project.entity.UserRole;
import com.project.repository.MedicalServiceRepository;
import com.project.repository.UserRepository;
import com.project.security.CustomUserDetails;
import com.project.service.AuditService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class MedicalServiceServiceImplTest {

    private static final String ACTIVE = "Đang kinh doanh";
    private static final String INACTIVE = "Ngừng kinh doanh";

    private final MedicalServiceRepository medicalServiceRepository = mock(MedicalServiceRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final MedicalServiceServiceImpl service = new MedicalServiceServiceImpl(
            medicalServiceRepository, userRepository, auditService);

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAllServices_usesClinicScopedQueryWhenClinicIdPresent() {
        List<MedicalService> services = List.of(serviceEntity(1L, null, ACTIVE));
        when(medicalServiceRepository.findAllGlobalAndByClinicId(10L)).thenReturn(services);

        assertSame(services, service.getAllServices(10L));
    }

    @Test
    void getAllServices_withoutClinicIdUsesFindAll() {
        List<MedicalService> services = List.of(serviceEntity(1L, 10L, ACTIVE));
        when(medicalServiceRepository.findAll()).thenReturn(services);

        assertSame(services, service.getAllServices(null));
    }

    @Test
    void getServiceById_returnsServiceOrThrows() {
        MedicalService existing = serviceEntity(1L, 10L, ACTIVE);
        when(medicalServiceRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(medicalServiceRepository.findById(404L)).thenReturn(Optional.empty());

        assertSame(existing, service.getServiceById(1L));
        assertThrows(com.project.exception.ResourceNotFoundException.class, () -> service.getServiceById(404L));
        assertThrows(NullPointerException.class, () -> service.getServiceById(null));
    }

    @Test
    void createService_clinicManagerAssignsOwnClinicAndAudits() {
        authenticate("CLINIC_MANAGER", 10L);
        MedicalService request = serviceEntity(null, 99L, ACTIVE);
        MedicalService saved = serviceEntity(1L, 10L, ACTIVE);
        when(medicalServiceRepository.save(request)).thenReturn(saved);

        MedicalService result = service.createService(request);

        assertSame(saved, result);
        assertEquals(10L, request.getClinicId());
        verify(auditService).recordActivity(eq(7L), eq("Test User"), any(), any(), any(), eq("success"));
    }

    @Test
    void createService_adminKeepsProvidedClinicIdOrGlobalScope() {
        authenticate("ADMIN", null);
        MedicalService request = serviceEntity(null, null, ACTIVE);
        MedicalService saved = serviceEntity(2L, null, ACTIVE);
        when(medicalServiceRepository.save(request)).thenReturn(saved);

        MedicalService result = service.createService(request);

        assertSame(saved, result);
        assertNull(request.getClinicId());
        verify(auditService).recordActivity(eq(7L), eq("Test User"), any(), any(), any(), eq("success"));
    }

    @Test
    void createService_nonAdminAndNonManagerIsDeniedBeforeSave() {
        authenticate("ROLE_PATIENT", 10L);

        assertThrows(AccessDeniedException.class, () -> service.createService(serviceEntity(null, 10L, ACTIVE)));
        verifyNoInteractions(auditService);
    }

    @Test
    void createService_nonPositivePriceIsRejectedBeforeSave() {
        authenticate("ADMIN", null);
        MedicalService zeroPrice = serviceEntity(null, null, ACTIVE);
        zeroPrice.setPrice(BigDecimal.ZERO);

        assertThrows(IllegalArgumentException.class, () -> service.createService(zeroPrice));

        verify(medicalServiceRepository, never()).save(any());
        verifyNoInteractions(auditService);
    }

    @Test
    void updateService_adminCopiesMutableFieldsButKeepsClinicId() {
        authenticate("ADMIN", null);
        MedicalService existing = serviceEntity(1L, 10L, ACTIVE);
        MedicalService update = serviceEntity(null, 99L, INACTIVE);
        update.setName("Updated service");
        update.setFeatures(List.of("fast", "safe"));
        when(medicalServiceRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(medicalServiceRepository.save(existing)).thenReturn(existing);

        MedicalService result = service.updateService(1L, update);

        assertSame(existing, result);
        assertEquals("Updated service", result.getName());
        assertEquals(INACTIVE, result.getStatus());
        assertEquals(List.of("fast", "safe"), result.getFeatures());
        assertEquals(10L, result.getClinicId());
        verify(auditService).recordActivity(eq(7L), eq("Test User"), any(), any(), any(), eq("info"));
    }

    @Test
    void updateService_clinicManagerCannotEditGlobalOrOtherClinicServices() {
        authenticate("CLINIC_MANAGER", 10L);
        when(medicalServiceRepository.findById(1L)).thenReturn(Optional.of(serviceEntity(1L, null, ACTIVE)));
        when(medicalServiceRepository.findById(2L)).thenReturn(Optional.of(serviceEntity(2L, 11L, ACTIVE)));

        assertThrows(AccessDeniedException.class, () -> service.updateService(1L, serviceEntity(null, 10L, INACTIVE)));
        assertThrows(AccessDeniedException.class, () -> service.updateService(2L, serviceEntity(null, 10L, INACTIVE)));
    }

    @Test
    void updateService_nonPositivePriceIsRejectedBeforeLookup() {
        authenticate("ADMIN", null);
        MedicalService invalid = serviceEntity(null, null, ACTIVE);
        invalid.setPrice(new BigDecimal("-1.00"));

        assertThrows(IllegalArgumentException.class, () -> service.updateService(1L, invalid));

        verify(medicalServiceRepository, never()).findById(1L);
        verify(medicalServiceRepository, never()).save(any());
    }

    @Test
    void deleteService_deletesWhenManagerOwnsClinicService() {
        authenticate("CLINIC_MANAGER", 10L);
        MedicalService existing = serviceEntity(1L, 10L, ACTIVE);
        when(medicalServiceRepository.findById(1L)).thenReturn(Optional.of(existing));

        service.deleteService(1L);

        verify(medicalServiceRepository).delete(existing);
        verify(auditService).recordActivity(eq(7L), eq("Test User"), any(), any(), any(), eq("danger"));
    }

    @Test
    void toggleStatus_switchesActiveAndInactiveStatuses() {
        authenticate("ADMIN", null);
        MedicalService active = serviceEntity(1L, null, ACTIVE);
        MedicalService inactive = serviceEntity(2L, null, INACTIVE);
        when(medicalServiceRepository.findById(1L)).thenReturn(Optional.of(active));
        when(medicalServiceRepository.findById(2L)).thenReturn(Optional.of(inactive));
        when(medicalServiceRepository.save(any(MedicalService.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(INACTIVE, service.toggleStatus(1L).getStatus());
        assertEquals(ACTIVE, service.toggleStatus(2L).getStatus());
    }

    @Test
    void getServiceStats_countsActiveServicesValuesAndNewRegistrations() {
        MedicalService withPrice = serviceEntity(1L, null, ACTIVE);
        withPrice.setPrice(new BigDecimal("100.50"));
        MedicalService inactive = serviceEntity(2L, 10L, INACTIVE);
        inactive.setPrice(new BigDecimal("50.25"));
        MedicalService noPrice = serviceEntity(3L, 10L, ACTIVE);
        noPrice.setPrice(null);
        when(medicalServiceRepository.findAll()).thenReturn(Arrays.asList(withPrice, inactive, noPrice, null));
        when(userRepository.countNewUsersBetween(eq(UserRole.PATIENT), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(4L);

        AdminMedicalServiceStatsResponse stats = service.getServiceStats();

        assertEquals(4, stats.getTotalServices());
        assertEquals(2, stats.getActiveServices());
        assertEquals(150.75, stats.getTotalEstimatedValue());
        assertEquals(4, stats.getNewRegistrations());
        assertEquals("+12.4%", stats.getRegistrationGrowth());
    }

    @Test
    void getServiceStats_whenRegistrationCountFailsStillReturnsServiceStats() {
        when(medicalServiceRepository.findAll()).thenReturn(List.of(serviceEntity(1L, null, ACTIVE)));
        when(userRepository.countNewUsersBetween(eq(UserRole.PATIENT), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("db down"));

        AdminMedicalServiceStatsResponse stats = service.getServiceStats();

        assertEquals(1, stats.getTotalServices());
        assertEquals(1, stats.getActiveServices());
        assertEquals(0, stats.getNewRegistrations());
        assertEquals("+12.4%", stats.getRegistrationGrowth());
    }

    @Test
    void getServiceStats_whenMainQueryFailsReturnsFallback() {
        when(medicalServiceRepository.findAll()).thenThrow(new RuntimeException("db down"));

        AdminMedicalServiceStatsResponse stats = service.getServiceStats();

        assertEquals(0, stats.getTotalServices());
        assertEquals(0, stats.getActiveServices());
        assertEquals("+0%", stats.getRegistrationGrowth());
    }

    private static void authenticate(String role, Long clinicId) {
        CustomUserDetails principal = CustomUserDetails.builder()
                .id(7L)
                .email("user@example.com")
                .fullName("Test User")
                .clinicId(clinicId)
                .role(role)
                .authorities(List.of())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private static MedicalService serviceEntity(Long id, Long clinicId, String status) {
        return MedicalService.builder()
                .id(id)
                .name("Consultation")
                .category("General")
                .price(new BigDecimal("100.00"))
                .duration("30 minutes")
                .description("Routine visit")
                .status(status)
                .clinicId(clinicId)
                .features(List.of("exam"))
                .build();
    }
}
