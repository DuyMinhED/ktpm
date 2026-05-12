package com.project.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments", indexes = {
    @Index(name = "idx_appointment_doctor_id", columnList = "doctor_id"),
    @Index(name = "idx_appointment_status", columnList = "status"),
    @Index(name = "idx_appointment_created_at", columnList = "created_at"),
    @Index(name = "idx_appointment_is_deleted", columnList = "is_deleted"),
    @Index(name = "idx_appointment_doctor_created_deleted", columnList = "doctor_id, created_at, is_deleted")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "appointment_time", nullable = false)
    private LocalDateTime appointmentTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AppointmentStatus status; // SCHEDULED, COMPLETED, CANCELLED

    @Column(length = 255)
    private String type; // IN_PERSON, ONLINE

    @Column(length = 255)
    private String location;

    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "diagnosis_summary", columnDefinition = "TEXT")
    private String diagnosisSummary;

    @Column(name = "doctor_name", length = 100)
    private String doctorName;

    @Column(name = "doctor_specialty", length = 100)
    private String doctorSpecialty;

    @Column(name = "doctor_avatar_url", length = 500)
    private String doctorAvatarUrl;

    @Builder.Default
    @Column(name = "reminder_enabled", nullable = false)
    private boolean reminderEnabled = false;
}
