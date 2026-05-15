package com.project.controller;

import com.project.entity.SupportTicket;
import com.project.service.SupportTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/support-tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SupportTicketController {

    private final SupportTicketService ticketService;

    @PostMapping
    public ResponseEntity<SupportTicket> createTicket(@RequestBody SupportTicket ticket) {
        return ResponseEntity.ok(ticketService.createTicket(ticket));
    }

    @GetMapping
    public ResponseEntity<Page<SupportTicket>> getAllTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            Pageable pageable) {
        return ResponseEntity.ok(ticketService.getAllTickets(status, priority, pageable));
    }

    @GetMapping("/clinic/{clinicId}")
    public ResponseEntity<Page<SupportTicket>> getTicketsByClinic(
            @PathVariable Long clinicId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(ticketService.getTicketsByClinic(clinicId, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupportTicket> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<SupportTicket> getTicketByCode(@PathVariable String code) {
        return ResponseEntity.ok(ticketService.getTicketByCode(code));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<SupportTicket> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String adminNote) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, status, adminNote));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(ticketService.getTicketStats());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }
}
