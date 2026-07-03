package com.project.service.impl;

import com.project.entity.Clinic;
import com.project.entity.SupportTicket;
import com.project.entity.User;
import com.project.repository.ClinicRepository;
import com.project.repository.SupportTicketRepository;
import com.project.repository.UserRepository;
import com.project.security.CustomUserDetails;
import com.project.service.AuditService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SupportTicketServiceImplTest {

    private final SupportTicketRepository ticketRepository = mock(SupportTicketRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final ClinicRepository clinicRepository = mock(ClinicRepository.class);
    private final SupportTicketServiceImpl service = new SupportTicketServiceImpl(
            ticketRepository, auditService, userRepository, clinicRepository);

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createTicket_withAuthenticatedUserAttachesCreatorClinicAndAudits() {
        CustomUserDetails principal = CustomUserDetails.builder()
                .id(7L)
                .clinicId(10L)
                .authorities(List.of())
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        User user = User.builder().id(7L).fullName("Creator").build();
        Clinic clinic = Clinic.builder().id(10L).name("Clinic").build();
        SupportTicket ticket = ticket(1L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(clinicRepository.findById(10L)).thenReturn(Optional.of(clinic));
        when(ticketRepository.save(ticket)).thenReturn(ticket);

        SupportTicket result = service.createTicket(ticket);

        assertSame(ticket, result);
        assertSame(user, result.getCreator());
        assertSame(clinic, result.getClinic());
        verify(auditService).recordActivity(eq("CREATE_TICKET"), eq("SUPPORT"), any(), eq("SUCCESS"));
    }

    @Test
    void createTicket_withoutAuthenticationStillSavesAndAudits() {
        SupportTicket ticket = ticket(2L);
        when(ticketRepository.save(ticket)).thenReturn(ticket);

        SupportTicket result = service.createTicket(ticket);

        assertSame(ticket, result);
        verify(ticketRepository).save(ticket);
        verify(auditService).recordActivity(eq("CREATE_TICKET"), eq("SUPPORT"), any(), eq("SUCCESS"));
    }

    @Test
    void updateTicketStatus_setsClosedAtForResolvedStatusAndAudits() {
        SupportTicket ticket = ticket(3L);
        ticket.setStatus("Mới");
        when(ticketRepository.findById(3L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);

        SupportTicket result = service.updateTicketStatus(3L, "Đã giải quyết", "done");

        assertSame(ticket, result);
        assertEquals("Đã giải quyết", result.getStatus());
        assertEquals("done", result.getAdminNote());
        assertNotNull(result.getClosedAt());
        verify(auditService).recordActivity(eq("UPDATE_TICKET_STATUS"), eq("SUPPORT"), any(), eq("SUCCESS"));
    }

    @Test
    void updateTicketStatus_missingTicketThrows() {
        when(ticketRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.updateTicketStatus(404L, "OPEN", null));
    }

    @Test
    void getTicketByIdAndCode_returnTicketOrThrow() {
        SupportTicket ticket = ticket(4L);
        when(ticketRepository.findById(4L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.findByTicketCode("TKT-4")).thenReturn(Optional.of(ticket));
        when(ticketRepository.findById(404L)).thenReturn(Optional.empty());
        when(ticketRepository.findByTicketCode("missing")).thenReturn(Optional.empty());

        assertSame(ticket, service.getTicketById(4L));
        assertSame(ticket, service.getTicketByCode("TKT-4"));
        assertThrows(RuntimeException.class, () -> service.getTicketById(404L));
        assertThrows(RuntimeException.class, () -> service.getTicketByCode("missing"));
    }

    @Test
    void listMethods_chooseSpecificOrGeneralQueriesByFilter() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<SupportTicket> page = new PageImpl<>(List.of(ticket(5L)));
        when(ticketRepository.findByClinicIdAndStatus(1L, "OPEN", pageable)).thenReturn(page);
        when(ticketRepository.findByClinicId(1L, pageable)).thenReturn(page);
        when(ticketRepository.findByCreatorIdAndStatus(2L, "OPEN", pageable)).thenReturn(page);
        when(ticketRepository.findByCreatorId(2L, pageable)).thenReturn(page);
        when(ticketRepository.findByStatus("OPEN", pageable)).thenReturn(page);
        when(ticketRepository.findByPriority("HIGH", pageable)).thenReturn(page);
        when(ticketRepository.findAll(pageable)).thenReturn(page);

        assertSame(page, service.getTicketsByClinic(1L, "OPEN", pageable));
        assertSame(page, service.getTicketsByClinic(1L, "", pageable));
        assertSame(page, service.getTicketsByCreator(2L, "OPEN", pageable));
        assertSame(page, service.getTicketsByCreator(2L, null, pageable));
        assertSame(page, service.getAllTickets("OPEN", null, pageable));
        assertSame(page, service.getAllTickets(null, "HIGH", pageable));
        assertSame(page, service.getAllTickets(null, null, pageable));
    }

    @Test
    void statsAndDelete_delegateToRepository() {
        when(ticketRepository.count()).thenReturn(10L);
        when(ticketRepository.countByStatus("Mới")).thenReturn(3L);
        when(ticketRepository.countByStatus("Đang xử lý")).thenReturn(2L);
        when(ticketRepository.countByStatus("Đã giải quyết")).thenReturn(4L);
        when(ticketRepository.countByPriority("Khẩn cấp")).thenReturn(1L);

        Map<String, Long> stats = service.getTicketStats();
        service.deleteTicket(9L);

        assertEquals(10L, stats.get("total"));
        assertEquals(3L, stats.get("new"));
        assertEquals(2L, stats.get("processing"));
        assertEquals(4L, stats.get("resolved"));
        assertEquals(1L, stats.get("urgent"));
        verify(ticketRepository).deleteById(9L);
    }

    private static SupportTicket ticket(Long id) {
        return SupportTicket.builder()
                .id(id)
                .ticketCode("TKT-" + id)
                .subject("Subject " + id)
                .category("Technical")
                .priority("HIGH")
                .status("OPEN")
                .message("Need help")
                .build();
    }
}
