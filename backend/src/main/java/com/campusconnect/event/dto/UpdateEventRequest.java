package com.campusconnect.event.dto;

import com.campusconnect.event.model.EventStatus;
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
    private String venue;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
    private EventStatus status;
}
