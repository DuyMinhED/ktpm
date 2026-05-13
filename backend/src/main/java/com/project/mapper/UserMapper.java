package com.project.mapper;

import com.project.dto.response.AdminUserResponse;
import com.project.entity.Clinic;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.repository.ClinicRepository;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final ClinicRepository clinicRepository;

    public AdminUserResponse toAdminUserResponse(User user) {
        String clinicName = null;
        String clinicPhone = null;
        boolean isClinicActive = true;

        if (user.getClinicId() != null) {
            long clinicId = (long) user.getClinicId();
            Clinic clinic = clinicRepository.findById(clinicId).orElse(null);
            if (clinic != null) {
                clinicName = clinic.getName();
                clinicPhone = clinic.getPhone();
                isClinicActive = "ACTIVE".equalsIgnoreCase(clinic.getStatus());
            }
        }

        String status = user.getStatus();
        String displayStatus = "Hoạt động";
        if (status != null) {
            // User is active only if both user status is ACTIVE and clinic is ACTIVE
            displayStatus = (status.equals("ACTIVE") && isClinicActive) ? "Hoạt động" : "Ngưng hoạt động";
        } else if (!isClinicActive) {
            displayStatus = "Ngưng hoạt động";
        }

        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .roleName(mapRoleName(user.getRole()))
                .clinicName(clinicName)
                .clinicPhone(clinicPhone)
                .avatarUrl(user.getAvatarUrl())
                .status(displayStatus)
                .licenseNumber(user.getLicenseNumber())
                .degree(user.getDegree())
                .bio(user.getBio())
                .licenseImageUrl(user.getLicenseImageUrl())
                .specialization(user.getSpecialization())
                .experience(user.getExperience())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public String mapRoleName(UserRole role) {
        if (role == null) return "Thành viên";
        return switch (role) {
            case ADMIN -> "Quản trị viên";
            case DOCTOR -> "Bác sĩ";
            case CLINIC_MANAGER -> "Quản lý phòng khám";
            case PATIENT -> "Bệnh nhân";
            default -> role.name();
        };
    }
}
