package com.project.service.impl;

import com.project.dto.request.EmergencyContactRequest;
import com.project.dto.request.UpdatePatientProfileRequest;
import com.project.dto.response.EmergencyContactResponse;
import com.project.dto.response.PatientProfileResponse;
import com.project.entity.EmergencyContact;
import com.project.entity.Patient;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.EmergencyContactRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
import com.project.service.PatientProfileService;
import com.project.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class PatientProfileServiceImpl implements PatientProfileService {

    private final PatientRepository patientRepository;
    private final EmergencyContactRepository emergencyContactRepository;
    private final UserRepository userRepository;
    private final com.project.repository.PrescriptionRepository prescriptionRepository;

    @Override
    public PatientProfileResponse getCurrentPatientProfile() {
        Patient patient = getCurrentPatient();
        return mapToProfileResponse(patient);
    }

    @Override
    public PatientProfileResponse getPatientProfileById(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        return mapToProfileResponse(patient);
    }

    @Override
    @Transactional
    public PatientProfileResponse updateProfile(UpdatePatientProfileRequest request) {
        Patient patient = getCurrentPatient();

        patient.setFullName(request.getFullName());
        patient.setGender(request.getGender());
        patient.setPhone(request.getPhone());
        patient.setEmail(request.getEmail());
        patient.setAddress(request.getAddress());
        patient.setBloodType(request.getBloodType());
        patient.setHeightCm(request.getHeightCm());
        patient.setWeightKg(request.getWeightKg());
        patient.setIdentityCard(request.getIdentityCard());
        patient.setOccupation(request.getOccupation());
        patient.setEthnicity(request.getEthnicity());
        patient.setHealthInsuranceNumber(request.getHealthInsuranceNumber());
        patient.setMedicalHistory(request.getMedicalHistory());
        patient.setAllergies(request.getAllergies());
        if (request.getDateOfBirth() != null) {
            patient.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()) {
            patient.setAvatarUrl(request.getAvatarUrl());
        }

        // SYNC critical identity and contact info to the User table for continuous authentication consistency
        userRepository.findById(patient.getUserId()).ifPresent(user -> {
            if (patient.getEmail() != null && !patient.getEmail().isBlank()) {
                user.setEmail(patient.getEmail()); // Allow login email to drift with profile edit
            }
            if (patient.getFullName() != null) {
                user.setFullName(patient.getFullName());
            }
            if (patient.getPhone() != null) {
                user.setPhone(patient.getPhone());
            }
            if (patient.getAvatarUrl() != null) {
                user.setAvatarUrl(patient.getAvatarUrl());
            }
            userRepository.save(user);
        });

        Patient saved = patientRepository.save(patient);
        log.info("Patient profile updated: id={}", saved.getId());
        return mapToProfileResponse(saved);
    }

    @Override
    public List<EmergencyContactResponse> getEmergencyContacts() {
        Patient patient = getCurrentPatient();
        return emergencyContactRepository.findByPatientId(patient.getId())
                .stream()
                .map(this::mapToEmergencyContactResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EmergencyContactResponse addEmergencyContact(EmergencyContactRequest request) {
        Patient patient = getCurrentPatient();

        EmergencyContact contact = EmergencyContact.builder()
                .patient(patient)
                .contactName(request.getContactName())
                .relationship(request.getRelationship())
                .phone(request.getPhone())
                .isPrimary(request.isPrimary())
                .build();

        EmergencyContact saved = emergencyContactRepository.save(contact);
        log.info("Emergency contact added for patient: id={}", patient.getId());
        return mapToEmergencyContactResponse(saved);
    }

    @Override
    public EmergencyContactResponse updateEmergencyContact(Long id, EmergencyContactRequest request) {
        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency contact not found: " + id));

        contact.setContactName(request.getContactName());
        contact.setRelationship(request.getRelationship());
        contact.setPhone(request.getPhone());
        contact.setPrimary(request.isPrimary());

        EmergencyContact saved = emergencyContactRepository.save(contact);
        log.info("Emergency contact updated: id={}", id);
        return mapToEmergencyContactResponse(saved);
    }

    @Override
    public byte[] generateReport() {
        Patient p = getCurrentPatient();
        StringBuilder sb = new StringBuilder();
        sb.append("BÁO CÁO SỨC KHỎE CÁ NHÂN\n");
        sb.append("---------------------------------\n");
        sb.append("Họ tên: ").append(p.getFullName()).append("\n");
        sb.append("Mã BN: ").append(p.getPatientCode() != null ? p.getPatientCode() : "N/A").append("\n");
        sb.append("SĐT: ").append(p.getPhone()).append("\n");
        sb.append("Email: ").append(p.getEmail()).append("\n");
        sb.append("Tình trạng: ").append(p.getChronicCondition() != null ? p.getChronicCondition() : "Bình thường").append("\n");
        sb.append("---------------------------------\n");
        sb.append("Ngày xuất báo cáo: ").append(java.time.LocalDate.now()).append("\n");
        
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    // === Private Helpers ===

    private Patient getCurrentPatient() {
        Long userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new ResourceNotFoundException("User not authenticated"));
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    private PatientProfileResponse mapToProfileResponse(Patient p) {
        int age = 0;
        if (p.getDateOfBirth() != null) {
            age = Period.between(p.getDateOfBirth(), LocalDate.now()).getYears();
        }

        // Get primary emergency contact, fallback to first available
        java.util.List<EmergencyContact> contacts = emergencyContactRepository.findByPatientId(p.getId());
        EmergencyContactResponse emergencyContact = contacts.stream()
                .filter(EmergencyContact::isPrimary)
                .findFirst()
                .or(() -> contacts.stream().findFirst())
                .map(this::mapToEmergencyContactResponse)
                .orElse(null);

        return PatientProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .patientCode(p.getPatientCode())
                .fullName(p.getFullName())
                .dateOfBirth(p.getDateOfBirth())
                .age(age)
                .gender(p.getGender())
                .phone(p.getPhone())
                .email(p.getEmail())
                .address(p.getAddress())
                .bloodType(p.getBloodType())
                .heightCm(p.getHeightCm())
                .weightKg(p.getWeightKg())
                .avatarUrl(p.getAvatarUrl())
                .identityCard(p.getIdentityCard())
                .occupation(p.getOccupation())
                .ethnicity(p.getEthnicity())
                .healthInsuranceNumber(p.getHealthInsuranceNumber())
                .joinedDate(p.getJoinedDate())
                .chronicCondition(p.getChronicCondition())
                .chronicDiseases(p.getMedicalHistory() != null && !p.getMedicalHistory().isBlank() 
                    ? java.util.Arrays.asList(p.getMedicalHistory().split(",")) 
                    : (p.getClinicalNotes() != null && !p.getClinicalNotes().isBlank() 
                        ? java.util.List.of(p.getClinicalNotes()) 
                        : java.util.List.of()))
                .allergies(p.getAllergies() != null && !p.getAllergies().isBlank() 
                    ? java.util.Arrays.asList(p.getAllergies().split(",")) 
                    : java.util.List.of())
                .currentMedications(prescriptionRepository.findByPatientIdAndStatus(p.getId(), com.project.entity.PrescriptionStatus.ACTIVE)
                    .stream()
                    .flatMap(pr -> pr.getItems().stream())
                    .map(com.project.entity.PrescriptionItem::getMedicationName)
                    .distinct()
                    .collect(java.util.stream.Collectors.toList()))
                .emergencyContact(emergencyContact)
                .build();
    }

    private EmergencyContactResponse mapToEmergencyContactResponse(EmergencyContact c) {
        return EmergencyContactResponse.builder()
                .id(c.getId())
                .contactName(c.getContactName())
                .relationship(c.getRelationship())
                .phone(c.getPhone())
                .isPrimary(c.isPrimary())
                .build();
    }
}
