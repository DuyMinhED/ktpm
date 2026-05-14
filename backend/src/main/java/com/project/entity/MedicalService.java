package com.project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medical_services", indexes = {
    @Index(name = "idx_medical_service_status", columnList = "status"),
    @Index(name = "idx_medical_service_category", columnList = "category"),
    @Index(name = "idx_medical_service_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalService extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 100)
    private String duration;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String status; // e.g., "Đang kinh doanh", "Ngừng kinh doanh"

    @Column(name = "clinic_id")
    private Long clinicId; // NULL for global services, otherwise tied to specific clinic

    @ElementCollection
    @CollectionTable(name = "medical_service_features", joinColumns = @JoinColumn(name = "service_id"))
    @Column(name = "feature")
    @Builder.Default
    private List<String> features = new ArrayList<>();
}
