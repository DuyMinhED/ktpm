package com.project.service;

import com.project.dto.request.EmergencyContactRequest;
import com.project.dto.request.UpdatePatientProfileRequest;
import com.project.dto.response.EmergencyContactResponse;
import com.project.dto.response.PatientProfileResponse;

import java.util.List;

public interface PatientProfileService {


    PatientProfileResponse getCurrentPatientProfile();
    PatientProfileResponse getPatientProfileById(Long patientId);
    PatientProfileResponse updateProfile(UpdatePatientProfileRequest request);

    List<EmergencyContactResponse> getEmergencyContacts();

    EmergencyContactResponse addEmergencyContact(EmergencyContactRequest request);

    EmergencyContactResponse updateEmergencyContact(Long id, EmergencyContactRequest request);
    byte[] generateReport();
}
