package com.campusconnect.event.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RegistrationRejectedEvent {
    private final Long registrationId;
    private final Long eventId;
    private final Long participantId;
}
