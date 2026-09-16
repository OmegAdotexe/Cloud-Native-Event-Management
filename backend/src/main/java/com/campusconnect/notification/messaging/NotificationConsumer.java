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

            Notification notification = Notification.builder()
                    .messageId(message.getMessageId())
                    .recipient(recipient)
                    .eventId(message.getEventId())
                    .type(message.getType())
                    .title(message.getTitle())
                    .message(message.getMessage())
                    .channel(NotificationChannel.IN_APP)
                    .status(NotificationStatus.SENT)
                    .build();

            notificationRepository.save(notification);
            log.info("Saved in-app notification successfully for user {}", message.getRecipientId());
            
            // Note: Email and WhatsApp logic would go here, updating status to FAILED or RETRYING if providers fail.
            // For now, only IN_APP is implemented.
            
        } catch (Exception e) {
            log.error("Failed to process notification message {}", message.getMessageId(), e);
            // Throw exception so RabbitMQ redelivers it or sends it to a Dead Letter Queue
            throw e;
        }
    }
}
