package com.campusconnect.event.service;

import com.campusconnect.event.dto.CreateEventRequest;
import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventService eventService;

    @Test
    void createEvent_deadlineAfterStartTime_shouldFail() {
        CreateEventRequest request = CreateEventRequest.builder()
                .title("Test Event")
                .venueName("Lab 204")
                .startTime(LocalDateTime.of(2030, 6, 1, 10, 0))
                .endTime(LocalDateTime.of(2030, 6, 1, 12, 0))
                .registrationDeadline(LocalDateTime.of(2030, 6, 1, 11, 0)) // after start
                .capacity(30)
                .status(EventStatus.DRAFT)
                .build();
        User creator = User.builder().id(1L).name("Admin").email("a@t.com").role(Role.EVENT_ADMIN).build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> eventService.createEvent(request, creator));
        assertTrue(ex.getMessage().contains("Registration deadline must be before start time"));
    }

    @Test
    void createEvent_deadlineBeforeStartTime_shouldSucceed() {
        CreateEventRequest request = CreateEventRequest.builder()
                .title("Test Event")
                .venueName("Lab 204")
                .startTime(LocalDateTime.of(2030, 6, 1, 10, 0))
                .endTime(LocalDateTime.of(2030, 6, 1, 12, 0))
                .registrationDeadline(LocalDateTime.of(2030, 5, 31, 23, 59)) // before start
                .capacity(30)
                .status(EventStatus.DRAFT)
                .build();
        User creator = User.builder().id(1L).name("Admin").email("a@t.com").role(Role.EVENT_ADMIN).build();

        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event e = invocation.getArgument(0);
            e.setId(1L);
            e.setCreatedAt(LocalDateTime.now());
            e.setUpdatedAt(LocalDateTime.now());
            return e;
        });

        assertDoesNotThrow(() -> eventService.createEvent(request, creator));
    }
}
