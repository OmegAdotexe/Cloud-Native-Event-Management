package com.campusconnect.notification.messaging;

import com.campusconnect.event.model.*;
import com.campusconnect.event.repository.RegistrationRepository;
import com.campusconnect.notification.config.RabbitMQConfig;
import com.campusconnect.notification.dto.NotificationMessage;
import com.campusconnect.notification.model.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;
    private final RegistrationRepository registrationRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleRegistrationConfirmed(RegistrationConfirmedEvent event) {
        log.info("Sending REGISTRATION_CONFIRMED notification for registrationId: {}", event.getRegistrationId());
        registrationRepository.findById(event.getRegistrationId()).ifPresent(registration -> {
            sendNotification(event.getParticipantId(), event.getEventId(), NotificationType.REGISTRATION_CONFIRMED, 
                    "Registration Confirmed", "Your registration has been confirmed for: " + registration.getEvent().getTitle());
        });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleRegistrationWaitlisted(RegistrationWaitlistedEvent event) {
        log.info("Sending REGISTRATION_WAITLISTED notification for registrationId: {}", event.getRegistrationId());
        registrationRepository.findById(event.getRegistrationId()).ifPresent(registration -> {
            sendNotification(event.getParticipantId(), event.getEventId(), NotificationType.REGISTRATION_WAITLISTED,
                    "Waitlist Joined", "You have been placed on the waitlist for: " + registration.getEvent().getTitle());
        });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleRegistrationPending(RegistrationPendingEvent event) {
        log.info("Sending REGISTRATION_PENDING admin notification for registrationId: {}", event.getRegistrationId());
        registrationRepository.findById(event.getRegistrationId()).ifPresent(registration -> {
            sendNotification(registration.getEvent().getCreatedBy().getId(), event.getEventId(), NotificationType.REGISTRATION_PENDING,
                    "Registration Pending Approval", registration.getParticipant().getName() + " has requested to join: " + registration.getEvent().getTitle());
        });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleRegistrationRejected(RegistrationRejectedEvent event) {
        log.info("Sending REGISTRATION_REJECTED notification for registrationId: {}", event.getRegistrationId());
        sendNotification(event.getParticipantId(), event.getEventId(), NotificationType.REGISTRATION_REJECTED,
                "Registration Rejected", "Your registration for this event was rejected by an admin.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleRegistrationCancelled(RegistrationCancelledEvent event) {
        log.info("Sending REGISTRATION_CANCELLED notification for registrationId: {}", event.getRegistrationId());
        registrationRepository.findById(event.getRegistrationId()).ifPresent(registration -> {
            String msg = "Your registration for " + registration.getEvent().getTitle() + " has been cancelled.";
            if (event.getReason() != null && !event.getReason().trim().isEmpty()) {
                msg = "Your registration for " + registration.getEvent().getTitle() + " was cancelled by an admin. Reason: " + event.getReason();
            }
            sendNotification(event.getParticipantId(), event.getEventId(), NotificationType.REGISTRATION_CANCELLED,
                    "Registration Cancelled", msg);
        });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleEventPublished(EventPublishedEvent event) {
        log.info("Event {} published. Not sending global broadcast per requirements.", event.getEventId());
        // Per requirements: "Only trigger notifications for affected participants where appropriate. Do not send notifications to every user indiscriminately."
        // We will skip global broadcasts unless required by a specific requirement.
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleEventCancelled(EventCancelledEvent event) {
        log.info("Event {} cancelled. Notifying active participants.", event.getEventId());
        // Find all active participants and notify them
        registrationRepository.findByEventIdAndStatusNotIn(event.getEventId(), List.of(RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED))
                .forEach(registration -> {
                    sendNotification(registration.getParticipant().getId(), event.getEventId(), NotificationType.EVENT_CANCELLED,
                            "Event Cancelled: " + event.getTitle(), "This event has been cancelled. Reason: " + event.getReason());
                });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleEventUpdated(EventUpdatedEvent event) {
        log.info("Event {} updated. Notifying active participants.", event.getEventId());
        StringBuilder message = new StringBuilder("The following details were updated for " + event.getTitle() + ": ");
        
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy h:mm a");
        java.util.List<String> changeSnippets = new java.util.ArrayList<>();
        event.getChanges().forEach((k, v) -> {
            String displayVal = v;
            if (k.toLowerCase().contains("time") && v.contains("T")) {
                try {
                    String cleanV = v.endsWith("Z") ? v.substring(0, v.length() - 1) : v;
                    displayVal = java.time.LocalDateTime.parse(cleanV).format(formatter);
                } catch (Exception ignored) { }
            }
            String displayKey = k.substring(0, 1).toUpperCase() + k.substring(1).replaceAll("([A-Z])", " $1").trim();
            changeSnippets.add(displayKey + " to '" + displayVal + "'");
        });
        message.append(String.join(", ", changeSnippets)).append(".");
        
        NotificationType type = NotificationType.EVENT_UPDATED;
        if (event.getChanges().containsKey("venue")) type = NotificationType.EVENT_VENUE_CHANGED;
        if (event.getChanges().containsKey("startTime") || event.getChanges().containsKey("endTime")) type = NotificationType.EVENT_TIME_CHANGED;

        NotificationType finalType = type;
        registrationRepository.findByEventIdAndStatusNotIn(event.getEventId(), List.of(RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED))
                .forEach(registration -> {
                    sendNotification(registration.getParticipant().getId(), event.getEventId(), finalType,
                            "Event Details Updated: " + event.getTitle(), message.toString());
                });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleTimelineItemCreated(TimelineItemCreatedEvent event) {
        log.info("TimelineItem created for event {}. Notifying active participants.", event.getEventId());
        notifyTimelineChange(event.getEventId(), event.getTitle(), "A new timeline item was added to the schedule.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleTimelineItemUpdated(TimelineItemUpdatedEvent event) {
        log.info("TimelineItem updated for event {}. Notifying active participants.", event.getEventId());
        notifyTimelineChange(event.getEventId(), event.getTitle(), "A timeline item was updated in the schedule.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleTimelineItemDeleted(TimelineItemDeletedEvent event) {
        log.info("TimelineItem deleted for event {}. Notifying active participants.", event.getEventId());
        notifyTimelineChange(event.getEventId(), event.getTitle(), "A timeline item was removed from the schedule.");
    }

    private void notifyTimelineChange(Long eventId, String itemTitle, String message) {
        registrationRepository.findByEventIdAndStatusNotIn(eventId, List.of(RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED))
                .forEach(registration -> {
                    String eventTitle = registration.getEvent().getTitle();
                    sendNotification(registration.getParticipant().getId(), eventId, NotificationType.TIMELINE_UPDATED,
                            "Schedule Updated: " + eventTitle, message + " Item: " + itemTitle);
                });
    }

    private void sendNotification(Long recipientId, Long eventId, NotificationType type, String title, String message) {
        NotificationMessage msg = NotificationMessage.builder()
                .messageId(UUID.randomUUID().toString())
                .recipientId(recipientId)
                .eventId(eventId)
                .type(type)
                .title(title)
                .message(message)
                .build();
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "notification.send", msg);
    }
}
