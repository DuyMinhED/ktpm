package com.project.repository;

import com.project.entity.User;
import com.project.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

       Optional<User> findByEmail(String email);
       java.util.List<User> findByRole(UserRole role);
       java.util.List<User> findByClinicIdAndRoleAndIsDeletedFalse(Long clinicId, UserRole role);

       long countByIsDeletedFalse();

       long countByRoleAndIsDeletedFalse(UserRole role);

       long countByRoleAndClinicIdAndIsDeletedFalse(UserRole role, Long clinicId);

       @Query("SELECT u.clinicId, COUNT(u) FROM User u WHERE u.isDeleted = false AND u.role = :role GROUP BY u.clinicId")
       java.util.List<Object[]> countByRoleGroupedByClinic(@Param("role") UserRole role);

       @Query("SELECT u.clinicId, COUNT(u) FROM User u WHERE u.isDeleted = false AND u.role = :role AND u.createdAt >= :startDate AND u.createdAt < :endDate GROUP BY u.clinicId")
       java.util.List<Object[]> countByRoleAndCreatedAtBetweenGroupedByClinic(
           @Param("role") UserRole role, 
           @Param("startDate") java.time.LocalDateTime startDate, 
           @Param("endDate") java.time.LocalDateTime endDate);

       long countByStatusAndIsDeletedFalse(String status);

       @Query("SELECT COUNT(u) FROM User u WHERE u.isDeleted = false AND u.role = :role AND u.createdAt >= :startDate AND u.createdAt < :endDate")
       long countNewUsersBetween(@Param("role") UserRole role, @Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

       @Query(value = "SELECT CAST(created_at AS DATE) as d, COUNT(*) FROM users " +
                     "WHERE is_deleted = false AND role = 'PATIENT' AND created_at >= :startDate " +
                     "GROUP BY CAST(created_at AS DATE) ORDER BY d ASC", nativeQuery = true)
       java.util.List<Object[]> countNewPatientsByDayNative(@Param("startDate") java.time.LocalDateTime startDate);

       @Query(value = "SELECT DATE_TRUNC('month', created_at) as m, COUNT(*) FROM users " +
                     "WHERE is_deleted = false AND role = 'PATIENT' AND created_at >= :startDate " +
                     "GROUP BY m ORDER BY m ASC", nativeQuery = true)
       java.util.List<Object[]> countNewPatientsByMonthNative(@Param("startDate") java.time.LocalDateTime startDate);

       @Query(value = "SELECT DATE_TRUNC('year', created_at) as y, COUNT(*) FROM users " +
                     "WHERE is_deleted = false AND role = 'PATIENT' AND created_at >= :startDate " +
                     "GROUP BY y ORDER BY y ASC", nativeQuery = true)
       java.util.List<Object[]> countNewPatientsByYearNative(@Param("startDate") java.time.LocalDateTime startDate);

       @Query("SELECT u FROM User u WHERE u.isDeleted = false AND " +
                     "(:role IS NULL OR u.role = :role) AND " +
                     "(:status IS NULL OR u.status = :status) AND " +
                     "(:clinicId IS NULL OR u.clinicId = :clinicId) AND " +
                     "(:specialization IS NULL OR :specialization = '' OR u.specialization = :specialization) AND " +
                     "(:degree IS NULL OR :degree = '' OR u.degree = :degree) AND " +
                     "(:experience IS NULL OR :experience = '' OR u.experience LIKE CONCAT('%', :experience, '%')) AND " +
                     "(:keyword IS NULL OR :keyword = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                     "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                     "ORDER BY u.id DESC")
       Page<User> findByFilters(
               @Param("role") UserRole role, 
               @Param("status") String status, 
               @Param("clinicId") Long clinicId, 
               @Param("specialization") String specialization, 
               @Param("degree") String degree, 
               @Param("experience") String experience, 
               @Param("keyword") String keyword, 
               Pageable pageable);

       @org.springframework.data.jpa.repository.Modifying
       @org.springframework.data.jpa.repository.Query("UPDATE User u SET u.status = :status WHERE u.clinicId = :clinicId AND u.isDeleted = false")
       void updateStatusByClinicId(@Param("clinicId") Long clinicId, @Param("status") String status);
}
