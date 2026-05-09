package com.project.mapper;

import com.project.dto.response.ClinicPatientResponse;
import com.project.entity.Patient;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;
import java.util.Map;

@Component
public class PatientMapper {

    public ClinicPatientResponse toClinicPatientResponse(Patient p, Map<Long, String> doctorMap) {
        int age = p.getDateOfBirth() != null ? Period.between(p.getDateOfBirth(), LocalDate.now()).getYears() : 0;
        
        String displayGender = p.getGender() != null ? p.getGender() : "Nam";
        if (p.getGender() != null) {
            String g = p.getGender().toUpperCase();
            if (g.startsWith("M") || g.contains("NAM") || g.equals("MALE")) displayGender = "Nam";
            else if (g.startsWith("F") || g.contains("NỮ") || g.equals("FEMALE")) displayGender = "Nữ";
            else if (g.contains("KHÁC") || g.equals("OTHER")) displayGender = "Khác";
        }

        return ClinicPatientResponse.builder()
                .dbId(p.getId())
                .id(p.getPatientCode())
                .name(p.getFullName())
                .age(age)
                .phone(p.getPhone())
                .phoneNumber(p.getPhone())
                .gender(displayGender)
                .email(p.getEmail())
                .condition(p.getChronicCondition() != null ? p.getChronicCondition() : "Chưa có chẩn đoán")
                .primaryCondition(p.getChronicCondition() != null ? p.getChronicCondition() : "Chưa có chẩn đoán")
                .riskLevel(p.getRiskLevel() != null ? p.getRiskLevel() : "Ổn định")
                .doctor(p.getDoctorId() != null ? doctorMap.getOrDefault(p.getDoctorId(), "Chưa phân công") : "Chưa phân công")
                .doctorId(p.getDoctorId())
                .location(p.getRoomLocation() != null ? p.getRoomLocation() : "Ngoại trú")
                .status(p.getProfileStatus() != null ? p.getProfileStatus() : "Hoạt động")
                .treatmentStatus(p.getTreatmentStatus() != null ? p.getTreatmentStatus() : "Đang điều trị")
                .img(p.getAvatarUrl() != null ? p.getAvatarUrl() : "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=150&h=150")
                .insuranceNumber(p.getHealthInsuranceNumber())
                .address(p.getAddress())
                .identityCard(p.getIdentityCard())
                .occupation(p.getOccupation())
                .ethnicity(p.getEthnicity())
                .notes(p.getClinicalNotes())
                .build();
    }
}
