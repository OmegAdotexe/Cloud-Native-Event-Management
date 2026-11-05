package com.campusconnect.notification.dto;

import com.campusconnect.notification.model.NotificationChannel;
import com.campusconnect.notification.model.NotificationStatus;
import com.campusconnect.notification.model.NotificationType;

import java.time.LocalDateTime;

public class NotificationResponse {
    private Long id;
    private Long eventId;
    private NotificationType type;
    private String title;
    private String message;
    private NotificationChannel channel;
    private NotificationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private boolean isRead;

    public NotificationResponse() {}

    public NotificationResponse(Long id, Long eventId, NotificationType type, String title, String message,
                                NotificationChannel channel, NotificationStatus status, LocalDateTime createdAt,
                                LocalDateTime readAt, boolean isRead) {
        this.id = id;
        this.eventId = eventId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.channel = channel;
        this.status = status;
        this.createdAt = createdAt;
        this.readAt = readAt;
        this.isRead = isRead;
    }

    public static NotificationResponseBuilder builder() {
        return new NotificationResponseBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NotificationChannel getChannel() { return channel; }
    public void setChannel(NotificationChannel channel) { this.channel = channel; }

    public NotificationStatus getStatus() { return status; }
    public void setStatus(NotificationStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }

    public boolean isRead() { return isRead; }
    public boolean getIsRead() { return isRead; }
    public void setRead(boolean isRead) { this.isRead = isRead; }

    public static class NotificationResponseBuilder {
        private Long id;
        private Long eventId;
        private NotificationType type;
        private String title;
        private String message;
        private NotificationChannel channel;
        private NotificationStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime readAt;
        private boolean isRead;

        NotificationResponseBuilder() {}

        public NotificationResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public NotificationResponseBuilder eventId(Long eventId) {
            this.eventId = eventId;
            return this;
        }

        public NotificationResponseBuilder type(NotificationType type) {
            this.type = type;
            return this;
        }

        public NotificationResponseBuilder title(String title) {
            this.title = title;
            return this;
        }

        public NotificationResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public NotificationResponseBuilder channel(NotificationChannel channel) {
            this.channel = channel;
            return this;
        }

        public NotificationResponseBuilder status(NotificationStatus status) {
            this.status = status;
            return this;
        }

        public NotificationResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public NotificationResponseBuilder readAt(LocalDateTime readAt) {
            this.readAt = readAt;
            return this;
        }

        public NotificationResponseBuilder isRead(boolean isRead) {
            this.isRead = isRead;
            return this;
        }

        public NotificationResponse build() {
            return new NotificationResponse(id, eventId, type, title, message, channel, status, createdAt, readAt, isRead);
        }
    }
}
