package com.project.security;

import com.project.entity.Patient;
import com.project.repository.PatientRepository;
import com.project.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service("securityService")
@SuppressWarnings("null")
@RequiredArgsConstructor
public class SecurityService {

    private final PatientRepository patientRepository;

    public boolean canAccessPatient(Long patientId) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails().orElse(null);
        if (user == null) return false;

        if ("ADMIN".equals(user.getRole())) return true;

        Patient patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) return false;

        if ("CLINIC_MANAGER".equals(user.getRole())) {
            return patient.getClinicId().equals(user.getClinicId());
        }

        if ("DOCTOR".equals(user.getRole())) {
            // A doctor can access any patient in their clinic (or we could restrict to assigned patients)
            // Restricted to clinic for now as doctors often collaborate
            return patient.getClinicId().equals(user.getClinicId());
        }

        if ("PATIENT".equals(user.getRole())) {
            return patient.getUserId().equals(user.getId());
        }

        return false;
    }

    public boolean isClinicManagerOf(Long clinicId) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails().orElse(null);
        if (user == null) return false;

        if ("ADMIN".equals(user.getRole())) return true;

        return "CLINIC_MANAGER".equals(user.getRole()) && clinicId.equals(user.getClinicId());
    }
    
    public boolean isDoctorOfClinic(Long clinicId) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails().orElse(null);
        if (user == null) return false;
        if ("ADMIN".equals(user.getRole())) return true;
        return "DOCTOR".equals(user.getRole()) && clinicId.equals(user.getClinicId());
    }
}
