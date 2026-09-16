package com.campusconnect.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelEventRequest {
    @NotBlank(message = "Cancellation reason is required")
    @Size(min = 1, max = 500, message = "Reason must be between 1 and 500 characters")
    private String reason;
}
