package com.project.service.impl;

import com.project.dto.request.CreateDoctorRequest;
import com.project.dto.response.ClinicDoctorResponse;
import com.project.dto.response.DoctorSnippetDto;
import com.project.entity.User;
import com.project.repository.UserRepository;
import com.project.repository.PatientRepository;
import com.project.security.Audit;
import com.project.service.ClinicDoctorService;
import com.project.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class ClinicDoctorServiceImpl implements ClinicDoctorService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Page<ClinicDoctorResponse> getDoctorRecords(Long clinicId, String keyword, String status, String specialty, 
                                                      String degree, String experience, Pageable pageable) {
        List<Object[]> counts = patientRepository.countPatientsByDoctorIds(clinicId);
        java.util.Map<Long, Long> countMap = new java.util.HashMap<>();
        if (counts != null) {
            for (Object[] row : counts) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    try {
                        countMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
                    } catch (Exception e) {}
                }
            }
        }

        return userRepository.findByFilters(UserRole.DOCTOR, status, clinicId, specialty, degree, experience, keyword, pageable)
                .map(u -> {
                    ClinicDoctorResponse res = mapToDoctorResponse(u);
                    res.setLoad(countMap.getOrDefault(u.getId(), 0L).intValue());
                    return res;
                });
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    @Audit(action = "CREATE_DOCTOR", module = "DOCTOR_MANAGEMENT")
    public void createDoctor(Long clinicId, CreateDoctorRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.DOCTOR)
                .fullName(request.getName())
                .phone(request.getPhone())
                .clinicId(clinicId)
                .specialization(request.getSpecialty())
                .degree(request.getDegree())
                .experience(request.getExperience())
                .licenseNumber(request.getLicenseNumber())
                .status("ACTIVE")
                .avatarUrl(request.getAvatarUrl())
                .licenseImageUrl(request.getLicenseImageUrl())
                .bio(request.getBio())
                .build();
        userRepository.save(user);
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    @Audit(action = "UPDATE_DOCTOR", module = "DOCTOR_MANAGEMENT")
    public void updateDoctor(Long clinicId, Long doctorId, CreateDoctorRequest request) {
        User user = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (!user.getClinicId().equals(clinicId)) throw new AccessDeniedException("Unauthorized");

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

        userRepository.save(user);
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    @Audit(action = "DELETE_DOCTOR", module = "DOCTOR_MANAGEMENT")
    public void deleteDoctor(Long clinicId, Long doctorId) {
        User user = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (!user.getClinicId().equals(clinicId)) throw new AccessDeniedException("Unauthorized");
        user.setDeleted(true);
        userRepository.save(user);
    }

    @Override
    public List<String> getDoctorNames(Long clinicId) {
        return userRepository.findByClinicIdAndRoleAndIsDeletedFalse(clinicId, UserRole.DOCTOR).stream()
                .map(User::getFullName)
                .collect(Collectors.toList());
    }

    public List<DoctorSnippetDto> getAvailableDoctors(Long clinicId) {
        List<User> doctors = userRepository.findByClinicIdAndRoleAndIsDeletedFalse(clinicId, UserRole.DOCTOR);
        List<Object[]> counts = patientRepository.countPatientsByDoctorIds(clinicId);
        
        java.util.Map<Long, Long> countMap = new java.util.HashMap<>();
        if (counts != null) {
            for (Object[] row : counts) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    try {
                        Long doctorId = ((Number) row[0]).longValue();
                        Long count = ((Number) row[1]).longValue();
                        countMap.put(doctorId, count);
                    } catch (Exception e) {
                        // Log and skip invalid row
                    }
                }
            }
        }

        return doctors.stream().map(d -> DoctorSnippetDto.builder()
                .id(d.getId())
                .name(d.getFullName())
                .specialty(d.getSpecialization())
                .patientCount(countMap.getOrDefault(d.getId(), 0L).intValue())
                .avatarUrl(d.getAvatarUrl())
                .build()).collect(Collectors.toList());
    }

    private ClinicDoctorResponse mapToDoctorResponse(User u) {
        return ClinicDoctorResponse.builder()
                .dbId(u.getId())
                .id("D-" + (1000 + u.getId()))
                .name(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .specialty(u.getSpecialization())
                .degree(u.getDegree())
                .experience(u.getExperience())
                .status(u.getStatus())
                .licenseNumber(u.getLicenseNumber())
                .img(u.getAvatarUrl())
                .licenseImageUrl(u.getLicenseImageUrl())
                .build();
    }
}
