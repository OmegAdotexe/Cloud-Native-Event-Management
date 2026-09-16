package com.campusconnect.event.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EventCancelledEvent {
    private final Long eventId;
    private final String title;
    private final String reason;
}
