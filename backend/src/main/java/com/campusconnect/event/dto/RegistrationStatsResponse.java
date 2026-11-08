package com.campusconnect.event.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationStatsResponse {
    private Long eventId;
    private String eventTitle;
    private int capacity;
    private int confirmed;
    private int pending;
    private int rejected;
    private int cancelled;
    private int waitlisted;
    private int total;
    private int remainingCapacity;
}

