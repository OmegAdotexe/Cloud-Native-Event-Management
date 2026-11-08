package com.campusconnect.event.dto;

import com.campusconnect.event.model.RegistrationStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationResponse {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private LocalDateTime eventStartTime;
    private LocalDateTime eventEndTime;
    private String eventStatus;
    private String eventCategory;
    private String eventVenueName;
    private Boolean eventIsVirtual;
    private String eventVirtualLink;
    private String eventRegistrationMode;
    private String eventCoverImageUrl;
    private Long participantId;
    private String participantName;
    private String participantEmail;
    private String participantDepartment;
    private String participantRole;
    private Boolean selfRegistration;
    private Boolean canApprove;
    private RegistrationStatus status;
    private LocalDateTime registeredAt;
    private LocalDateTime respondedAt;
    private Long respondedByAdminId;
    private LocalDateTime cancelledAt;
    private String reason;
}
