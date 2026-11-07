package com.campusconnect.notification.service;

import com.campusconnect.notification.dto.NotificationResponse;
import com.campusconnect.notification.model.Notification;
import com.campusconnect.notification.model.NotificationType;
import com.campusconnect.notification.repository.NotificationRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {
    private final NotificationRepository notificationRepository;

    private static final List<NotificationType> PARTICIPANT_ROUTINE_TYPES = List.of(
            NotificationType.REGISTRATION_CONFIRMED,
            NotificationType.REGISTRATION_WAITLISTED,
            NotificationType.REGISTRATION_REJECTED,
            NotificationType.REGISTRATION_CANCELLED
    );

    public Page<NotificationResponse> getNotifications(User user, Pageable pageable) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            return notificationRepository.findByRecipientAndTypeNotInOrderByCreatedAtDesc(user, PARTICIPANT_ROUTINE_TYPES, pageable)
                    .map(this::toResponse);
        }
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user, pageable)
                .map(this::toResponse);
    }

    public long getUnreadCount(User user) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            return notificationRepository.countUnreadByRecipientAndTypeNotIn(user, PARTICIPANT_ROUTINE_TYPES);
        }
        return notificationRepository.countUnreadByRecipient(user);
    }

    @Transactional
    public void markAsRead(Long id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
                
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
        
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
            notification.setStatus(com.campusconnect.notification.model.NotificationStatus.READ);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForRecipient(user);
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .eventId(notification.getEventId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .channel(notification.getChannel())
                .status(notification.getStatus())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .isRead(notification.getReadAt() != null)
                .build();
    }
}
