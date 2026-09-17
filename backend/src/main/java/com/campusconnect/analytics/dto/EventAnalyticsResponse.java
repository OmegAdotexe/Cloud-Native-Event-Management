package com.campusconnect.analytics.dto;

import com.campusconnect.event.model.EventStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class EventAnalyticsResponse {
    private Long eventId;
    private String title;
    private EventStatus status;
    private LocalDateTime startTime;
    private LocalDateTime registrationDeadline;
    
    private int capacity;
    private long confirmedRegistrations;
    private long availableSeats;
    private double capacityUtilization; // percentage
    
    private long waitlistCount;
    private long pendingCount;
    private long cancelledCount;
    private long rejectedCount;

    private List<RegistrationTrendDto> registrationTrend;
}
