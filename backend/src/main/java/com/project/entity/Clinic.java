package com.project.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(name = "doctor_count")
    @Builder.Default
    private Integer doctorCount = 0;

    @Column(name = "patient_count")
    @Builder.Default
    private Integer patientCount = 0;

    @Column(name = "high_risk_patient_count")
    @Builder.Default
    private Integer highRiskPatientCount = 0;
}
