package com.project.service.impl;

import com.project.dto.request.SendMessageRequest;
import com.project.dto.response.ConversationResponse;
import com.project.dto.response.MessageResponse;
import com.project.entity.Conversation;
import com.project.entity.Message;
import com.project.entity.Patient;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.ConversationRepository;
import com.project.repository.MessageRepository;
import com.project.repository.PatientRepository;
import com.project.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorMessageServiceImplTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private DoctorMessageServiceImpl service;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("getConversations - maps patient, last message and unread count")
    void getConversations_mapsPatientConversation() {
        authenticateDoctor(5L);
        Patient patient = patient(1L, 101L, 5L);
        Conversation conversation = conversation(10L, patient, 5L);

        when(conversationRepository.findByDoctorIdAndIsActiveTrueOrderByLastMessageAtDesc(5L))
                .thenReturn(List.of(conversation));
        when(messageRepository.findTopByConversationIdOrderBySentAtDesc(10L))
                .thenReturn(Optional.of(message(20L, conversation, 101L, "PATIENT", "Last patient note", "TEXT")));
        when(messageRepository.countByConversationIdAndIsReadFalseAndSenderIdNot(10L, 5L)).thenReturn(2L);

        List<ConversationResponse> responses = service.getConversations();

        assertEquals(1, responses.size());
        assertEquals(10L, responses.get(0).getId());
        assertEquals(1L, responses.get(0).getPatientId());
        assertEquals("Patient 1", responses.get(0).getPatientName());
        assertEquals("patient.png", responses.get(0).getPatientAvatarUrl());
        assertEquals("Last patient note", responses.get(0).getLastMessage());
        assertEquals(2L, responses.get(0).getUnreadCount());
        assertTrue(responses.get(0).isOnline());
    }

    @Test
    @DisplayName("getConversations - uses empty last message when conversation has no messages")
    void getConversations_emptyLastMessage() {
        authenticateDoctor(5L);
        Patient patient = patient(1L, 101L, 5L);
        Conversation conversation = conversation(10L, patient, 5L);

        when(conversationRepository.findByDoctorIdAndIsActiveTrueOrderByLastMessageAtDesc(5L))
                .thenReturn(List.of(conversation));
        when(messageRepository.findTopByConversationIdOrderBySentAtDesc(10L)).thenReturn(Optional.empty());
        when(messageRepository.countByConversationIdAndIsReadFalseAndSenderIdNot(10L, 5L)).thenReturn(0L);

        List<ConversationResponse> responses = service.getConversations();

        assertEquals("", responses.get(0).getLastMessage());
        assertEquals(0L, responses.get(0).getUnreadCount());
    }

    @Test
    @DisplayName("getConversations - unauthenticated user is rejected")
    void getConversations_unauthenticated() {
        assertThrows(NoSuchElementException.class, () -> service.getConversations());
    }

    @Test
    @DisplayName("getMessages - maps message page")
    void getMessages_mapsPage() {
        Conversation conversation = conversation(10L, patient(1L, 101L, 5L), 5L);
        Message message = message(21L, conversation, 5L, "DOCTOR", "Image note", "IMAGE");

        when(messageRepository.findByConversationIdOrderBySentAtDesc(eq(10L), any()))
                .thenReturn(new PageImpl<>(List.of(message)));

        Page<MessageResponse> page = service.getMessages(10L, PageRequest.of(0, 5));

        assertEquals(1, page.getTotalElements());
        assertEquals(21L, page.getContent().get(0).getId());
        assertEquals("DOCTOR", page.getContent().get(0).getSenderType());
        assertEquals("IMAGE", page.getContent().get(0).getMessageType());
    }

    @Test
    @DisplayName("sendMessage - sends in existing conversation with default text type")
    void sendMessage_existingConversationDefaultType() {
        authenticateDoctor(5L);
        Patient patient = patient(1L, 101L, 5L);
        Conversation conversation = conversation(10L, patient, 5L);
        Message saved = message(30L, conversation, 5L, "DOCTOR", "Ping", "TEXT");

        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        MessageResponse response = service.sendMessage(SendMessageRequest.builder()
                .conversationId(10L)
                .content("Ping")
                .attachmentUrl("doctor-note.pdf")
                .build());

        assertEquals(30L, response.getId());
        assertEquals("TEXT", response.getMessageType());
        assertEquals("Ping", response.getContent());

        ArgumentCaptor<Message> messageCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(messageCaptor.capture());
        assertEquals(5L, messageCaptor.getValue().getSenderId());
        assertEquals("DOCTOR", messageCaptor.getValue().getSenderType());
        assertEquals("doctor-note.pdf", messageCaptor.getValue().getAttachmentUrl());
        verify(conversationRepository).save(conversation);
    }

    @Test
    @DisplayName("sendMessage - sends by receiver id using existing conversation and custom type")
    void sendMessage_existingReceiverConversation() {
        authenticateDoctor(5L);
        Patient patient = patient(1L, 101L, 5L);
        Conversation conversation = conversation(10L, patient, 5L);
        Message saved = message(31L, conversation, 5L, "DOCTOR", "Image", "IMAGE");

        when(conversationRepository.findByPatientIdAndDoctorId(1L, 5L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        MessageResponse response = service.sendMessage(SendMessageRequest.builder()
                .receiverId(1L)
                .content("Image")
                .messageType("IMAGE")
                .build());

        assertEquals("IMAGE", response.getMessageType());
        verify(patientRepository, never()).findById(any());
        verify(conversationRepository).save(conversation);
    }

    @Test
    @DisplayName("sendMessage - creates conversation on demand when receiver has no conversation")
    void sendMessage_createsConversationForReceiver() {
        authenticateDoctor(5L);
        Patient patient = patient(1L, 101L, 5L);
        Conversation savedConversation = conversation(11L, patient, 5L);
        Message savedMessage = message(32L, savedConversation, 5L, "DOCTOR", "Hello", "TEXT");

        when(conversationRepository.findByPatientIdAndDoctorId(1L, 5L)).thenReturn(Optional.empty());
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(conversationRepository.save(any(Conversation.class))).thenReturn(savedConversation);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        MessageResponse response = service.sendMessage(SendMessageRequest.builder()
                .receiverId(1L)
                .content("Hello")
                .build());

        assertEquals(32L, response.getId());
        ArgumentCaptor<Conversation> conversationCaptor = ArgumentCaptor.forClass(Conversation.class);
        verify(conversationRepository, times(2)).save(conversationCaptor.capture());
        Conversation created = conversationCaptor.getAllValues().get(0);
        assertEquals(patient, created.getPatient());
        assertEquals(5L, created.getDoctorId());
        assertTrue(created.isActive());
    }

    @Test
    @DisplayName("sendMessage - rejects missing, unauthorized or incomplete target")
    void sendMessage_errorPaths() {
        authenticateDoctor(5L);
        Patient patient = patient(1L, 101L, 5L);

        when(conversationRepository.findById(404L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.sendMessage(SendMessageRequest.builder()
                .conversationId(404L)
                .content("Ping")
                .build()));

        when(conversationRepository.findById(12L)).thenReturn(Optional.of(conversation(12L, patient, 6L)));
        assertThrows(RuntimeException.class, () -> service.sendMessage(SendMessageRequest.builder()
                .conversationId(12L)
                .content("Ping")
                .build()));

        assertThrows(IllegalArgumentException.class, () -> service.sendMessage(SendMessageRequest.builder()
                .content("Ping")
                .build()));

        when(conversationRepository.findByPatientIdAndDoctorId(99L, 5L)).thenReturn(Optional.empty());
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.sendMessage(SendMessageRequest.builder()
                .receiverId(99L)
                .content("Ping")
                .build()));

        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    @DisplayName("markAsRead - delegates unread update with current doctor id")
    void markAsRead_success() {
        authenticateDoctor(5L);

        service.markAsRead(10L);

        verify(messageRepository).markAllAsRead(10L, 5L);
    }

    private static void authenticateDoctor(Long userId) {
        CustomUserDetails principal = CustomUserDetails.builder()
                .id(userId)
                .email("doctor@example.com")
                .role("DOCTOR")
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private static Patient patient(Long id, Long userId, Long doctorId) {
        return Patient.builder()
                .id(id)
                .userId(userId)
                .doctorId(doctorId)
                .clinicId(2L)
                .fullName("Patient " + id)
                .phone("090000000" + id)
                .gender("M")
                .avatarUrl("patient.png")
                .build();
    }

    private static Conversation conversation(Long id, Patient patient, Long doctorId) {
        return Conversation.builder()
                .id(id)
                .patient(patient)
                .doctorId(doctorId)
                .lastMessageAt(LocalDateTime.of(2026, 7, 3, 9, 0))
                .isActive(true)
                .build();
    }

    private static Message message(Long id, Conversation conversation, Long senderId, String senderType, String content, String type) {
        return Message.builder()
                .id(id)
                .conversation(conversation)
                .senderId(senderId)
                .senderType(senderType)
                .content(content)
                .messageType(type)
                .attachmentUrl("file.png")
                .sentAt(LocalDateTime.of(2026, 7, 3, 9, 30))
                .build();
    }
}
