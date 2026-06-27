package com.project.repository;

import com.project.entity.User;
import com.project.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User doctorUser;
    private User patientUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        doctorUser = User.builder()
                .email("doctor@example.com")
                .password("password")
                .role(UserRole.DOCTOR)
                .fullName("Dr. John Smith")
                .specialization("Cardiology")
                .status("ACTIVE")
                .build();

        patientUser = User.builder()
                .email("patient@example.com")
                .password("password")
                .role(UserRole.PATIENT)
                .fullName("Jane Doe")
                .status("ACTIVE")
                .build();

        doctorUser = userRepository.save(doctorUser);
        patientUser = userRepository.save(patientUser);
    }

    @Test
    void findByEmail_success() {
        Optional<User> found = userRepository.findByEmail("doctor@example.com");
        assertTrue(found.isPresent());
        assertEquals("Dr. John Smith", found.get().getFullName());
    }

    @Test
    void findByEmail_notFound() {
        Optional<User> found = userRepository.findByEmail("nonexistent@example.com");
        assertFalse(found.isPresent());
    }

    @Test
    void countByRoleAndIsDeletedFalse_success() {
        long doctorCount = userRepository.countByRoleAndIsDeletedFalse(UserRole.DOCTOR);
        assertEquals(1, doctorCount);

        long patientCount = userRepository.countByRoleAndIsDeletedFalse(UserRole.PATIENT);
        assertEquals(1, patientCount);
    }

    @Test
    void findByFilters_allFiltersMatch() {
        Page<User> page = userRepository.findByFilters(
                UserRole.DOCTOR,
                "ACTIVE",
                null,
                "Cardiology",
                null,
                null,
                "Smith",
                PageRequest.of(0, 10)
        );

        assertNotNull(page);
        assertEquals(1, page.getTotalElements());
        assertEquals("Dr. John Smith", page.getContent().get(0).getFullName());
    }

    @Test
    void findByFilters_noMatch() {
        Page<User> page = userRepository.findByFilters(
                UserRole.DOCTOR,
                "ACTIVE",
                null,
                "Neurology", // No cardiology
                null,
                null,
                "Smith",
                PageRequest.of(0, 10)
        );

        assertNotNull(page);
        assertEquals(0, page.getTotalElements());
    }
}
