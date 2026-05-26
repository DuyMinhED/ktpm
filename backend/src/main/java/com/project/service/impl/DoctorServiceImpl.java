package com.project.service.impl;

import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.DoctorResponse;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.repository.UserRepository;
import com.project.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Page<DoctorResponse> getDoctors(String specialty, String keyword, Pageable pageable) {
        return userRepository.findByFilters(UserRole.DOCTOR, "ACTIVE", null, specialty, null, null, keyword, pageable)
                .map(this::mapToDoctorResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (user.isDeleted() || !UserRole.DOCTOR.equals(user.getRole())) {
            throw new RuntimeException("Doctor not found");
        }
        return mapToDoctorResponse(user);
    }

    @Override
    @Transactional
    public DoctorResponse createDoctor(CreateDoctorRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword() != null ? request.getPassword() : "DefaultPassword123"))
                .role(UserRole.DOCTOR)
                .fullName(request.getName())
                .phone(request.getPhone())
                .specialization(request.getSpecialty())
                .degree(request.getDegree())
                .experience(request.getExperience())
                .licenseNumber(request.getLicenseNumber())
                .status("ACTIVE")
                .avatarUrl(request.getAvatarUrl())
                .licenseImageUrl(request.getLicenseImageUrl())
                .bio(request.getBio())
                .build();
        User savedUser = userRepository.save(user);
        return mapToDoctorResponse(savedUser);
    }

    @Override
    @Transactional
    public DoctorResponse updateDoctor(Long id, CreateDoctorRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (user.isDeleted() || !UserRole.DOCTOR.equals(user.getRole())) {
            throw new RuntimeException("Doctor not found");
        }

        user.setFullName(request.getName());
        user.setPhone(request.getPhone());
        user.setSpecialization(request.getSpecialty());
        user.setDegree(request.getDegree());
        user.setExperience(request.getExperience());
        user.setLicenseNumber(request.getLicenseNumber());
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getLicenseImageUrl() != null && !request.getLicenseImageUrl().isEmpty()) user.setLicenseImageUrl(request.getLicenseImageUrl());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) user.setPassword(passwordEncoder.encode(request.getPassword()));
        if (request.getStatus() != null) user.setStatus(request.getStatus());

        User savedUser = userRepository.save(user);
        return mapToDoctorResponse(savedUser);
    }

    @Override
    @Transactional
    public void deleteDoctor(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (user.isDeleted() || !UserRole.DOCTOR.equals(user.getRole())) {
            throw new RuntimeException("Doctor not found");
        }
        user.setDeleted(true);
        userRepository.save(user);
    }

    private DoctorResponse mapToDoctorResponse(User u) {
        return DoctorResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .specialization(u.getSpecialization())
                .department(u.getDepartment())
                .licenseNumber(u.getLicenseNumber())
                .licenseImageUrl(u.getLicenseImageUrl())
                .degree(u.getDegree())
                .bio(u.getBio())
                .experience(u.getExperience())
                .status(u.getStatus())
                .avatarUrl(u.getAvatarUrl())
                .clinicId(u.getClinicId())
                .build();
    }
}
