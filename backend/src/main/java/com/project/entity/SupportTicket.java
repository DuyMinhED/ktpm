package com.project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets", indexes = {
    @Index(name = "idx_ticket_status", columnList = "status"),
    @Index(name = "idx_ticket_priority", columnList = "priority"),
    @Index(name = "idx_ticket_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String ticketCode;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String category; // Kỹ thuật, Hỗ trợ nghiệp vụ, Hạ tầng, v.v.

    @Column(nullable = false)
    private String priority; // Khẩn cấp, Cao, Trung bình, Thấp

    @Column(nullable = false)
    private String status; // Mới, Đang xử lý, Chờ phản hồi, Đã giải quyết, Đã đóng

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(columnDefinition = "TEXT")
    private String adminNote;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User creator;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "clinic_id")
    private Clinic clinic;

    @Column
    private LocalDateTime closedAt;

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = "Mới";
        }
        if (this.ticketCode == null) {
            this.ticketCode = "TKT-" + (int)(Math.random() * 90000 + 10000);
        }
    }
}
