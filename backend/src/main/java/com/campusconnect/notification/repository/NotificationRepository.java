package com.campusconnect.notification.repository;

import com.campusconnect.notification.model.Notification;
import com.campusconnect.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient = :recipient AND n.readAt IS NULL")
    long countUnreadByRecipient(@Param("recipient") User recipient);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = CURRENT_TIMESTAMP, n.status = 'READ' WHERE n.recipient = :recipient AND n.readAt IS NULL")
    void markAllAsReadForRecipient(@Param("recipient") User recipient);
    
    boolean existsByMessageId(String messageId);
}
