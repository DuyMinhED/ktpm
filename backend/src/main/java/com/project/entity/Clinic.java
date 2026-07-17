package com.project.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "clinics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Clinic extends BaseEntity {

    @Column(name = "email", length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinic_code", unique = true, length = 20)
    private String clinicCode;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 20)
    private String phone;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "manager_id")
    private Long managerId;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Formula("(SELECT COUNT(*) FROM users u WHERE u.clinic_id = id AND u.role = 'DOCTOR' AND u.is_deleted = false)")
    @Builder.Default
    private Integer doctorCount = 0;

    @Formula("(SELECT COUNT(*) FROM patients p WHERE p.clinic_id = id AND p.is_deleted = false)")
    @Builder.Default
    private Integer patientCount = 0;

    @Formula("(SELECT COUNT(*) FROM patients p WHERE p.clinic_id = id AND p.risk_level = 'HIGH' AND p.is_deleted = false)")
    @Builder.Default
    private Integer highRiskPatientCount = 0;
}
