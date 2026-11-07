package com.campusconnect.event.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RegistrationRejectedEvent {
    private final Long registrationId;
    private final Long eventId;
    private final Long participantId;
    private final String reason;

    public RegistrationRejectedEvent(Long registrationId, Long eventId, Long participantId) {
        this(registrationId, eventId, participantId, null);
    }
}

