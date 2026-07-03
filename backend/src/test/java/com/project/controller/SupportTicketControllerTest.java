package com.project.controller;

import com.project.entity.SupportTicket;
import com.project.service.SupportTicketService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SupportTicketControllerTest {

    private final SupportTicketService service = mock(SupportTicketService.class);
    private final SupportTicketController controller = new SupportTicketController(service);

    @Test
    void createTicket_returnsCreatedTicket() {
        SupportTicket request = ticket(1L);
        when(service.createTicket(request)).thenReturn(request);

        ResponseEntity<SupportTicket> response = controller.createTicket(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(request, response.getBody());
        verify(service).createTicket(request);
    }

    @Test
    void getAllTickets_delegatesFiltersAndPageable() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<SupportTicket> page = new PageImpl<>(List.of(ticket(1L)), pageable, 1);
        when(service.getAllTickets("NEW", "HIGH", pageable)).thenReturn(page);

        ResponseEntity<Page<SupportTicket>> response = controller.getAllTickets("NEW", "HIGH", pageable);

        assertSame(page, response.getBody());
        verify(service).getAllTickets("NEW", "HIGH", pageable);
    }

    @Test
    void getTicketsByClinicAndCreator_delegatePathFiltersAndPageable() {
        PageRequest pageable = PageRequest.of(0, 5);
        Page<SupportTicket> page = new PageImpl<>(List.of(ticket(2L)));
        when(service.getTicketsByClinic(10L, "OPEN", pageable)).thenReturn(page);
        when(service.getTicketsByCreator(20L, "OPEN", pageable)).thenReturn(page);

        assertSame(page, controller.getTicketsByClinic(10L, "OPEN", pageable).getBody());
        assertSame(page, controller.getTicketsByCreator(20L, "OPEN", pageable).getBody());
    }

    @Test
    void getByIdAndCode_returnServiceResults() {
        SupportTicket ticket = ticket(3L);
        when(service.getTicketById(3L)).thenReturn(ticket);
        when(service.getTicketByCode("TKT-3")).thenReturn(ticket);

        assertSame(ticket, controller.getTicketById(3L).getBody());
        assertSame(ticket, controller.getTicketByCode("TKT-3").getBody());
    }

    @Test
    void updateStatusAndStatsAndDelete_delegateToService() {
        SupportTicket updated = ticket(4L);
        Map<String, Long> stats = Map.of("OPEN", 2L);
        when(service.updateTicketStatus(4L, "CLOSED", "done")).thenReturn(updated);
        when(service.getTicketStats()).thenReturn(stats);

        assertSame(updated, controller.updateStatus(4L, "CLOSED", "done").getBody());
        assertSame(stats, controller.getStats().getBody());
        assertEquals(HttpStatus.NO_CONTENT, controller.deleteTicket(4L).getStatusCode());

        verify(service).deleteTicket(4L);
    }

    private static SupportTicket ticket(Long id) {
        return SupportTicket.builder()
                .id(id)
                .ticketCode("TKT-" + id)
                .subject("Subject")
                .category("Technical")
                .priority("HIGH")
                .status("OPEN")
                .message("Need support")
                .build();
    }
}
