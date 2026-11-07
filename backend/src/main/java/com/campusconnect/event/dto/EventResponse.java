package com.campusconnect.event.dto;

import com.campusconnect.event.model.EventCategory;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.RegistrationMode;

import java.time.LocalDateTime;

public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private String venueName;
    private boolean isVirtual;
    private String virtualLink;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime registrationDeadline;
    private Integer capacity;
    private EventStatus status;
    private RegistrationMode registrationMode;
    private EventCategory category;
    private boolean waitlistEnabled;
    private boolean institutionalOnly;
    private String coverImageUrl;
    private String cancelledReason;
    private LocalDateTime cancelledAt;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EventResponse() {}

    public EventResponse(Long id, String title, String description, String venueName, boolean isVirtual,
                         String virtualLink, LocalDateTime startTime, LocalDateTime endTime,
                         LocalDateTime registrationDeadline, Integer capacity, EventStatus status,
                         RegistrationMode registrationMode, EventCategory category, boolean waitlistEnabled,
                         boolean institutionalOnly, String coverImageUrl, String cancelledReason, LocalDateTime cancelledAt,
                         String createdByName, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.venueName = venueName;
        this.isVirtual = isVirtual;
        this.virtualLink = virtualLink;
        this.startTime = startTime;
        this.endTime = endTime;
        this.registrationDeadline = registrationDeadline;
        this.capacity = capacity;
        this.status = status;
        this.registrationMode = registrationMode;
        this.category = category;
        this.waitlistEnabled = waitlistEnabled;
        this.institutionalOnly = institutionalOnly;
        this.coverImageUrl = coverImageUrl;
        this.cancelledReason = cancelledReason;
        this.cancelledAt = cancelledAt;
        this.createdByName = createdByName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static EventResponseBuilder builder() {
        return new EventResponseBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVenueName() { return venueName; }
    public void setVenueName(String venueName) { this.venueName = venueName; }

    public boolean isVirtual() { return isVirtual; }
    public boolean getIsVirtual() { return isVirtual; }
    public void setVirtual(boolean isVirtual) { this.isVirtual = isVirtual; }

    public String getVirtualLink() { return virtualLink; }
    public void setVirtualLink(String virtualLink) { this.virtualLink = virtualLink; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public LocalDateTime getRegistrationDeadline() { return registrationDeadline; }
    public void setRegistrationDeadline(LocalDateTime registrationDeadline) { this.registrationDeadline = registrationDeadline; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus status) { this.status = status; }

    public RegistrationMode getRegistrationMode() { return registrationMode; }
    public void setRegistrationMode(RegistrationMode registrationMode) { this.registrationMode = registrationMode; }

    public EventCategory getCategory() { return category; }
    public void setCategory(EventCategory category) { this.category = category; }

    public boolean isWaitlistEnabled() { return waitlistEnabled; }
    public boolean getWaitlistEnabled() { return waitlistEnabled; }
    public void setWaitlistEnabled(boolean waitlistEnabled) { this.waitlistEnabled = waitlistEnabled; }

    public boolean isInstitutionalOnly() { return institutionalOnly; }
    public boolean getInstitutionalOnly() { return institutionalOnly; }
    public void setInstitutionalOnly(boolean institutionalOnly) { this.institutionalOnly = institutionalOnly; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public String getCancelledReason() { return cancelledReason; }
    public void setCancelledReason(String cancelledReason) { this.cancelledReason = cancelledReason; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class EventResponseBuilder {
        private Long id;
        private String title;
        private String description;
        private String venueName;
        private boolean isVirtual;
        private String virtualLink;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private LocalDateTime registrationDeadline;
        private Integer capacity;
        private EventStatus status;
        private RegistrationMode registrationMode;
        private EventCategory category;
        private boolean waitlistEnabled;
        private boolean institutionalOnly;
        private String coverImageUrl;
        private String cancelledReason;
        private LocalDateTime cancelledAt;
        private String createdByName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        EventResponseBuilder() {}

        public EventResponseBuilder id(Long id) { this.id = id; return this; }
        public EventResponseBuilder title(String title) { this.title = title; return this; }
        public EventResponseBuilder description(String description) { this.description = description; return this; }
        public EventResponseBuilder venueName(String venueName) { this.venueName = venueName; return this; }
        public EventResponseBuilder isVirtual(boolean isVirtual) { this.isVirtual = isVirtual; return this; }
        public EventResponseBuilder virtualLink(String virtualLink) { this.virtualLink = virtualLink; return this; }
        public EventResponseBuilder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public EventResponseBuilder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public EventResponseBuilder registrationDeadline(LocalDateTime registrationDeadline) { this.registrationDeadline = registrationDeadline; return this; }
        public EventResponseBuilder capacity(Integer capacity) { this.capacity = capacity; return this; }
        public EventResponseBuilder status(EventStatus status) { this.status = status; return this; }
        public EventResponseBuilder registrationMode(RegistrationMode registrationMode) { this.registrationMode = registrationMode; return this; }
        public EventResponseBuilder category(EventCategory category) { this.category = category; return this; }
        public EventResponseBuilder waitlistEnabled(boolean waitlistEnabled) { this.waitlistEnabled = waitlistEnabled; return this; }
        public EventResponseBuilder institutionalOnly(boolean institutionalOnly) { this.institutionalOnly = institutionalOnly; return this; }
        public EventResponseBuilder coverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; return this; }
        public EventResponseBuilder cancelledReason(String cancelledReason) { this.cancelledReason = cancelledReason; return this; }
        public EventResponseBuilder cancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; return this; }
        public EventResponseBuilder createdByName(String createdByName) { this.createdByName = createdByName; return this; }
        public EventResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public EventResponseBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public EventResponse build() {
            return new EventResponse(id, title, description, venueName, isVirtual, virtualLink, startTime, endTime,
                    registrationDeadline, capacity, status, registrationMode, category, waitlistEnabled, institutionalOnly,
                    coverImageUrl, cancelledReason, cancelledAt, createdByName, createdAt, updatedAt);
        }
    }
}
