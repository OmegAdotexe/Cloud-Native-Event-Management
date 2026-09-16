package com.campusconnect.event.dto;

import com.campusconnect.event.model.EventCategory;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.RegistrationMode;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEventRequest {
    private String title;
    private String description;
    private String venueName;
    private Boolean isVirtual;
    private String virtualLink;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime registrationDeadline;
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
    private EventStatus status;
    private RegistrationMode registrationMode;
    private EventCategory category;
    private Boolean waitlistEnabled;
}
