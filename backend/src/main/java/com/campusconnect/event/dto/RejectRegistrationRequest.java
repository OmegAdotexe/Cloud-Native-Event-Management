package com.campusconnect.event.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectRegistrationRequest {
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;
}
