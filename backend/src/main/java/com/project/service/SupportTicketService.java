package com.project.service;

import com.project.entity.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface SupportTicketService {
    SupportTicket createTicket(SupportTicket ticket);
    
    SupportTicket updateTicketStatus(Long id, String status, String adminNote);
    
    SupportTicket getTicketById(Long id);
    
    SupportTicket getTicketByCode(String ticketCode);
    
    Page<SupportTicket> getTicketsByClinic(Long clinicId, String status, Pageable pageable);

    Page<SupportTicket> getTicketsByCreator(Long creatorId, String status, Pageable pageable);

    Page<SupportTicket> getAllTickets(String status, String priority, Pageable pageable);
    
    Map<String, Long> getTicketStats();
    
    void deleteTicket(Long id);
}
