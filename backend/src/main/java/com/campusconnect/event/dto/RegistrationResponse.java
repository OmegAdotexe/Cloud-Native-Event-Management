package com.campusconnect.event.dto;

import com.campusconnect.event.model.RegistrationStatus;

import java.time.LocalDateTime;

public class RegistrationResponse {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private LocalDateTime eventStartTime;
    private String eventStatus;
    private String eventVenueName;
    private Boolean eventIsVirtual;
    private String eventVirtualLink;
    private String eventRegistrationMode;
    private Long participantId;
    private String participantName;
    private RegistrationStatus status;
    private LocalDateTime registeredAt;
    private LocalDateTime respondedAt;
    private Long respondedByAdminId;
    private LocalDateTime cancelledAt;
    private String reason;

    public RegistrationResponse() {}

    public RegistrationResponse(Long id, Long eventId, String eventTitle, LocalDateTime eventStartTime,
                                String eventStatus, String eventVenueName, Boolean eventIsVirtual,
                                String eventVirtualLink, String eventRegistrationMode, Long participantId,
                                String participantName, RegistrationStatus status, LocalDateTime registeredAt,
                                LocalDateTime respondedAt, Long respondedByAdminId, LocalDateTime cancelledAt,
                                String reason) {
        this.id = id;
        this.eventId = eventId;
        this.eventTitle = eventTitle;
        this.eventStartTime = eventStartTime;
        this.eventStatus = eventStatus;
        this.eventVenueName = eventVenueName;
        this.eventIsVirtual = eventIsVirtual;
        this.eventVirtualLink = eventVirtualLink;
        this.eventRegistrationMode = eventRegistrationMode;
        this.participantId = participantId;
        this.participantName = participantName;
        this.status = status;
        this.registeredAt = registeredAt;
        this.respondedAt = respondedAt;
        this.respondedByAdminId = respondedByAdminId;
        this.cancelledAt = cancelledAt;
        this.reason = reason;
    }

    public static RegistrationResponseBuilder builder() {
        return new RegistrationResponseBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public String getEventTitle() { return eventTitle; }
    public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }

    public LocalDateTime getEventStartTime() { return eventStartTime; }
    public void setEventStartTime(LocalDateTime eventStartTime) { this.eventStartTime = eventStartTime; }

    public String getEventStatus() { return eventStatus; }
    public void setEventStatus(String eventStatus) { this.eventStatus = eventStatus; }

    public String getEventVenueName() { return eventVenueName; }
    public void setEventVenueName(String eventVenueName) { this.eventVenueName = eventVenueName; }

    public Boolean getEventIsVirtual() { return eventIsVirtual; }
    public void setEventIsVirtual(Boolean eventIsVirtual) { this.eventIsVirtual = eventIsVirtual; }

    public String getEventVirtualLink() { return eventVirtualLink; }
    public void setEventVirtualLink(String eventVirtualLink) { this.eventVirtualLink = eventVirtualLink; }

    public String getEventRegistrationMode() { return eventRegistrationMode; }
    public void setEventRegistrationMode(String eventRegistrationMode) { this.eventRegistrationMode = eventRegistrationMode; }

    public Long getParticipantId() { return participantId; }
    public void setParticipantId(Long participantId) { this.participantId = participantId; }

    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }

    public RegistrationStatus getStatus() { return status; }
    public void setStatus(RegistrationStatus status) { this.status = status; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }

    public Long getRespondedByAdminId() { return respondedByAdminId; }
    public void setRespondedByAdminId(Long respondedByAdminId) { this.respondedByAdminId = respondedByAdminId; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public static class RegistrationResponseBuilder {
        private Long id;
        private Long eventId;
        private String eventTitle;
        private LocalDateTime eventStartTime;
        private String eventStatus;
        private String eventVenueName;
        private Boolean eventIsVirtual;
        private String eventVirtualLink;
        private String eventRegistrationMode;
        private Long participantId;
        private String participantName;
        private RegistrationStatus status;
        private LocalDateTime registeredAt;
        private LocalDateTime respondedAt;
        private Long respondedByAdminId;
        private LocalDateTime cancelledAt;
        private String reason;

        RegistrationResponseBuilder() {}

        public RegistrationResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public RegistrationResponseBuilder eventId(Long eventId) {
            this.eventId = eventId;
            return this;
        }

        public RegistrationResponseBuilder eventTitle(String eventTitle) {
            this.eventTitle = eventTitle;
            return this;
        }

        public RegistrationResponseBuilder eventStartTime(LocalDateTime eventStartTime) {
            this.eventStartTime = eventStartTime;
            return this;
        }

        public RegistrationResponseBuilder eventStatus(String eventStatus) {
            this.eventStatus = eventStatus;
            return this;
        }

        public RegistrationResponseBuilder eventVenueName(String eventVenueName) {
            this.eventVenueName = eventVenueName;
            return this;
        }

        public RegistrationResponseBuilder eventIsVirtual(Boolean eventIsVirtual) {
            this.eventIsVirtual = eventIsVirtual;
            return this;
        }

        public RegistrationResponseBuilder eventVirtualLink(String eventVirtualLink) {
            this.eventVirtualLink = eventVirtualLink;
            return this;
        }

        public RegistrationResponseBuilder eventRegistrationMode(String eventRegistrationMode) {
            this.eventRegistrationMode = eventRegistrationMode;
            return this;
        }

        public RegistrationResponseBuilder participantId(Long participantId) {
            this.participantId = participantId;
            return this;
        }

        public RegistrationResponseBuilder participantName(String participantName) {
            this.participantName = participantName;
            return this;
        }

        public RegistrationResponseBuilder status(RegistrationStatus status) {
            this.status = status;
            return this;
        }

        public RegistrationResponseBuilder registeredAt(LocalDateTime registeredAt) {
            this.registeredAt = registeredAt;
            return this;
        }

        public RegistrationResponseBuilder respondedAt(LocalDateTime respondedAt) {
            this.respondedAt = respondedAt;
            return this;
        }

        public RegistrationResponseBuilder respondedByAdminId(Long respondedByAdminId) {
            this.respondedByAdminId = respondedByAdminId;
            return this;
        }

        public RegistrationResponseBuilder cancelledAt(LocalDateTime cancelledAt) {
            this.cancelledAt = cancelledAt;
            return this;
        }

        public RegistrationResponseBuilder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public RegistrationResponse build() {
            return new RegistrationResponse(id, eventId, eventTitle, eventStartTime, eventStatus, eventVenueName,
                    eventIsVirtual, eventVirtualLink, eventRegistrationMode, participantId, participantName,
                    status, registeredAt, respondedAt, respondedByAdminId, cancelledAt, reason);
        }
    }
}
