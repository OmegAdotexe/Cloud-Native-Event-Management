package com.campusconnect.notification;

import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.RegistrationMode;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.event.service.EventService;
import com.campusconnect.event.service.RegistrationService;
import com.campusconnect.notification.model.Notification;
import com.campusconnect.notification.model.NotificationStatus;
import com.campusconnect.notification.model.NotificationType;
import com.campusconnect.notification.repository.NotificationRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class NotificationIntegrationTest {

    @Autowired
    private EventService eventService;

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    private User admin;
    private User participant;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(User.builder()
                .email("admin@test.com")
                .name("Admin")
                .password("test")
                .role(Role.EVENT_ADMIN)
                .build());

        participant = userRepository.save(User.builder()
                .email("participant@test.com")
                .name("Participant")
                .password("test")
                .role(Role.PARTICIPANT)
                .build());
    }

    @Test
    void shouldCreateNotificationOnRegistrationConfirmed() {
        Event event = eventRepository.save(Event.builder()
                .title("Test Event")
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(2))
                .capacity(10)
                .status(EventStatus.PUBLISHED)
                .registrationMode(RegistrationMode.OPEN)
                .createdBy(admin)
                .build());

        registrationService.registerForEvent(event.getId(), participant);

        // RabbitMQ processing is async, wait up to 5 seconds
        boolean messageReceived = false;
        for (int i = 0; i < 20; i++) {
            if (notificationRepository.countUnreadByRecipient(participant) > 0) {
                messageReceived = true;
                break;
            }
            try {
                Thread.sleep(250);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        assertThat(messageReceived).isTrue();

        List<Notification> notifications = notificationRepository.findAll();
        assertThat(notifications).hasSize(1);
        Notification notif = notifications.get(0);
        assertThat(notif.getType()).isEqualTo(NotificationType.REGISTRATION_CONFIRMED);
        assertThat(notif.getRecipient().getId()).isEqualTo(participant.getId());
        assertThat(notif.getStatus()).isEqualTo(NotificationStatus.SENT);
    }
}
