package com.campusconnect.event.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateInvitesRequest {
    @NotEmpty(message = "Participant IDs list cannot be empty")
    private List<Long> participantIds;
}
