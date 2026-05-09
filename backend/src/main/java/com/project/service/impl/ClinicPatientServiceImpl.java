package com.project.service.impl;

import com.project.dto.request.CreatePatientRequest;
import com.project.dto.response.ClinicPatientResponse;
import com.project.entity.Patient;
import com.project.entity.User;
import com.project.mapper.PatientMapper;
import com.project.repository.NotificationRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.security.Audit;
import com.project.service.ClinicPatientService;
import com.project.entity.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class ClinicPatientServiceImpl implements ClinicPatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PatientMapper patientMapper;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ClinicPatientResponse> getPatientRecords(Long clinicId, String keyword, String condition, String riskLevel,
                                                        String status, String doctor, Pageable pageable) {
        Page<Patient> patientPage = patientRepository.findByClinicIdAndFilters(clinicId, keyword, condition, riskLevel,
                status, doctor, pageable);

        List<User> doctors = userRepository.findByFilters(UserRole.DOCTOR, "ACTIVE", clinicId, null, null, null, null, PageRequest.of(0, 100))
                .getContent();
        Map<Long, String> doctorMap = doctors.stream()
                .collect(Collectors.toMap(User::getId, User::getFullName, (existing, replacement) -> existing));

        return patientPage.map(p -> patientMapper.toClinicPatientResponse(p, doctorMap));
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    @Audit(action = "CREATE_PATIENT", module = "PATIENT_MANAGEMENT")
    public void createPatient(Long clinicId, CreatePatientRequest request) {
        String email = request.getEmail();
        if (email == null || email.isBlank()) {
            email = request.getPhone() + "@care.com";
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email này đã được sử dụng. Vui lòng sử dụng email khác!");
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword() != null ? request.getPassword() : "password"))
                .role(UserRole.PATIENT)
                .fullName(request.getName())
                .phone(request.getPhone())
                .avatarUrl(request.getAvatarUrl())
                .clinicId(clinicId)
                .status("ACTIVE")
                .build();
        user = Objects.requireNonNull(userRepository.save(user));

        Long drId = getDoctorId(clinicId, request);

        int ageNum = 0;
        try { ageNum = Integer.parseInt(request.getAge()); } catch (Exception ignored) {}

        Patient patient = Patient.builder()
                .userId(user.getId())
                .clinicId(clinicId)
                .fullName(request.getName())
                .phone(request.getPhone())
                .email(email)
                .gender(request.getGender())
                .address(request.getAddress())
                .dateOfBirth(request.getDateOfBirth() != null ? request.getDateOfBirth() : LocalDate.now().minusYears(ageNum))
                .patientCode("BN-" + (1000 + new Random().nextInt(9000)))
                .doctorId(drId)
                .joinedDate(LocalDate.now())
                .chronicCondition(request.getPrimaryCondition() != null ? request.getPrimaryCondition() : request.getCondition())
                .riskLevel(request.getRiskLevel())
                .treatmentStatus(request.getTreatmentStatus() != null ? request.getTreatmentStatus() : "Đang điều trị")
                .profileStatus(request.getStatus() != null ? request.getStatus() : "Hoạt động")
                .roomLocation("Ngoại trú")
                .clinicalNotes(request.getNotes())
                .identityCard(request.getIdentityCard())
                .occupation(request.getOccupation())
                .ethnicity(request.getEthnicity())
                .healthInsuranceNumber(request.getInsuranceNumber() != null ? request.getInsuranceNumber() : request.getHealthInsuranceNumber())
                .avatarUrl(request.getAvatarUrl())
                .build();
        patientRepository.save(patient);
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    @Audit(action = "UPDATE_PATIENT", module = "PATIENT_MANAGEMENT")
    public void updatePatient(Long clinicId, Long patientId, CreatePatientRequest request) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bệnh nhân với ID: " + patientId));

        if (!patient.getClinicId().equals(clinicId)) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa hồ sơ bệnh nhân này");
        }

        updatePatientFields(patient, request);
        
        User user = userRepository.findById(patient.getUserId()).orElse(null);
        if (user != null) {
            updateUserFields(user, patient, request);
            userRepository.save(user);
        }

        Long drId = getDoctorId(clinicId, request);
        if (drId != null) {
            if (drId == -1L) {
                patient.setDoctorId(null);
            } else {
                userRepository.findById(drId).ifPresent(dr -> {
                    if (dr.getClinicId().equals(clinicId)) patient.setDoctorId(dr.getId());
                });
            }
        }

        patientRepository.save(patient);
    }

    @Override
    @Transactional
    @CacheEvict(value = "clinic_dashboard", allEntries = true)
    @Audit(action = "DELETE_PATIENT", module = "PATIENT_MANAGEMENT")
    public void deletePatient(Long clinicId, Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bệnh nhân"));
        if (!patient.getClinicId().equals(clinicId)) {
            throw new AccessDeniedException("Unauthorized");
        }
        patient.setDeleted(true);
        patientRepository.save(patient);

        userRepository.findById(patient.getUserId()).ifPresent(u -> {
            u.setDeleted(true);
            userRepository.save(u);
        });
    }

    @Override
    @Transactional
    public void sendNotificationToPatient(Long clinicId, Long patientId, String message) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        if (!patient.getClinicId().equals(clinicId)) {
            throw new AccessDeniedException("Unauthorized");
        }

        com.project.entity.Notification notification = com.project.entity.Notification.builder()
                .userId(patient.getUserId())
                .title("Thông báo từ phòng khám")
                .message(message)
                .type("SYSTEM")
                .read(false)
                .build();
        notificationRepository.save(notification);
    }

    private Long getDoctorId(Long clinicId, CreatePatientRequest request) {
        Long drId = request.getDoctorId();
        if (drId == null && request.getAssignedDoctor() != null && !request.getAssignedDoctor().isEmpty()) {
            String drStr = request.getAssignedDoctor();
            try {
                drId = Long.parseLong(drStr);
            } catch (NumberFormatException e) {
                String drName = drStr.replaceAll("^(BS\\.|Bác sĩ\\s*)", "").trim();
                List<User> foundDrs = userRepository
                        .findByFilters(UserRole.DOCTOR, "ACTIVE", clinicId, null, null, null, drName, PageRequest.of(0, 1)).getContent();
                if (!foundDrs.isEmpty()) drId = foundDrs.get(0).getId();
            }
        }
        return drId;
    }

    private void updatePatientFields(Patient patient, CreatePatientRequest request) {
        if (request.getName() != null) patient.setFullName(request.getName());
        if (request.getPhone() != null) patient.setPhone(request.getPhone());
        if (request.getGender() != null) patient.setGender(request.getGender());
        if (request.getAddress() != null) patient.setAddress(request.getAddress());
        if (request.getCondition() != null) patient.setChronicCondition(request.getCondition());
        if (request.getRiskLevel() != null) patient.setRiskLevel(request.getRiskLevel());
        if (request.getTreatmentStatus() != null) patient.setTreatmentStatus(request.getTreatmentStatus());
        if (request.getStatus() != null) patient.setProfileStatus(request.getStatus());
        if (request.getIdentityCard() != null) patient.setIdentityCard(request.getIdentityCard());
        if (request.getOccupation() != null) patient.setOccupation(request.getOccupation());
        if (request.getEthnicity() != null) patient.setEthnicity(request.getEthnicity());
        if (request.getInsuranceNumber() != null) patient.setHealthInsuranceNumber(request.getInsuranceNumber());
        if (request.getNotes() != null) patient.setClinicalNotes(request.getNotes());
        
        if (request.getDateOfBirth() != null) {
            patient.setDateOfBirth(request.getDateOfBirth());
        } else if (request.getAge() != null && !request.getAge().isBlank()) {
            try {
                int ageNum = Integer.parseInt(request.getAge());
                patient.setDateOfBirth(LocalDate.now().minusYears(ageNum));
            } catch (Exception ignored) {}
        }
    }

    private void updateUserFields(User user, Patient patient, CreatePatientRequest request) {
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPassword() != null) user.setPassword(passwordEncoder.encode(request.getPassword()));
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        user.setFullName(patient.getFullName());
        user.setPhone(patient.getPhone());
    }
}
