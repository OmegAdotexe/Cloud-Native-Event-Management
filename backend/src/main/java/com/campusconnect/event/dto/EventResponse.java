package com.campusconnect.event.dto;

import com.campusconnect.event.model.EventCategory;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.RegistrationMode;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class EventResponse {
    Long id;
    String title;
    String description;
    String venueName;
    boolean isVirtual;
    String virtualLink;
    LocalDateTime startTime;
    LocalDateTime endTime;
    LocalDateTime registrationDeadline;
    Integer capacity;
    EventStatus status;
    RegistrationMode registrationMode;
    EventCategory category;
    boolean waitlistEnabled;
    String cancelledReason;
    LocalDateTime cancelledAt;
    String createdByName;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
