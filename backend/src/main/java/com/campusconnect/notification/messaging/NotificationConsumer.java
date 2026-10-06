package com.campusconnect.notification.messaging;

import com.campusconnect.notification.dto.NotificationMessage;
import com.campusconnect.notification.model.Notification;
import com.campusconnect.notification.model.NotificationChannel;
import com.campusconnect.notification.model.NotificationStatus;
import com.campusconnect.notification.repository.NotificationRepository;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final com.campusconnect.notification.email.EmailProvider emailProvider;

    @org.springframework.beans.factory.annotation.Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @RabbitListener(queues = "${spring.rabbitmq.template.default-receive-queue:notification.queue}")
    @Transactional
    public void consumeNotification(NotificationMessage message) {
        log.info("Received notification message ID: {}", message.getMessageId());
        
        try {
            // Idempotency check
            if (notificationRepository.existsByMessageId(message.getMessageId())) {
                log.info("Notification message {} already processed, skipping duplicate", message.getMessageId());
                return;
            }

            User recipient = userRepository.findById(message.getRecipientId()).orElse(null);
            if (recipient == null) {
                log.warn("Recipient ID {} not found. Cannot save notification.", message.getRecipientId());
                return;
            }

            // Fallback to IN_APP if channel is null
            NotificationChannel channel = message.getChannel() != null ? message.getChannel() : NotificationChannel.IN_APP;

            Notification notification = Notification.builder()
                    .messageId(message.getMessageId())
                    .recipient(recipient)
                    .eventId(message.getEventId())
                    .type(message.getType())
                    .title(message.getTitle())
                    .message(message.getMessage())
                    .channel(channel)
                    .status(NotificationStatus.SENT)
                    .build();

            notificationRepository.save(notification);
            log.info("Saved in-app notification successfully for user {}", message.getRecipientId());
            
            if (channel == NotificationChannel.EMAIL) {
                if (emailEnabled) {
                    try {
                        emailProvider.send(recipient.getEmail(), message.getTitle(), message.getMessage(), message.getType());
                    } catch (Exception ex) {
                        log.error("Failed to send email to user {} for message {}. Exception: {}", recipient.getEmail(), message.getMessageId(), ex.getMessage());
                        // Catch and log without throwing so that we do not crash the consumer and re-process the message
                    }
                } else {
                    log.info("Email dispatch is disabled. Skipping email for message {}", message.getMessageId());
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to process notification message {}", message.getMessageId(), e);
            // Throw exception so RabbitMQ redelivers it or sends it to a Dead Letter Queue
            throw e;
        }
    }
}
