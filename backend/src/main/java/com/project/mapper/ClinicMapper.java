package com.project.mapper;

import com.project.dto.response.AdminClinicResponse;
import com.project.dto.response.ClinicDashboardResponse;
import com.project.entity.Clinic;
import com.project.entity.User;
import com.project.entity.UserRole;
import com.project.repository.UserRepository;
import com.project.repository.PatientRepository;
import com.project.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClinicMapper {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;

    public ClinicDashboardResponse.GrowthStatsDto toGrowthStats() {
        return ClinicDashboardResponse.GrowthStatsDto.builder()
                .growth("+12.5%")
                .average("180 ca/tháng")
                .peakMonth("Tháng 3 (224 ca)")
                .build();
    }

    public AdminClinicResponse toAdminClinicResponse(Clinic clinic) {
        String managerName = null;
        String managerEmail = null;
        if (clinic.getManagerId() != null) {
            long managerId = (long) clinic.getManagerId();
            User manager = userRepository.findById(managerId).orElse(null);
            if (manager != null && !manager.isDeleted()) {
                managerName = manager.getFullName();
                managerEmail = manager.getEmail();
            }
        }

        // Self-healing fallback: If direct mapping fails, retrieve via reverse role query
        if (managerEmail == null) {
            java.util.List<User> managers = userRepository.findByClinicIdAndRoleAndIsDeletedFalse(clinic.getId(), UserRole.CLINIC_MANAGER);
            if (managers != null && !managers.isEmpty()) {
                User manager = managers.get(0);
                managerName = manager.getFullName();
                managerEmail = manager.getEmail();
            }
        }

        long realDoctorCount = userRepository.countByRoleAndClinicId(UserRole.DOCTOR, clinic.getId());
        long realPatientCount = patientRepository.countByClinicIdAndIsDeletedFalse(clinic.getId());
        long highRiskCount = patientRepository.countByClinicIdAndRiskLevelAndIsDeletedFalse(clinic.getId(), AppConstants.RISK_HIGH);

        return AdminClinicResponse.builder()
                .id(clinic.getId())
                .clinicCode(clinic.getClinicCode())
                .name(clinic.getName())
                .address(clinic.getAddress())
                .phone(clinic.getPhone())
                .imageUrl(clinic.getImageUrl())
                .managerName(managerName)
                .managerEmail(managerEmail)
                .doctorCount((int) realDoctorCount)
                .patientCount((int) realPatientCount)
                .highRiskPatientCount((int) highRiskCount)
                .status(clinic.getStatus())
                .createdAt(clinic.getCreatedAt())
                .build();
    }
}
