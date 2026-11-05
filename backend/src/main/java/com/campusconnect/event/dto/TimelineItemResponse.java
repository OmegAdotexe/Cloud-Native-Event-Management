package com.campusconnect.event.dto;

import com.campusconnect.event.model.TimelineItemType;

import java.time.LocalDateTime;

public class TimelineItemResponse {
    private Long id;
    private Long eventId;
    private String title;
    private String description;
    private TimelineItemType type;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String createdByAdminName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TimelineItemResponse() {}

    public TimelineItemResponse(Long id, Long eventId, String title, String description, TimelineItemType type,
                                LocalDateTime startTime, LocalDateTime endTime, String createdByAdminName,
                                LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.eventId = eventId;
        this.title = title;
        this.description = description;
        this.type = type;
        this.startTime = startTime;
        this.endTime = endTime;
        this.createdByAdminName = createdByAdminName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static TimelineItemResponseBuilder builder() {
        return new TimelineItemResponseBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TimelineItemType getType() { return type; }
    public void setType(TimelineItemType type) { this.type = type; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getCreatedByAdminName() { return createdByAdminName; }
    public void setCreatedByAdminName(String createdByAdminName) { this.createdByAdminName = createdByAdminName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class TimelineItemResponseBuilder {
        private Long id;
        private Long eventId;
        private String title;
        private String description;
        private TimelineItemType type;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String createdByAdminName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        TimelineItemResponseBuilder() {}

        public TimelineItemResponseBuilder id(Long id) { this.id = id; return this; }
        public TimelineItemResponseBuilder eventId(Long eventId) { this.eventId = eventId; return this; }
        public TimelineItemResponseBuilder title(String title) { this.title = title; return this; }
        public TimelineItemResponseBuilder description(String description) { this.description = description; return this; }
        public TimelineItemResponseBuilder type(TimelineItemType type) { this.type = type; return this; }
        public TimelineItemResponseBuilder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public TimelineItemResponseBuilder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public TimelineItemResponseBuilder createdByAdminName(String createdByAdminName) { this.createdByAdminName = createdByAdminName; return this; }
        public TimelineItemResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public TimelineItemResponseBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public TimelineItemResponse build() {
            return new TimelineItemResponse(id, eventId, title, description, type, startTime, endTime,
                    createdByAdminName, createdAt, updatedAt);
        }
    }
}
