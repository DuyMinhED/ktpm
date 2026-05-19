package com.project.service.impl;

import com.project.entity.SupportTicket;
import com.project.repository.SupportTicketRepository;
import com.project.service.AuditService;
import com.project.service.SupportTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import com.project.repository.UserRepository;
import com.project.repository.ClinicRepository;
import com.project.security.CustomUserDetails;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final AuditService auditService;
    private final UserRepository userRepository;
    private final ClinicRepository clinicRepository;

    @Override
    @Transactional
    public SupportTicket createTicket(SupportTicket ticket) {
        try {
            Object rawPrincipal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (rawPrincipal instanceof CustomUserDetails currentUser) {
                userRepository.findById(currentUser.getId()).ifPresent(ticket::setCreator);
                if (currentUser.getClinicId() != null) {
                    clinicRepository.findById(currentUser.getClinicId()).ifPresent(ticket::setClinic);
                }
            }
        } catch (Exception e) {
            // Fallback for test contexts
        }

        SupportTicket savedTicket = ticketRepository.save(Objects.requireNonNull(ticket));
        
        auditService.recordActivity(
            "CREATE_TICKET",
            "SUPPORT",
            "Yêu cầu hỗ trợ mới: " + savedTicket.getSubject(),
            "SUCCESS"
        );
        
        return savedTicket;
    }

    @Override
    @Transactional
    public SupportTicket updateTicketStatus(Long id, String status, String adminNote) {
        SupportTicket ticket = ticketRepository.findById(Objects.requireNonNull(id))
            .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu hỗ trợ"));
        
        String oldStatus = ticket.getStatus();
        ticket.setStatus(status);
        ticket.setAdminNote(adminNote);
        
        if ("Đã giải quyết".equals(status) || "Đã đóng".equals(status)) {
            ticket.setClosedAt(LocalDateTime.now());
        }
        
        SupportTicket updatedTicket = ticketRepository.save(ticket);
        
        auditService.recordActivity(
            "UPDATE_TICKET_STATUS",
            "SUPPORT",
            String.format("Cập nhật trạng thái yêu cầu %s: %s -> %s", ticket.getTicketCode(), oldStatus, status),
            "SUCCESS"
        );
        
        return updatedTicket;
    }

    @Override
    public SupportTicket getTicketById(Long id) {
        return ticketRepository.findById(Objects.requireNonNull(id))
            .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu hỗ trợ"));
    }

    @Override
    public SupportTicket getTicketByCode(String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy mã yêu cầu " + ticketCode));
    }

    @Override
    public Page<SupportTicket> getTicketsByClinic(Long clinicId, String status, Pageable pageable) {
        if (status != null && !status.isEmpty() && !"Tất cả trạng thái".equals(status)) {
            return ticketRepository.findByClinicIdAndStatus(clinicId, status, pageable);
        }
        return ticketRepository.findByClinicId(clinicId, pageable);
    }

    @Override
    public Page<SupportTicket> getTicketsByCreator(Long creatorId, String status, Pageable pageable) {
        if (status != null && !status.isEmpty() && !"Tất cả trạng thái".equals(status)) {
            return ticketRepository.findByCreatorIdAndStatus(creatorId, status, pageable);
        }
        return ticketRepository.findByCreatorId(creatorId, pageable);
    }

    @Override
    public Page<SupportTicket> getAllTickets(String status, String priority, Pageable pageable) {
        // Simple filtering logic for demonstration
        if (status != null && !status.isEmpty() && !"Tất cả trạng thái".equals(status)) {
            return ticketRepository.findByStatus(status, pageable);
        }
        if (priority != null && !priority.isEmpty() && !"Tất cả cấp độ".equalsIgnoreCase(priority)) {
            return ticketRepository.findByPriority(priority, Objects.requireNonNull(pageable));
        }
        return ticketRepository.findAll(Objects.requireNonNull(pageable));
    }

    @Override
    public Map<String, Long> getTicketStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", ticketRepository.count());
        stats.put("new", ticketRepository.countByStatus("Mới"));
        stats.put("processing", ticketRepository.countByStatus("Đang xử lý"));
        stats.put("resolved", ticketRepository.countByStatus("Đã giải quyết"));
        stats.put("urgent", ticketRepository.countByPriority("Khẩn cấp"));
        return stats;
    }

    @Override
    @Transactional
    public void deleteTicket(Long id) {
        ticketRepository.deleteById(Objects.requireNonNull(id));
    }
}
