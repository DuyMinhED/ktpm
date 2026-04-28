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
import com.project.service.AdminClinicService;
import com.project.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AdminClinicServiceImpl implements AdminClinicService {

    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClinicMapper clinicMapper;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public AdminClinicStatsResponse getClinicStats() {
        return AdminClinicStatsResponse.builder()
                .totalClinics(clinicRepository.countClinics())
                .activeClinics(clinicRepository.countByStatusAndIsDeletedFalse("ACTIVE"))
                .inactiveClinics(clinicRepository.countByStatusAndIsDeletedFalse("INACTIVE"))
                .totalDoctors(userRepository.countByRoleAndIsDeletedFalse(UserRole.DOCTOR))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminClinicResponse> getClinics(String status, String keyword, Pageable pageable) {
        String search = (keyword != null && !keyword.isBlank()) ? "%" + keyword.toLowerCase().trim() + "%" : null;
        return clinicRepository.findByFilters(status, search, pageable).map(clinicMapper::toAdminClinicResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminClinicResponse getClinicById(Long id) {
        return clinicRepository.findById(id).map(clinicMapper::toAdminClinicResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Phòng khám không tồn tại"));
    }

    @Override
    @Transactional
    public AdminClinicResponse createClinic(CreateClinicRequest request) {
        if (clinicRepository.findByClinicCode(request.getClinicCode()).isPresent()) throw new RuntimeException("Mã phòng khám đã tồn tại");
        
        Clinic clinic = Clinic.builder()
                .clinicCode(request.getClinicCode()).name(request.getName()).address(request.getAddress())
                .phone(request.getPhone()).imageUrl(request.getImageUrl()).status("ACTIVE").build();
        Clinic savedClinic = clinicRepository.save(clinic);

        User manager = User.builder()
                .fullName(request.getAdminFullName()).email(request.getAdminEmail())
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .role(UserRole.CLINIC_MANAGER).clinicId(savedClinic.getId()).status("ACTIVE").build();
        userRepository.save(manager);

        savedClinic.setManagerId(manager.getId());
        clinicRepository.save(savedClinic);
        
        auditService.recordActivity("Tạo mới", "Quản lý phòng khám", "Tạo phòng khám: " + savedClinic.getName(), "success");
        return clinicMapper.toAdminClinicResponse(savedClinic);
    }

    @Override
    @Transactional
    public AdminClinicResponse updateClinic(Long id, UpdateClinicRequest request) {
        Clinic clinic = clinicRepository.findById(id).orElseThrow();
        if (request.getName() != null) clinic.setName(request.getName());
        if (request.getAddress() != null) clinic.setAddress(request.getAddress());
        if (request.getPhone() != null) clinic.setPhone(request.getPhone());
        if (request.getImageUrl() != null) clinic.setImageUrl(request.getImageUrl());
        if (request.getStatus() != null) {
            clinic.setStatus(request.getStatus());
            userRepository.updateStatusByClinicId(id, request.getStatus());
        }
        
        clinicRepository.save(clinic);
        auditService.recordActivity("Cập nhật", "Quản lý phòng khám", "Cập nhật phòng khám: " + clinic.getName(), "success");
        return clinicMapper.toAdminClinicResponse(clinic);
    }

    @Override
    @Transactional
    public void toggleClinicStatus(Long id) {
        Clinic clinic = clinicRepository.findById(id).orElseThrow();
        String nextStatus = "ACTIVE".equals(clinic.getStatus()) ? "INACTIVE" : "ACTIVE";
        clinic.setStatus(nextStatus);
        clinicRepository.save(clinic);
        userRepository.updateStatusByClinicId(id, nextStatus);
        auditService.recordActivity("Đổi trạng thái", "Quản lý phòng khám", "Đổi trạng thái phòng khám " + clinic.getName() + " sang " + nextStatus, "warning");
    }
}
