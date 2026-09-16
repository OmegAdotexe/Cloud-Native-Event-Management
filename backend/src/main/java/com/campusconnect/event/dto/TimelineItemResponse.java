package com.campusconnect.event.dto;

import com.campusconnect.event.model.TimelineItemType;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class TimelineItemResponse {
    Long id;
    Long eventId;
    String title;
    String description;
    TimelineItemType type;
    LocalDateTime startTime;
    LocalDateTime endTime;
    String createdByAdminName;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
