package com.campusconnect.event.dto;

import com.campusconnect.event.model.RegistrationStatus;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class RegistrationResponse {
    Long id;
    Long eventId;
    String eventTitle;
    LocalDateTime eventStartTime;
    String eventStatus;
    String eventVenueName;
    Boolean eventIsVirtual;
    String eventVirtualLink;
    String eventRegistrationMode;
    Long participantId;
    String participantName;
    RegistrationStatus status;
    LocalDateTime registeredAt;
    LocalDateTime respondedAt;
    Long respondedByAdminId;
    LocalDateTime cancelledAt;
}
