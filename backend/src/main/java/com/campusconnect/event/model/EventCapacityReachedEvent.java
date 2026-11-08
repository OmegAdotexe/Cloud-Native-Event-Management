package com.campusconnect.event.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EventCapacityReachedEvent {
    private final Long eventId;
    private final Long adminId;
    private final String eventTitle;
    private final int capacity;
}

