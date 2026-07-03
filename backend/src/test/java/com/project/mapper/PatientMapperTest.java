package com.project.mapper;

import com.project.dto.response.ClinicPatientResponse;
import com.project.entity.Patient;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class PatientMapperTest {

    private final PatientMapper mapper = new PatientMapper();

    @Test
    void toClinicPatientResponse_success() {
        Patient patient = Patient.builder()
                .id(1L)
                .patientCode("P001")
                .fullName("Nguyen Van A")
                .dateOfBirth(LocalDate.now().minusYears(30))
                .phone("0987654321")
                .gender("MALE")
                .email("nva@example.com")
                .chronicCondition("Tiểu đường")
                .riskLevel("Cao")
                .doctorId(10L)
                .roomLocation("Phòng 101")
                .profileStatus("Hoạt động")
                .treatmentStatus("Đang điều trị")
                .avatarUrl("http://avatar.url")
                .healthInsuranceNumber("GD1234567")
                .address("Hanoi")
                .identityCard("123456789")
                .occupation("Developer")
                .ethnicity("Kinh")
                .clinicalNotes("Ghi chú bệnh án")
                .build();

        Map<Long, String> doctorMap = new HashMap<>();
        doctorMap.put(10L, "Dr. Tran Van B");

        ClinicPatientResponse response = mapper.toClinicPatientResponse(patient, doctorMap);

        assertNotNull(response);
        assertEquals(1L, response.getDbId());
        assertEquals("P001", response.getId());
        assertEquals("Nguyen Van A", response.getName());
        assertEquals(30, response.getAge());
        assertEquals("0987654321", response.getPhone());
        assertEquals("Nam", response.getGender()); // Maps MALE -> Nam
        assertEquals("nva@example.com", response.getEmail());
        assertEquals("Tiểu đường", response.getCondition());
        assertEquals("Cao", response.getRiskLevel());
        assertEquals("Dr. Tran Van B", response.getDoctor());
        assertEquals("Phòng 101", response.getLocation());
        assertEquals("Hoạt động", response.getStatus());
        assertEquals("Đang điều trị", response.getTreatmentStatus());
        assertEquals("http://avatar.url", response.getImg());
        assertEquals("GD1234567", response.getInsuranceNumber());
        assertEquals("Hanoi", response.getAddress());
        assertEquals("123456789", response.getIdentityCard());
        assertEquals("Developer", response.getOccupation());
        assertEquals("Kinh", response.getEthnicity());
        assertEquals("Ghi chú bệnh án", response.getNotes());
    }

    @Test
    void toClinicPatientResponse_nullFields() {
        Patient patient = Patient.builder()
                .id(2L)
                .build();

        ClinicPatientResponse response = mapper.toClinicPatientResponse(patient, new HashMap<>());

        assertNotNull(response);
        assertEquals(2L, response.getDbId());
        assertEquals("Nam", response.getGender()); // default gender
        assertEquals("Chưa có chẩn đoán", response.getCondition());
        assertEquals("Ổn định", response.getRiskLevel());
        assertEquals("Chưa phân công", response.getDoctor());
        assertEquals("Ngoại trú", response.getLocation());
    }
}
