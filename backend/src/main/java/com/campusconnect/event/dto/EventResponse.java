package com.campusconnect.event.dto;

import com.campusconnect.event.model.EventStatus;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class EventResponse {
    Long id;
    String title;
    String description;
    String venue;
    LocalDateTime startTime;
    LocalDateTime endTime;
    Integer capacity;
    EventStatus status;
    String createdByName;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
