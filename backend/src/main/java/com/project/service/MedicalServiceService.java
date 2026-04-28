package com.project.service;

import com.project.dto.response.AdminMedicalServiceStatsResponse;
import com.project.entity.MedicalService;
import java.util.List;

public interface MedicalServiceService {
    List<MedicalService> getAllServices();
    MedicalService getServiceById(Long id);
    MedicalService createService(MedicalService service);
    MedicalService updateService(Long id, MedicalService service);
    void deleteService(Long id);
    MedicalService toggleStatus(Long id);
    AdminMedicalServiceStatsResponse getServiceStats();
}
