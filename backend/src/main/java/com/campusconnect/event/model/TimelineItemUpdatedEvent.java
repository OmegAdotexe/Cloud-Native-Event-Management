package com.campusconnect.event.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TimelineItemUpdatedEvent {
    private final Long eventId;
    private final Long timelineItemId;
    private final String title;
}
