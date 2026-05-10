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
import com.project.service.PatientMessageService;
import com.project.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Slf4j
@Service
@RequiredArgsConstructor
public class PatientMessageServiceImpl implements PatientMessageService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final PatientRepository patientRepository;
    private final com.project.repository.UserRepository userRepository;
    private final com.project.repository.ClinicRepository clinicRepository;

    @Override
    public List<ConversationResponse> getConversations() {
        Patient patient = getCurrentPatient();
        Long userId = SecurityUtils.getCurrentUserId().orElseThrow();

        List<ConversationResponse> conversations = conversationRepository
                .findByPatientIdAndIsActiveTrueOrderByLastMessageAtDesc(patient.getId())
                .stream()
                .map(conv -> {
                    // Get last message
                    String lastMsg = messageRepository
                            .findTopByConversationIdOrderBySentAtDesc(conv.getId())
                            .map(Message::getContent)
                            .orElse("");

                    long unreadCount = messageRepository
                            .countByConversationIdAndIsReadFalseAndSenderIdNot(conv.getId(), userId);

                    // Fetch Doctor Details
                    com.project.entity.User doctor = userRepository.findById(conv.getDoctorId()).orElse(null);

                    // Resolve clinic name
                    String clinicName = null;
                    if (doctor != null && doctor.getClinicId() != null) {
                        clinicName = clinicRepository.findById(doctor.getClinicId())
                                .map(c -> c.getName())
                                .orElse(null);
                    }

                    return ConversationResponse.builder()
                            .id(conv.getId())
                            .doctorId(conv.getDoctorId())
                            .doctorName(doctor != null ? doctor.getFullName() : "Bác sĩ")
                            .doctorSpecialty(doctor != null && doctor.getSpecialization() != null ? doctor.getSpecialization() : "Bác sĩ đa khoa")
                            .doctorAvatarUrl(doctor != null ? doctor.getAvatarUrl() : null)
                            .doctorExperience(doctor != null ? doctor.getExperience() : null)
                            .doctorBio(doctor != null ? doctor.getBio() : null)
                            .doctorClinicName(clinicName)
                            .isOnline(true) // Default to online for now
                            .lastMessage(lastMsg)
                            .lastMessageAt(conv.getLastMessageAt())
                            .unreadCount(unreadCount)
                            .build();
                })
                .collect(Collectors.toList());
                
        // Auto-create a conversation if none exist and the patient has an assigned doctor
        if (conversations.isEmpty() && patient.getDoctorId() != null) {
            Conversation newConv = Conversation.builder()
                    .patient(patient)
                    .doctorId(patient.getDoctorId())
                    .lastMessageAt(LocalDateTime.now())
                    .isActive(true)
                    .build();
            Conversation savedConv = conversationRepository.save(newConv);
            
            com.project.entity.User doctor = userRepository.findById(patient.getDoctorId()).orElse(null);

            String clinicName = null;
            if (doctor != null && doctor.getClinicId() != null) {
                clinicName = clinicRepository.findById(doctor.getClinicId())
                        .map(c -> c.getName())
                        .orElse(null);
            }
            
            conversations.add(ConversationResponse.builder()
                    .id(savedConv.getId())
                    .doctorId(savedConv.getDoctorId())
                    .doctorName(doctor != null ? doctor.getFullName() : "Bác sĩ")
                    .doctorSpecialty(doctor != null && doctor.getSpecialization() != null ? doctor.getSpecialization() : "Bác sĩ đa khoa")
                    .doctorAvatarUrl(doctor != null ? doctor.getAvatarUrl() : null)
                    .doctorExperience(doctor != null ? doctor.getExperience() : null)
                    .doctorBio(doctor != null ? doctor.getBio() : null)
                    .doctorClinicName(clinicName)
                    .isOnline(true)
                    .lastMessage("")
                    .lastMessageAt(savedConv.getLastMessageAt())
                    .unreadCount(0)
                    .build());
        }

        return conversations;
    }

    @Override
    public Page<MessageResponse> getMessages(Long conversationId, Pageable pageable) {
        return messageRepository.findByConversationIdOrderBySentAtDesc(conversationId, pageable)
                .map(this::mapToMessageResponse);
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request) {
        Long userId = SecurityUtils.getCurrentUserId().orElseThrow();

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Conversation not found: " + request.getConversationId()));

        Message message = Message.builder()
                .conversation(conversation)
                .senderId(userId)
                .senderType("PATIENT")
                .content(request.getContent())
                .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
                .attachmentUrl(request.getAttachmentUrl())
                .sentAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(message);

        // Update conversation last message time
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        log.info("Message sent in conversation: convId={}", request.getConversationId());
        return mapToMessageResponse(saved);
    }

    @Override
    @Transactional
    public void markAsRead(Long conversationId) {
        Long userId = SecurityUtils.getCurrentUserId().orElseThrow();
        messageRepository.markAllAsRead(conversationId, userId);
        log.info("Messages marked as read: conversationId={}", conversationId);
    }

    // === Private Helpers ===

    private Patient getCurrentPatient() {
        Long userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new ResourceNotFoundException("User not authenticated"));
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    private MessageResponse mapToMessageResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .senderId(m.getSenderId())
                .senderType(m.getSenderType())
                .content(m.getContent())
                .messageType(m.getMessageType())
                .attachmentUrl(m.getAttachmentUrl())
                .isRead(m.isRead())
                .sentAt(m.getSentAt())
                .build();
    }
}
