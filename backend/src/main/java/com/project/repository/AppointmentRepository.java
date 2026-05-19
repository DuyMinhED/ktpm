package com.project.repository;

import com.project.entity.Appointment;
import com.project.entity.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

        // === Doctor-side queries ===
        long countByDoctorIdAndStatusAndAppointmentTimeAfter(Long doctorId, AppointmentStatus status, LocalDateTime time);
        long countByDoctorIdAndStatusInAndAppointmentTimeAfter(Long doctorId, List<AppointmentStatus> statuses, LocalDateTime time);
        long countByDoctorIdAndStatus(Long doctorId, AppointmentStatus status);

        List<Appointment> findByDoctorIdAndStatusInAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
                        Long doctorId, List<AppointmentStatus> statuses, LocalDateTime time);

        List<Appointment> findByDoctorIdOrderByAppointmentTimeDesc(Long doctorId);

        @Query("SELECT a FROM Appointment a JOIN FETCH a.patient WHERE a.doctorId = :doctorId " +
                        "AND a.status = 'SCHEDULED' AND a.appointmentTime >= :startOfDay " +
                        "ORDER BY a.appointmentTime ASC")
        List<Appointment> findUpcomingAppointments(Long doctorId, LocalDateTime startOfDay, Pageable pageable);

        // === Patient-side queries ===
        List<Appointment> findByPatientIdAndStatusInAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
                        Long patientId, List<AppointmentStatus> statuses, LocalDateTime after);

        List<Appointment> findByPatientIdAndStatusAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
                        Long patientId, AppointmentStatus status, LocalDateTime after);

        Page<Appointment> findByPatientIdAndStatusOrderByAppointmentTimeDesc(
                        Long patientId, AppointmentStatus status, Pageable pageable);

        List<Appointment> findByPatientIdOrderByAppointmentTimeDesc(Long patientId);

        @Query(value = "SELECT u.clinic_id, COUNT(a.id) FROM appointments a " +
                       "JOIN users u ON a.doctor_id = u.id " +
                       "WHERE a.is_deleted = false GROUP BY u.clinic_id", nativeQuery = true)
        List<Object[]> countTotalAppointmentsByClinicNative();

        @Query(value = "SELECT u.clinic_id, COUNT(a.id) FROM appointments a " +
                       "JOIN users u ON a.doctor_id = u.id " +
                       "WHERE a.is_deleted = false AND a.created_at >= :since GROUP BY u.clinic_id", nativeQuery = true)
        List<Object[]> countNewBookingsByClinicNative(@org.springframework.data.repository.query.Param("since") LocalDateTime since);

        @Query(value = "SELECT u.clinic_id, " +
                       "CAST(SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) AS DOUBLE PRECISION) * 100.0 / NULLIF(COUNT(a.id), 0) " +
                       "FROM appointments a JOIN users u ON a.doctor_id = u.id " +
                       "WHERE a.is_deleted = false AND a.status != 'CANCELLED' GROUP BY u.clinic_id", nativeQuery = true)
        List<Object[]> calculateComplianceRateByClinicNative();

        long countByDoctorIdInAndCreatedAtBetweenAndIsDeletedFalse(List<Long> doctorIds, LocalDateTime start, LocalDateTime end);
        long countByDoctorIdAndIsDeletedFalse(Long doctorId);
        
        @org.springframework.data.jpa.repository.Query(value = "SELECT CAST(a.created_at AS date) AS d, COUNT(a.id) FROM appointments a WHERE a.doctor_id IN :doctorIds AND a.is_deleted = false AND a.created_at >= :startDate GROUP BY CAST(a.created_at AS date) ORDER BY d ASC", nativeQuery = true)
        List<Object[]> countDailyAppointmentsByDoctorIds(@org.springframework.data.repository.query.Param("doctorIds") List<Long> doctorIds, @org.springframework.data.repository.query.Param("startDate") LocalDateTime startDate);

        @org.springframework.data.jpa.repository.Query(value = "SELECT EXTRACT(YEAR FROM a.created_at) AS y, EXTRACT(MONTH FROM a.created_at) AS m, COUNT(a.id) FROM appointments a WHERE a.doctor_id IN :doctorIds AND a.is_deleted = false AND a.created_at >= :startDate GROUP BY EXTRACT(YEAR FROM a.created_at), EXTRACT(MONTH FROM a.created_at) ORDER BY y ASC, m ASC", nativeQuery = true)
        List<Object[]> countMonthlyAppointmentsByDoctorIds(@org.springframework.data.repository.query.Param("doctorIds") List<Long> doctorIds, @org.springframework.data.repository.query.Param("startDate") LocalDateTime startDate);

        @Query("SELECT a.doctorId, COUNT(a) FROM Appointment a WHERE a.doctorId IN :doctorIds AND a.isDeleted = false GROUP BY a.doctorId")
        List<Object[]> countAppointmentsByDoctorIds(List<Long> doctorIds);


        @Query("SELECT a FROM Appointment a JOIN User u ON a.doctorId = u.id WHERE u.clinicId = :clinicId AND a.isDeleted = false ORDER BY a.appointmentTime DESC")
        Page<Appointment> findByClinicId(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, Pageable pageable);

        @Query("SELECT COUNT(a) FROM Appointment a JOIN User u ON a.doctorId = u.id WHERE u.clinicId = :clinicId AND a.isDeleted = false AND a.createdAt >= :since")
        long countByClinicIdAndCreatedAtAfter(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, @org.springframework.data.repository.query.Param("since") LocalDateTime since);

        @Query("SELECT COUNT(a) FROM Appointment a JOIN User u ON a.doctorId = u.id WHERE u.clinicId = :clinicId AND a.status = :status AND a.isDeleted = false AND a.createdAt >= :since")
        long countByClinicIdAndStatusAndCreatedAtAfter(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, @org.springframework.data.repository.query.Param("status") AppointmentStatus status, @org.springframework.data.repository.query.Param("since") LocalDateTime since);

        @Query("SELECT COUNT(a) FROM Appointment a JOIN User u ON a.doctorId = u.id " +
               "WHERE u.clinicId = :clinicId AND a.status = 'SCHEDULED' AND a.appointmentTime < :now AND a.isDeleted = false")
        long countOverdueByClinicId(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, @org.springframework.data.repository.query.Param("now") LocalDateTime now);

        @Query("SELECT a FROM Appointment a JOIN User u ON a.doctorId = u.id " +
               "WHERE u.clinicId = :clinicId AND a.patient.id = :patientId AND a.status = 'SCHEDULED' " +
               "AND a.isDeleted = false ORDER BY a.appointmentTime ASC")
        List<Appointment> findNextAppointmentsByPatient(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, @org.springframework.data.repository.query.Param("patientId") Long patientId, Pageable pageable);
        @Query(value = "SELECT CAST(created_at AS DATE) as d, COUNT(*) FROM appointments " +
                      "WHERE is_deleted = false AND created_at >= :startDate " +
                      "GROUP BY CAST(created_at AS DATE) ORDER BY d ASC", nativeQuery = true)
        List<Object[]> countAllAppointmentsByDayNative(@org.springframework.data.repository.query.Param("startDate") LocalDateTime startDate);

        @Query(value = "SELECT DATE_TRUNC('month', created_at) as m, COUNT(*) FROM appointments " +
                      "WHERE is_deleted = false AND created_at >= :startDate " +
                      "GROUP BY m ORDER BY m ASC", nativeQuery = true)
        List<Object[]> countAllAppointmentsByMonthNative(@org.springframework.data.repository.query.Param("startDate") LocalDateTime startDate);

        @Query(value = "SELECT DATE_TRUNC('year', created_at) as y, COUNT(*) FROM appointments " +
                      "WHERE is_deleted = false AND created_at >= :startDate " +
                      "GROUP BY y ORDER BY y ASC", nativeQuery = true)
        List<Object[]> countAllAppointmentsByYearNative(@org.springframework.data.repository.query.Param("startDate") LocalDateTime startDate);

        @Query("SELECT COUNT(a) FROM Appointment a JOIN User u ON a.doctorId = u.id WHERE u.clinicId = :clinicId AND a.isDeleted = false")
        long countByClinicId(@org.springframework.data.repository.query.Param("clinicId") Long clinicId);

        @Query("SELECT COUNT(a) FROM Appointment a JOIN User u ON a.doctorId = u.id WHERE u.clinicId = :clinicId AND a.status = :status AND a.isDeleted = false")
        long countByClinicIdAndStatus(@org.springframework.data.repository.query.Param("clinicId") Long clinicId, @org.springframework.data.repository.query.Param("status") AppointmentStatus status);

        @Query("SELECT a.appointmentTime, a.endTime FROM Appointment a JOIN User u ON a.doctorId = u.id WHERE u.clinicId = :clinicId AND a.status = 'COMPLETED' AND a.endTime IS NOT NULL AND a.isDeleted = false")
        List<Object[]> findCompletedAppointmentTimesByClinic(@org.springframework.data.repository.query.Param("clinicId") Long clinicId);

        @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentTime >= :start AND a.appointmentTime < :end AND a.status IN :statuses AND a.isDeleted = false ORDER BY a.appointmentTime ASC")
        List<Appointment> findByDoctorIdAndDateRangeAndStatuses(
                @org.springframework.data.repository.query.Param("doctorId") Long doctorId,
                @org.springframework.data.repository.query.Param("start") LocalDateTime start,
                @org.springframework.data.repository.query.Param("end") LocalDateTime end,
                @org.springframework.data.repository.query.Param("statuses") List<AppointmentStatus> statuses);

        @Query("SELECT a FROM Appointment a JOIN User u ON a.doctorId = u.id WHERE u.clinicId = :clinicId AND a.appointmentTime >= :start AND a.appointmentTime < :end AND a.status IN :statuses AND a.isDeleted = false ORDER BY a.appointmentTime ASC")
        List<Appointment> findByClinicIdAndDateRangeAndStatuses(
                @org.springframework.data.repository.query.Param("clinicId") Long clinicId,
                @org.springframework.data.repository.query.Param("start") LocalDateTime start,
                @org.springframework.data.repository.query.Param("end") LocalDateTime end,
                @org.springframework.data.repository.query.Param("statuses") List<AppointmentStatus> statuses);

        @Query(value = "SELECT COUNT(DISTINCT a.patient_id) FROM appointments a WHERE a.status = 'COMPLETED' AND a.is_deleted = false", nativeQuery = true)
        long countPatientsWithAnyCompletedAppointments();

        @Query(value = "SELECT COUNT(*) FROM (SELECT patient_id FROM appointments WHERE status = 'COMPLETED' AND is_deleted = false GROUP BY patient_id HAVING COUNT(id) >= 2) AS sub", nativeQuery = true)
        long countPatientsWithMultipleCompletedAppointments();

        @Query(value = "SELECT COUNT(DISTINCT a.patient_id) FROM appointments a WHERE a.status = 'COMPLETED' AND a.is_deleted = false AND a.appointment_time >= :since", nativeQuery = true)
        long countPatientsWithRecentCompletedAppointments(@org.springframework.data.repository.query.Param("since") LocalDateTime since);

        @Query(value = "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (a.end_time - a.appointment_time)) / 60), 0.0) " +
                       "FROM appointments a WHERE a.status = 'COMPLETED' AND a.end_time IS NOT NULL AND a.is_deleted = false", nativeQuery = true)
        double calculateAverageConsultationTime();

        @Query(value = "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (a.end_time - a.appointment_time)) / 60), 0.0) " +
                       "FROM appointments a JOIN users u ON a.doctor_id = u.id " +
                       "WHERE u.clinic_id = :clinicId AND a.status = 'COMPLETED' AND a.end_time IS NOT NULL AND a.is_deleted = false", nativeQuery = true)
        double calculateAverageConsultationTimeByClinic(@org.springframework.data.repository.query.Param("clinicId") Long clinicId);

        @Query(value = "SELECT COALESCE(CAST(SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) AS DOUBLE PRECISION) / NULLIF(COUNT(a.id), 0), 0.0) " +
                       "FROM appointments a JOIN users u ON a.doctor_id = u.id " +
                       "WHERE u.clinic_id = :clinicId AND a.is_deleted = false", nativeQuery = true)
        double calculateAdherenceRateByClinic(@org.springframework.data.repository.query.Param("clinicId") Long clinicId);
}
