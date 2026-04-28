package com.project.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_clinic_id", columnList = "clinic_id"),
    @Index(name = "idx_user_role", columnList = "role"),
    @Index(name = "idx_user_status", columnList = "status"),
    @Index(name = "idx_user_created_at", columnList = "created_at"),
    @Index(name = "idx_user_is_deleted", columnList = "is_deleted")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private UserRole role; // ADMIN, DOCTOR, CLINIC_MANAGER, PATIENT

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "clinic_id")
    private Long clinicId;
    
    @Column(length = 100)
    private String specialization; // For Doctors
    
    @Column(length = 100)
    private String department; // For Doctors

    @Column(name = "license_number", length = 50)
    private String licenseNumber; // For Doctors (CCHN)

    @Column(name = "license_image_url", length = 500)
    private String licenseImageUrl; // For Doctors (Ảnh bằng chứng CCHN)

    @Column(length = 50)
    private String degree; // For Doctors (Học hàm/Trình độ)

    @Column(columnDefinition = "TEXT")
    private String bio; // For Doctors (Tóm tắt tiểu sử)

    @Column(length = 100)
    private String experience; // Years of experience or text

    @Column(name = "max_patients")
    private Integer maxPatients;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE
}
