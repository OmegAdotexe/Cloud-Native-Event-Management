package com.campusconnect.user.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminApplicationStatsResponse {
    private long total;
    private long pending;
    private long approved;
    private long rejected;
    private long suspended;
    private long revoked;
}
