package com.project.repository;

import com.project.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversationIdOrderBySentAtDesc(Long conversationId, Pageable pageable);

    Optional<Message> findTopByConversationIdOrderBySentAtDesc(Long conversationId);

    Optional<Message> findTopByConversationIdAndContentStartingWithOrderBySentAtDesc(Long conversationId, String prefix);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation.id = :conversationId AND m.senderId <> :readerId")
    void markAllAsRead(@Param("conversationId") Long conversationId, @Param("readerId") Long readerId);

    long countByConversationIdAndIsReadFalseAndSenderIdNot(Long conversationId, Long readerId);
    
    long countByConversationDoctorIdAndIsReadFalseAndSenderIdNot(Long doctorId, Long readerId);
}
