package com.project.integration;

import com.project.entity.AppointmentStatus;
import com.project.entity.MetricType;
import com.project.entity.PrescriptionStatus;
import com.project.entity.UserRole;
import com.project.repository.AppointmentRepository;
import com.project.repository.HealthMetricRepository;
import com.project.repository.PatientRepository;
import com.project.repository.PrescriptionRepository;
import com.project.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlConfig;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@SqlConfig(errorMode = SqlConfig.ErrorMode.CONTINUE_ON_ERROR)
@Sql(scripts = "/integration/cleanup-integration.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Sql(scripts = "/integration/seed-integration.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Sql(scripts = "/integration/cleanup-integration.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
class CoreRepositoryIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private HealthMetricRepository healthMetricRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Test
    void userRepository_filtersRoleClinicAndSoftDelete() {
        assertThat(userRepository.findByEmail("admin@care.com")).isPresent();
        assertThat(userRepository.countByRoleAndClinicIdAndIsDeletedFalse(UserRole.DOCTOR, 1L)).isEqualTo(2);
        assertThat(userRepository.findByClinicIdAndRoleAndIsDeletedFalse(1L, UserRole.DOCTOR))
                .extracting("email")
                .containsExactlyInAnyOrder("mai.le@care.com", "hung.nguyen@care.com");
    }

    @Test
    void patientRepository_appliesClinicAndDoctorScopes() {
        assertThat(patientRepository.findByUserIdAndIsDeletedFalse(7L)).isPresent()
                .get()
                .extracting("patientCode")
                .isEqualTo("BN-DUC-001");

        assertThat(patientRepository.countByClinicIdAndIsDeletedFalse(1L)).isEqualTo(2);
        assertThat(patientRepository.findByDoctorIdAndIsDeletedFalse(4L))
                .extracting("id")
                .containsExactlyInAnyOrder(101L, 102L);
    }

    @Test
    void appointmentRepository_findsPatientUpcomingHistoryAndClinicAppointments() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 1, 0, 0);

        assertThat(appointmentRepository
                .findByPatientIdAndStatusInAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
                        101L, List.of(AppointmentStatus.SCHEDULED), now))
                .extracting("id")
                .containsExactly(1001L);

        assertThat(appointmentRepository
                .findByPatientIdAndStatusOrderByAppointmentTimeDesc(
                        101L, AppointmentStatus.COMPLETED, PageRequest.of(0, 10))
                .getContent())
                .extracting("id")
                .containsExactly(1002L);

        assertThat(appointmentRepository.findByClinicId(1L, PageRequest.of(0, 10)).getContent())
                .extracting("id")
                .containsExactly(1003L, 1001L, 1002L);
    }

    @Test
    void healthMetricRepository_filtersByPatientClinicDoctorAndType() {
        LocalDateTime since = LocalDateTime.of(2026, 6, 1, 0, 0);

        assertThat(healthMetricRepository
                .findByPatientIdAndIsDeletedFalseOrderByMeasuredAtDesc(101L, PageRequest.of(0, 10))
                .getContent())
                .extracting("id")
                .containsExactly(3003L, 3002L, 3001L);

        assertThat(healthMetricRepository.findByClinicIdAndMetricTypeAndSince(1L, MetricType.BLOOD_SUGAR, since))
                .extracting("id")
                .containsExactly(3001L, 3002L);

        assertThat(healthMetricRepository.findByDoctorIdAndMetricTypeAndSince(4L, MetricType.BLOOD_SUGAR, since))
                .extracting("id")
                .containsExactly(3001L, 3002L);
    }

    @Test
    void prescriptionRepository_filtersDoctorPatientStatusAndSearchTerm() {
        assertThat(prescriptionRepository.findByDoctorIdAndStatus(
                        4L, PrescriptionStatus.ACTIVE, PageRequest.of(0, 10))
                .getContent())
                .extracting("prescriptionCode")
                .containsExactly("RX-001");

        assertThat(prescriptionRepository.findByPatientIdAndStatus(101L, PrescriptionStatus.ACTIVE))
                .extracting("prescriptionCode")
                .containsExactly("RX-001");

        assertThat(prescriptionRepository.findByDoctorIdAndSearchTerm(
                        4L, "RX-001", PageRequest.of(0, 10))
                .getContent())
                .extracting("prescriptionCode")
                .contains("RX-001");
    }
}
