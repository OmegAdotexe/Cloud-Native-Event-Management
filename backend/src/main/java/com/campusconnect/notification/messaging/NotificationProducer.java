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

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;
    private final RegistrationRepository registrationRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRegistrationConfirmed(RegistrationConfirmedEvent event) {
        log.info("Sending REGISTRATION_CONFIRMED notification for registrationId: {}", event.getRegistrationId());
        sendNotification(event.getParticipantId(), event.getEventId(), NotificationType.REGISTRATION_CONFIRMED, 
                "Registration Confirmed", "Your registration has been confirmed.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRegistrationWaitlisted(RegistrationWaitlistedEvent event) {
        log.info("Sending REGISTRATION_WAITLISTED notification for registrationId: {}", event.getRegistrationId());
        sendNotification(event.getParticipantId(), event.getEventId(), NotificationType.REGISTRATION_WAITLISTED,
                "Waitlist Joined", "You have been placed on the waitlist for this event.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRegistrationRejected(RegistrationRejectedEvent event) {
        log.info("Sending REGISTRATION_REJECTED notification for registrationId: {}", event.getRegistrationId());
        sendNotification(event.getParticipantId(), event.getEventId(), NotificationType.REGISTRATION_REJECTED,
                "Registration Rejected", "Your registration for this event was rejected by an admin.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRegistrationCancelled(RegistrationCancelledEvent event) {
        log.info("Sending REGISTRATION_CANCELLED notification for registrationId: {}", event.getRegistrationId());
        sendNotification(event.getParticipantId(), event.getEventId(), NotificationType.REGISTRATION_CANCELLED,
                "Registration Cancelled", "Your registration for this event has been cancelled.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleEventPublished(EventPublishedEvent event) {
        log.info("Event {} published. Not sending global broadcast per requirements.", event.getEventId());
        // Per requirements: "Only trigger notifications for affected participants where appropriate. Do not send notifications to every user indiscriminately."
        // We will skip global broadcasts unless required by a specific requirement.
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
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
    public void handleEventUpdated(EventUpdatedEvent event) {
        log.info("Event {} updated. Notifying active participants.", event.getEventId());
        StringBuilder message = new StringBuilder("The following details were updated for " + event.getTitle() + ": ");
        event.getChanges().forEach((k, v) -> message.append(k).append(" (").append(v).append("), "));
        
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
