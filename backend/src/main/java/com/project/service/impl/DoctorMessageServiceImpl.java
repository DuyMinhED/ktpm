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
import com.project.service.DoctorMessageService;
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
public class DoctorMessageServiceImpl implements DoctorMessageService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final PatientRepository patientRepository;

    @Override
    public List<ConversationResponse> getConversations() {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();

        return conversationRepository.findByDoctorIdAndIsActiveTrueOrderByLastMessageAtDesc(doctorId).stream()
                .map(conv -> {
                    String lastMsg = messageRepository
                            .findTopByConversationIdOrderBySentAtDesc(conv.getId())
                            .map(Message::getContent)
                            .orElse("");

                    long unreadCount = messageRepository
                            .countByConversationIdAndIsReadFalseAndSenderIdNot(conv.getId(), doctorId);

                    Patient p = conv.getPatient();

                    return ConversationResponse.builder()
                            .id(conv.getId())
                            .patientId(p.getId())
                            .patientName(p.getFullName())
                            .patientAvatarUrl(p.getAvatarUrl())
                            .isOnline(true)
                            .lastMessage(lastMsg)
                            .lastMessageAt(conv.getLastMessageAt())
                            .unreadCount(unreadCount)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public Page<MessageResponse> getMessages(Long conversationId, Pageable pageable) {
        return messageRepository.findByConversationIdOrderBySentAtDesc(conversationId, pageable)
                .map(this::mapToMessageResponse);
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request) {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        Conversation conversation = null;

        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        } else if (request.getReceiverId() != null) {
            // Try existing
            conversation = conversationRepository.findByPatientIdAndDoctorId(request.getReceiverId(), doctorId)
                    .orElse(null);
            
            if (conversation == null) {
                // Create on demand
                Patient p = patientRepository.findById(request.getReceiverId())
                        .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
                conversation = Conversation.builder()
                        .patient(p)
                        .doctorId(doctorId)
                        .lastMessageAt(LocalDateTime.now())
                        .isActive(true)
                        .build();
                conversation = conversationRepository.save(conversation);
            }
        } else {
            throw new IllegalArgumentException("Either Conversation ID or Receiver ID is required");
        }

        if (!conversation.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Unauthorized to send message in this conversation");
        }

        Message message = Message.builder()
                .conversation(conversation)
                .senderId(doctorId)
                .senderType("DOCTOR")
                .content(request.getContent())
                .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
                .attachmentUrl(request.getAttachmentUrl())
                .sentAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return mapToMessageResponse(saved);
    }

    @Override
    @Transactional
    public void markAsRead(Long conversationId) {
        Long doctorId = SecurityUtils.getCurrentUserId().orElseThrow();
        messageRepository.markAllAsRead(conversationId, doctorId);
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
