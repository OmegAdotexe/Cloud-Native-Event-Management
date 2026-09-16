package com.campusconnect.event.dto;

import com.campusconnect.event.model.EventCategory;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.RegistrationMode;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {
    @NotBlank(message = "Title is required")
    private String title;
    private String description;
    @NotBlank(message = "Venue name is required")
    private String venueName;
    @Builder.Default
    private boolean isVirtual = false;
    private String virtualLink;
    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private LocalDateTime startTime;
    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    private LocalDateTime endTime;
    @NotNull(message = "Registration deadline is required")
    @Future(message = "Registration deadline must be in the future")
    private LocalDateTime registrationDeadline;
    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;
    @Builder.Default
    private RegistrationMode registrationMode = RegistrationMode.OPEN;
    @Builder.Default
    private EventCategory category = EventCategory.OTHER;
    @Builder.Default
    private boolean waitlistEnabled = false;
}
