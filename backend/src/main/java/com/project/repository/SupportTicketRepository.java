package com.project.repository;

import com.project.entity.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    
    Optional<SupportTicket> findByTicketCode(String ticketCode);
    
    
    Page<SupportTicket> findByStatus(String status, Pageable pageable);
    
    Page<SupportTicket> findByPriority(String priority, Pageable pageable);
    
    Page<SupportTicket> findByCreatorId(Long creatorId, Pageable pageable);

    Page<SupportTicket> findByCreatorIdAndStatus(Long creatorId, String status, Pageable pageable);
    
    Page<SupportTicket> findByClinicId(Long clinicId, Pageable pageable);
    
    Page<SupportTicket> findByClinicIdAndStatus(Long clinicId, String status, Pageable pageable);
    
    long countByStatus(String status);
    
    long countByPriority(String priority);
}
