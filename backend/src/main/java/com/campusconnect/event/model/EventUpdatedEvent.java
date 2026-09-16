package com.campusconnect.event.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.Map;

@Getter
@AllArgsConstructor
public class EventUpdatedEvent {
    private final Long eventId;
    private final String title;
    private final Map<String, String> changes; // map of field name -> new value
}
