package com.campusconnect.event.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TimelineItemCreatedEvent {
    private final Long eventId;
    private final Long timelineItemId;
    private final String title;
    private final String type;
}
