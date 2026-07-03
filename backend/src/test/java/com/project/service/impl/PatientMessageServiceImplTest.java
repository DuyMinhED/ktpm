package com.project.service.impl;

import com.project.dto.request.SendMessageRequest;
import com.project.dto.response.ConversationResponse;
import com.project.dto.response.MessageResponse;
import com.project.entity.Clinic;
import com.project.entity.Conversation;
import com.project.entity.Message;
import com.project.entity.Patient;
import com.project.entity.User;
import com.project.exception.ResourceNotFoundException;
import com.project.repository.ClinicRepository;
import com.project.repository.ConversationRepository;
import com.project.repository.MessageRepository;
import com.project.repository.PatientRepository;
import com.project.repository.UserRepository;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientMessageServiceImplTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClinicRepository clinicRepository;

    @InjectMocks
    private PatientMessageServiceImpl service;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("getConversations - maps existing conversation with doctor, clinic, last message and unread count")
    void getConversations_existingConversation() {
        authenticate(101L);
        Patient patient = patient(1L, 101L, 5L);
        Conversation conversation = conversation(10L, patient, 5L);
        User doctor = doctor(5L, 2L);

        when(patientRepository.findByUserId(101L)).thenReturn(Optional.of(patient));
        when(conversationRepository.findByPatientIdAndIsActiveTrueOrderByLastMessageAtDesc(1L))
                .thenReturn(List.of(conversation));
        when(messageRepository.findTopByConversationIdOrderBySentAtDesc(10L))
                .thenReturn(Optional.of(message(20L, conversation, 5L, "DOCTOR", "Last note", "TEXT")));
        when(messageRepository.countByConversationIdAndIsReadFalseAndSenderIdNot(10L, 101L)).thenReturn(3L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(clinicRepository.findById(2L)).thenReturn(Optional.of(Clinic.builder().id(2L).name("Clinic A").build()));

        List<ConversationResponse> responses = service.getConversations();

        assertEquals(1, responses.size());
        assertEquals(10L, responses.get(0).getId());
        assertEquals(5L, responses.get(0).getDoctorId());
        assertEquals("Dr. Who", responses.get(0).getDoctorName());
        assertEquals("Cardiology", responses.get(0).getDoctorSpecialty());
        assertEquals("Clinic A", responses.get(0).getDoctorClinicName());
        assertEquals("Last note", responses.get(0).getLastMessage());
        assertEquals(3L, responses.get(0).getUnreadCount());
        assertTrue(responses.get(0).isOnline());
    }

    @Test
    @DisplayName("getConversations - auto creates conversation when none exists and patient has assigned doctor")
    void getConversations_autoCreatesAssignedDoctorConversation() {
        authenticate(101L);
        Patient patient = patient(1L, 101L, 5L);
        User doctor = doctor(5L, null);
        Conversation saved = conversation(11L, patient, 5L);

        when(patientRepository.findByUserId(101L)).thenReturn(Optional.of(patient));
        when(conversationRepository.findByPatientIdAndIsActiveTrueOrderByLastMessageAtDesc(1L)).thenReturn(List.of());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(saved);
        when(userRepository.findById(5L)).thenReturn(Optional.of(doctor));

        List<ConversationResponse> responses = service.getConversations();

        assertEquals(1, responses.size());
        assertEquals(11L, responses.get(0).getId());
        assertEquals(5L, responses.get(0).getDoctorId());
        assertEquals("", responses.get(0).getLastMessage());
        assertEquals(0L, responses.get(0).getUnreadCount());
        verify(conversationRepository).save(any(Conversation.class));
    }

    @Test
    @DisplayName("getConversations - unauthenticated user is rejected")
    void getConversations_unauthenticated() {
        assertThrows(ResourceNotFoundException.class, () -> service.getConversations());
    }

    @Test
    @DisplayName("getMessages - maps message page")
    void getMessages_mapsPage() {
        Conversation conversation = conversation(10L, patient(1L, 101L, 5L), 5L);
        Message message = message(21L, conversation, 101L, "PATIENT", "Hello", "IMAGE");
        when(messageRepository.findByConversationIdOrderBySentAtDesc(eq(10L), any()))
                .thenReturn(new PageImpl<>(List.of(message)));

        Page<MessageResponse> page = service.getMessages(10L, PageRequest.of(0, 5));

        assertEquals(1, page.getTotalElements());
        assertEquals(21L, page.getContent().get(0).getId());
        assertEquals("PATIENT", page.getContent().get(0).getSenderType());
        assertEquals("IMAGE", page.getContent().get(0).getMessageType());
    }

    @Test
    @DisplayName("sendMessage - persists patient message with default text type and updates conversation")
    void sendMessage_successDefaultType() {
        authenticate(101L);
        Patient patient = patient(1L, 101L, 5L);
        Conversation conversation = conversation(10L, patient, 5L);
        Message saved = message(30L, conversation, 101L, "PATIENT", "Ping", "TEXT");

        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        MessageResponse response = service.sendMessage(SendMessageRequest.builder()
                .conversationId(10L)
                .content("Ping")
                .messageType(null)
                .attachmentUrl("file.png")
                .build());

        assertEquals(30L, response.getId());
        assertEquals("TEXT", response.getMessageType());
        assertEquals("Ping", response.getContent());
        ArgumentCaptor<Message> messageCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(messageCaptor.capture());
        assertEquals(101L, messageCaptor.getValue().getSenderId());
        assertEquals("PATIENT", messageCaptor.getValue().getSenderType());
        assertEquals("file.png", messageCaptor.getValue().getAttachmentUrl());
        verify(conversationRepository).save(conversation);
    }

    @Test
    @DisplayName("sendMessage - missing conversation throws ResourceNotFoundException")
    void sendMessage_missingConversation() {
        authenticate(101L);
        when(conversationRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.sendMessage(SendMessageRequest.builder()
                .conversationId(404L)
                .content("Ping")
                .build()));
    }

    @Test
    @DisplayName("markAsRead - delegates unread update with current patient user id")
    void markAsRead_success() {
        authenticate(101L);

        service.markAsRead(10L);

        verify(messageRepository).markAllAsRead(10L, 101L);
    }

    private static void authenticate(Long userId) {
        CustomUserDetails principal = CustomUserDetails.builder()
                .id(userId)
                .email("patient@example.com")
                .role("PATIENT")
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

    private static User doctor(Long id, Long clinicId) {
        return User.builder()
                .id(id)
                .clinicId(clinicId)
                .fullName("Dr. Who")
                .specialization("Cardiology")
                .avatarUrl("doctor.png")
                .experience("10 years")
                .bio("Bio")
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
