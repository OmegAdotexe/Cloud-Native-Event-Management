package com.campusconnect.notification.dto;

import com.campusconnect.notification.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private String messageId;
    private Long recipientId;
    private Long eventId;
    private NotificationType type;
    private String title;
    private String message;
}
