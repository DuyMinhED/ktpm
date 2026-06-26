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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class SupportTicketServiceImplTest {

    @Mock
    private SupportTicketRepository ticketRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClinicRepository clinicRepository;

    @InjectMocks
    private SupportTicketServiceImpl ticketService;

    private SecurityContext originalContext;

    @BeforeEach
    void setUp() {
        originalContext = SecurityContextHolder.getContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.setContext(originalContext);
    }

    @Test
    void createTicket_success_authenticatedWithClinic() {
        // Mock SecurityContext
        CustomUserDetails userDetails = CustomUserDetails.builder()
                .id(1L)
                .clinicId(2L)
                .build();
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        User creator = new User();
        creator.setId(1L);
        Clinic clinic = new Clinic();
        clinic.setId(2L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(creator));
        when(clinicRepository.findById(2L)).thenReturn(Optional.of(clinic));

        SupportTicket inputTicket = new SupportTicket();
        inputTicket.setSubject("Test Subject");

        SupportTicket savedTicket = new SupportTicket();
        savedTicket.setId(10L);
        savedTicket.setSubject("Test Subject");
        savedTicket.setCreator(creator);
        savedTicket.setClinic(clinic);

        when(ticketRepository.save(any(SupportTicket.class))).thenReturn(savedTicket);

        SupportTicket result = ticketService.createTicket(inputTicket);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals(creator, result.getCreator());
        assertEquals(clinic, result.getClinic());
        verify(auditService, times(1)).recordActivity(
                eq("CREATE_TICKET"), eq("SUPPORT"), eq("Yêu cầu hỗ trợ mới: Test Subject"), eq("SUCCESS")
        );
    }

    @Test
    void createTicket_success_authenticatedNoClinic() {
        // Mock SecurityContext
        CustomUserDetails userDetails = CustomUserDetails.builder()
                .id(1L)
                .clinicId(null)
                .build();
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        User creator = new User();
        creator.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(creator));

        SupportTicket inputTicket = new SupportTicket();
        inputTicket.setSubject("Test Subject No Clinic");

        SupportTicket savedTicket = new SupportTicket();
        savedTicket.setId(11L);
        savedTicket.setSubject("Test Subject No Clinic");
        savedTicket.setCreator(creator);

        when(ticketRepository.save(any(SupportTicket.class))).thenReturn(savedTicket);

        SupportTicket result = ticketService.createTicket(inputTicket);

        assertNotNull(result);
        assertEquals(11L, result.getId());
        assertEquals(creator, result.getCreator());
        assertNull(result.getClinic());
        verify(clinicRepository, never()).findById(anyLong());
    }

    @Test
    void createTicket_success_anonymous() {
        // Mock SecurityContext with anonymous string principal
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn("anonymousUser");
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        SupportTicket inputTicket = new SupportTicket();
        inputTicket.setSubject("Anonymous Ticket");

        SupportTicket savedTicket = new SupportTicket();
        savedTicket.setId(12L);
        savedTicket.setSubject("Anonymous Ticket");

        when(ticketRepository.save(any(SupportTicket.class))).thenReturn(savedTicket);

        SupportTicket result = ticketService.createTicket(inputTicket);

        assertNotNull(result);
        assertEquals(12L, result.getId());
        assertNull(result.getCreator());
        assertNull(result.getClinic());
        verifyNoInteractions(userRepository, clinicRepository);
    }

    @Test
    void createTicket_exception_fallback() {
        // Mock SecurityContext to throw exception
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenThrow(new NullPointerException("Security Context is null"));
        SecurityContextHolder.setContext(context);

        SupportTicket inputTicket = new SupportTicket();
        inputTicket.setSubject("Exception Ticket");

        SupportTicket savedTicket = new SupportTicket();
        savedTicket.setId(13L);
        savedTicket.setSubject("Exception Ticket");

        when(ticketRepository.save(any(SupportTicket.class))).thenReturn(savedTicket);

        SupportTicket result = ticketService.createTicket(inputTicket);

        assertNotNull(result);
        assertEquals(13L, result.getId());
        assertNull(result.getCreator());
        assertNull(result.getClinic());
    }

    @Test
    void updateTicketStatus_success_resolved() {
        SupportTicket ticket = new SupportTicket();
        ticket.setId(1L);
        ticket.setTicketCode("TKT-001");
        ticket.setStatus("Mới");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(SupportTicket.class))).thenReturn(ticket);

        SupportTicket result = ticketService.updateTicketStatus(1L, "Đã giải quyết", "Xong rồi");

        assertNotNull(result);
        assertEquals("Đã giải quyết", result.getStatus());
        assertEquals("Xong rồi", result.getAdminNote());
        assertNotNull(result.getClosedAt());
        verify(auditService, times(1)).recordActivity(
                eq("UPDATE_TICKET_STATUS"), eq("SUPPORT"), eq("Cập nhật trạng thái yêu cầu TKT-001: Mới -> Đã giải quyết"), eq("SUCCESS")
        );
    }

    @Test
    void updateTicketStatus_success_closed() {
        SupportTicket ticket = new SupportTicket();
        ticket.setId(1L);
        ticket.setTicketCode("TKT-001");
        ticket.setStatus("Mới");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(SupportTicket.class))).thenReturn(ticket);

        SupportTicket result = ticketService.updateTicketStatus(1L, "Đã đóng", "Đóng yêu cầu");

        assertNotNull(result);
        assertEquals("Đã đóng", result.getStatus());
        assertNotNull(result.getClosedAt());
    }

    @Test
    void updateTicketStatus_success_otherStatus() {
        SupportTicket ticket = new SupportTicket();
        ticket.setId(1L);
        ticket.setTicketCode("TKT-001");
        ticket.setStatus("Mới");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(SupportTicket.class))).thenReturn(ticket);

        SupportTicket result = ticketService.updateTicketStatus(1L, "Đang xử lý", "Đang xem");

        assertNotNull(result);
        assertEquals("Đang xử lý", result.getStatus());
        assertNull(result.getClosedAt());
    }

    @Test
    void updateTicketStatus_notFound() {
        when(ticketRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> ticketService.updateTicketStatus(999L, "Đang xử lý", "Xem"));
    }

    @Test
    void getTicketById_success() {
        SupportTicket ticket = new SupportTicket();
        ticket.setId(1L);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        SupportTicket result = ticketService.getTicketById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getTicketById_notFound() {
        when(ticketRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> ticketService.getTicketById(999L));
    }

    @Test
    void getTicketByCode_success() {
        SupportTicket ticket = new SupportTicket();
        ticket.setTicketCode("TKT-123");
        when(ticketRepository.findByTicketCode("TKT-123")).thenReturn(Optional.of(ticket));

        SupportTicket result = ticketService.getTicketByCode("TKT-123");

        assertNotNull(result);
        assertEquals("TKT-123", result.getTicketCode());
    }

    @Test
    void getTicketByCode_notFound() {
        when(ticketRepository.findByTicketCode("TKT-999")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> ticketService.getTicketByCode("TKT-999"));
    }

    @Test
    void getTicketsByClinic_withStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<SupportTicket> page = new PageImpl<>(Collections.emptyList());
        when(ticketRepository.findByClinicIdAndStatus(1L, "Đang xử lý", pageable)).thenReturn(page);

        Page<SupportTicket> result = ticketService.getTicketsByClinic(1L, "Đang xử lý", pageable);

        assertNotNull(result);
        verify(ticketRepository, times(1)).findByClinicIdAndStatus(1L, "Đang xử lý", pageable);
    }

    @Test
    void getTicketsByClinic_allStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<SupportTicket> page = new PageImpl<>(Collections.emptyList());
        when(ticketRepository.findByClinicId(1L, pageable)).thenReturn(page);

        Page<SupportTicket> result1 = ticketService.getTicketsByClinic(1L, null, pageable);
        Page<SupportTicket> result2 = ticketService.getTicketsByClinic(1L, "", pageable);
        Page<SupportTicket> result3 = ticketService.getTicketsByClinic(1L, "Tất cả trạng thái", pageable);

        assertNotNull(result1);
        assertNotNull(result2);
        assertNotNull(result3);
        verify(ticketRepository, times(3)).findByClinicId(1L, pageable);
    }

    @Test
    void getTicketsByCreator_withStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<SupportTicket> page = new PageImpl<>(Collections.emptyList());
        when(ticketRepository.findByCreatorIdAndStatus(1L, "Mới", pageable)).thenReturn(page);

        Page<SupportTicket> result = ticketService.getTicketsByCreator(1L, "Mới", pageable);

        assertNotNull(result);
        verify(ticketRepository, times(1)).findByCreatorIdAndStatus(1L, "Mới", pageable);
    }

    @Test
    void getTicketsByCreator_allStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<SupportTicket> page = new PageImpl<>(Collections.emptyList());
        when(ticketRepository.findByCreatorId(1L, pageable)).thenReturn(page);

        Page<SupportTicket> result = ticketService.getTicketsByCreator(1L, "Tất cả trạng thái", pageable);

        assertNotNull(result);
        verify(ticketRepository, times(1)).findByCreatorId(1L, pageable);
    }

    @Test
    void getAllTickets_withStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<SupportTicket> page = new PageImpl<>(Collections.emptyList());
        when(ticketRepository.findByStatus("Mới", pageable)).thenReturn(page);

        Page<SupportTicket> result = ticketService.getAllTickets("Mới", null, pageable);

        assertNotNull(result);
        verify(ticketRepository, times(1)).findByStatus("Mới", pageable);
    }

    @Test
    void getAllTickets_withPriority() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<SupportTicket> page = new PageImpl<>(Collections.emptyList());
        when(ticketRepository.findByPriority("Khẩn cấp", pageable)).thenReturn(page);

        Page<SupportTicket> result = ticketService.getAllTickets("Tất cả trạng thái", "Khẩn cấp", pageable);

        assertNotNull(result);
        verify(ticketRepository, times(1)).findByPriority("Khẩn cấp", pageable);
    }

    @Test
    void getAllTickets_all() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<SupportTicket> page = new PageImpl<>(Collections.emptyList());
        when(ticketRepository.findAll(pageable)).thenReturn(page);

        Page<SupportTicket> result = ticketService.getAllTickets(null, null, pageable);

        assertNotNull(result);
        verify(ticketRepository, times(1)).findAll(pageable);
    }

    @Test
    void getTicketStats() {
        when(ticketRepository.count()).thenReturn(10L);
        when(ticketRepository.countByStatus("Mới")).thenReturn(3L);
        when(ticketRepository.countByStatus("Đang xử lý")).thenReturn(2L);
        when(ticketRepository.countByStatus("Đã giải quyết")).thenReturn(5L);
        when(ticketRepository.countByPriority("Khẩn cấp")).thenReturn(1L);

        Map<String, Long> stats = ticketService.getTicketStats();

        assertNotNull(stats);
        assertEquals(10L, stats.get("total"));
        assertEquals(3L, stats.get("new"));
        assertEquals(2L, stats.get("processing"));
        assertEquals(5L, stats.get("resolved"));
        assertEquals(1L, stats.get("urgent"));
    }

    @Test
    void deleteTicket() {
        doNothing().when(ticketRepository).deleteById(1L);

        ticketService.deleteTicket(1L);

        verify(ticketRepository, times(1)).deleteById(1L);
    }
}
