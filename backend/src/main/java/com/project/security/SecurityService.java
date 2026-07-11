package com.project.security;

import org.springframework.stereotype.Service;

import com.project.entity.Patient;
import com.project.entity.SupportTicket;
import com.project.repository.PatientRepository;
import com.project.repository.SupportTicketRepository;
import com.project.util.RoleUtils;
import com.project.util.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service("securityService")
@SuppressWarnings("null")
@RequiredArgsConstructor
public class SecurityService {

    private final PatientRepository patientRepository;
    private final SupportTicketRepository supportTicketRepository;

    public boolean canAccessPatient(Long patientId) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails().orElse(null);
        if (user == null) return false;
        String role = user.getRole();
        if (role == null) return false;

        if (RoleUtils.ADMIN.equals(role)) return true;

        Patient patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) return false;

        if (RoleUtils.CLINIC_MANAGER.equals(role)) {
            return user.getClinicId() != null && user.getClinicId().equals(patient.getClinicId());
        }

        if (RoleUtils.DOCTOR.equals(role)) {
            return user.getId() != null && user.getId().equals(patient.getDoctorId());
        }

        if ("PATIENT".equals(user.getRole())) {
            return patient.getUserId().equals(user.getId());
        }

        return false;
    }

    public boolean isClinicManagerOf(Long clinicId) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails().orElse(null);
        if (user == null || user.getRole() == null) return false;

        if (RoleUtils.ADMIN.equals(user.getRole())) return true;

        return RoleUtils.CLINIC_MANAGER.equals(user.getRole()) && 
               user.getClinicId() != null && 
               user.getClinicId().equals(clinicId);
    }

    public boolean isDoctorOfClinic(Long clinicId) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails().orElse(null);
        if (user == null || user.getRole() == null) return false;
        
        if (RoleUtils.ADMIN.equals(user.getRole())) return true;
        
        return RoleUtils.DOCTOR.equals(user.getRole()) && 
               user.getClinicId() != null && 
               user.getClinicId().equals(clinicId);
    }

    public boolean isDoctorSelf(Long doctorId) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails().orElse(null);
        if (user == null || user.getRole() == null) return false;
        
        return RoleUtils.DOCTOR.equals(user.getRole()) && 
               user.getId() != null && 
               user.getId().equals(doctorId);
    }

    public boolean isTicketOwner(Long ticketId) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails().orElse(null);
        if (user == null || user.getRole() == null) return false;

        if (RoleUtils.ADMIN.equals(user.getRole())) return true;

        SupportTicket ticket = supportTicketRepository.findById(ticketId).orElse(null);
        if (ticket == null) return false;

        return user.getId() != null && user.getId().equals(ticket.getCreatorId());
    }

    public boolean isClinicManagerOfTicket(Long ticketId) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails().orElse(null);
        if (user == null || user.getRole() == null) return false;

        if (RoleUtils.ADMIN.equals(user.getRole())) return true;
        if (!RoleUtils.CLINIC_MANAGER.equals(user.getRole())) return false;

        SupportTicket ticket = supportTicketRepository.findById(ticketId).orElse(null);
        if (ticket == null) return false;

        return user.getClinicId() != null && user.getClinicId().equals(ticket.getClinicId());
    }
}
