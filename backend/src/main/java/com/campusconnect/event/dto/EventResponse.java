package com.campusconnect.event.dto;

import com.campusconnect.event.model.EventCategory;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.RegistrationMode;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Phase 4: Authoritative PostgreSQL Registration Metrics
    @Builder.Default
    private Long confirmedRegistrations = 0L;
    @Builder.Default
    private Long pendingRegistrations = 0L;
    @Builder.Default
    private Long rejectedRegistrations = 0L;
    @Builder.Default
    private Long cancelledRegistrations = 0L;
    private Integer availableCapacity;
    private Integer totalCapacity;

    public boolean getIsVirtual() {
        return isVirtual;
    }
}
