package com.campusconnect.notification.dto;

import com.campusconnect.notification.model.NotificationChannel;
import com.campusconnect.notification.model.NotificationStatus;
import com.campusconnect.notification.model.NotificationType;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class NotificationResponse {
    Long id;
    Long eventId;
    NotificationType type;
    String title;
    String message;
    NotificationChannel channel;
    NotificationStatus status;
    LocalDateTime createdAt;
    LocalDateTime readAt;
    boolean isRead;
}
