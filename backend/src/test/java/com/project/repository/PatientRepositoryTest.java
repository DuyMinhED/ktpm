package com.project.repository;

import com.project.entity.Patient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
public class PatientRepositoryTest {

    @Autowired
    private PatientRepository patientRepository;

    @Test
    void findByUserId_notFound() {
        Optional<Patient> patient = patientRepository.findByUserId(9999L);
        assertFalse(patient.isPresent());
    }

    @Test
    void findByPatientCodeAndIsDeletedFalse_notFound() {
        Optional<Patient> patient = patientRepository.findByPatientCodeAndIsDeletedFalse("NON_EXISTENT_CODE");
        assertFalse(patient.isPresent());
    }
}
