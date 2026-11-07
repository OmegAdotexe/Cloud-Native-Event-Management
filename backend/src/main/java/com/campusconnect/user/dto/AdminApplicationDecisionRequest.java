package com.campusconnect.user.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminApplicationDecisionRequest {
    private String reason;
}
