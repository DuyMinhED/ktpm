package com.project.service.impl;

import com.project.dto.request.CreateClinicRequest;
import com.project.dto.request.UpdateClinicRequest;
import com.project.dto.response.AdminClinicResponse;
import com.project.dto.response.AdminClinicStatsResponse;
import com.project.entity.Clinic;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.exception.ResourceNotFoundException;
import com.project.mapper.ClinicMapper;
import com.project.repository.ClinicRepository;
import com.project.repository.UserRepository;
import com.project.service.AuditService;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminClinicServiceImplTest {

    @Mock
    private ClinicRepository clinicRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ClinicMapper clinicMapper;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AdminClinicServiceImpl adminClinicService;

    private Clinic sampleClinic;

    @BeforeEach
    void setUp() {
        sampleClinic = Clinic.builder()
                .id(1L)
                .clinicCode("CL-001")
                .name("Phòng khám Đa khoa Tâm Anh")
                .address("123 Test Street")
                .phone("0123456789")
                .status("ACTIVE")
                .managerId(10L)
                .build();
    }

    @Test
    void getClinicStats_success() {
        when(clinicRepository.countClinics()).thenReturn(10L);
        when(clinicRepository.countByStatusAndIsDeletedFalse("ACTIVE")).thenReturn(8L);
        when(clinicRepository.countByStatusAndIsDeletedFalse("INACTIVE")).thenReturn(2L);
        when(userRepository.countByRoleAndIsDeletedFalse(UserRole.DOCTOR)).thenReturn(25L);

        AdminClinicStatsResponse stats = adminClinicService.getClinicStats();

        assertNotNull(stats);
        assertEquals(10L, stats.getTotalClinics());
        assertEquals(8L, stats.getActiveClinics());
        assertEquals(2L, stats.getInactiveClinics());
        assertEquals(25L, stats.getTotalDoctors());

        verify(clinicRepository, times(1)).countClinics();
    }

    @Test
    void getClinics_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Clinic> clinicPage = new PageImpl<>(Collections.singletonList(sampleClinic));
        AdminClinicResponse response = AdminClinicResponse.builder()
                .id(1L)
                .name("Phòng khám Đa khoa Tâm Anh")
                .build();

        when(clinicRepository.findByFilters(eq("ACTIVE"), eq("%test%"), eq(pageable))).thenReturn(clinicPage);
        when(clinicMapper.toAdminClinicResponse(any(Clinic.class))).thenReturn(response);

        Page<AdminClinicResponse> result = adminClinicService.getClinics("ACTIVE", "Test", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Phòng khám Đa khoa Tâm Anh", result.getContent().get(0).getName());
    }

    @Test
    void getClinicById_success() {
        AdminClinicResponse response = AdminClinicResponse.builder()
                .id(1L)
                .name("Phòng khám Đa khoa Tâm Anh")
                .build();

        when(clinicRepository.findById(1L)).thenReturn(Optional.of(sampleClinic));
        when(clinicMapper.toAdminClinicResponse(sampleClinic)).thenReturn(response);

        AdminClinicResponse result = adminClinicService.getClinicById(1L);

        assertNotNull(result);
        assertEquals("Phòng khám Đa khoa Tâm Anh", result.getName());
    }

    @Test
    void getClinicById_notFound_shouldThrowException() {
        when(clinicRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> adminClinicService.getClinicById(99L));
    }

    @Test
    void createClinic_success() {
        CreateClinicRequest request = new CreateClinicRequest();
        request.setClinicCode("CL-NEW");
        request.setName("New Clinic");
        request.setAdminEmail("admin@newclinic.com");
        request.setAdminPassword("password123");
        request.setAdminFullName("Clinic Admin");

        when(clinicRepository.findByClinicCode("CL-NEW")).thenReturn(Optional.empty());
        when(clinicRepository.save(any(Clinic.class))).thenAnswer(invocation -> {
            Clinic clinic = invocation.getArgument(0);
            if (clinic.getId() == null) clinic.setId(100L); // Mock generated ID
            return clinic;
        });
        when(passwordEncoder.encode("password123")).thenReturn("encoded_pass");
        
        User mockManager = User.builder().id(50L).build();
        when(userRepository.save(any(User.class))).thenReturn(mockManager);

        AdminClinicResponse response = AdminClinicResponse.builder()
                .id(100L)
                .name("New Clinic")
                .build();
        when(clinicMapper.toAdminClinicResponse(any(Clinic.class))).thenReturn(response);

        AdminClinicResponse result = adminClinicService.createClinic(request);

        assertNotNull(result);
        assertEquals("New Clinic", result.getName());
        verify(clinicRepository, times(2)).save(any(Clinic.class)); // Saved twice: initially, then with managerId
        verify(userRepository, times(1)).save(any(User.class));
        verify(auditService, times(1)).recordActivity(eq("Tạo mới"), eq("Quản lý phòng khám"), anyString(), eq("success"));
    }

    @Test
    void createClinic_duplicateCode_shouldThrowException() {
        CreateClinicRequest request = new CreateClinicRequest();
        request.setClinicCode("CL-001");

        when(clinicRepository.findByClinicCode("CL-001")).thenReturn(Optional.of(sampleClinic));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> adminClinicService.createClinic(request));
        assertEquals("Mã phòng khám đã tồn tại", exception.getMessage());
    }

    @Test
    void updateClinic_success() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        request.setName("Updated Clinic Name");
        request.setStatus("INACTIVE");

        when(clinicRepository.findById(1L)).thenReturn(Optional.of(sampleClinic));
        when(clinicRepository.save(any(Clinic.class))).thenReturn(sampleClinic);
        doNothing().when(userRepository).updateStatusByClinicId(1L, "INACTIVE");

        AdminClinicResponse response = AdminClinicResponse.builder()
                .id(1L)
                .name("Updated Clinic Name")
                .build();
        when(clinicMapper.toAdminClinicResponse(any(Clinic.class))).thenReturn(response);

        AdminClinicResponse result = adminClinicService.updateClinic(1L, request);

        assertNotNull(result);
        assertEquals("Updated Clinic Name", result.getName());
        verify(userRepository, times(1)).updateStatusByClinicId(1L, "INACTIVE");
        verify(auditService, times(1)).recordActivity(eq("Cập nhật"), eq("Quản lý phòng khám"), anyString(), eq("success"));
    }

    @Test
    void updateClinic_partialUpdate_success() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        request.setAddress("New Address Only");
        // name, phone, imageUrl, status are null

        when(clinicRepository.findById(1L)).thenReturn(Optional.of(sampleClinic));
        when(clinicRepository.save(any(Clinic.class))).thenReturn(sampleClinic);

        AdminClinicResponse response = AdminClinicResponse.builder()
                .id(1L)
                .name(sampleClinic.getName())
                .address("New Address Only")
                .build();
        when(clinicMapper.toAdminClinicResponse(any(Clinic.class))).thenReturn(response);

        AdminClinicResponse result = adminClinicService.updateClinic(1L, request);

        assertNotNull(result);
        assertEquals("New Address Only", result.getAddress());
        verify(userRepository, never()).updateStatusByClinicId(anyLong(), anyString()); // Status should not be updated
    }

    @Test
    void updateClinic_notFound_shouldThrowException() {
        UpdateClinicRequest request = new UpdateClinicRequest();
        when(clinicRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(java.util.NoSuchElementException.class, () -> adminClinicService.updateClinic(99L, request));
    }

    @Test
    void toggleClinicStatus_success() {
        when(clinicRepository.findById(1L)).thenReturn(Optional.of(sampleClinic));
        when(clinicRepository.save(any(Clinic.class))).thenReturn(sampleClinic);
        doNothing().when(userRepository).updateStatusByClinicId(1L, "INACTIVE");

        adminClinicService.toggleClinicStatus(1L);

        assertEquals("INACTIVE", sampleClinic.getStatus());
        verify(clinicRepository, times(1)).save(sampleClinic);
        verify(userRepository, times(1)).updateStatusByClinicId(1L, "INACTIVE");
        verify(auditService, times(1)).recordActivity(eq("Đổi trạng thái"), eq("Quản lý phòng khám"), anyString(), eq("warning"));
    }

    @Test
    void toggleClinicStatus_notFound_shouldThrowException() {
        when(clinicRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(java.util.NoSuchElementException.class, () -> adminClinicService.toggleClinicStatus(99L));
    }
}
