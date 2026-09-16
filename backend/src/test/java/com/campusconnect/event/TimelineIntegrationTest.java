package com.campusconnect.event;

import com.campusconnect.event.dto.TimelineItemRequest;
import com.campusconnect.event.dto.TimelineItemResponse;
import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventCategory;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.TimelineItemType;
import com.campusconnect.event.repository.EventChangeLogRepository;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.event.repository.TimelineItemRepository;
import com.campusconnect.event.service.TimelineService;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class TimelineIntegrationTest {

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TimelineItemRepository timelineItemRepository;

    @Autowired
    private EventChangeLogRepository eventChangeLogRepository;

    private User eventAdmin;
    private User otherAdmin;
    private User superAdmin;
    private User participant;
    private Event event;

    @BeforeEach
    void setUp() {
        eventChangeLogRepository.deleteAll();
        timelineItemRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();

        eventAdmin = userRepository.save(User.builder().name("Admin1").email("admin1@test.com").password("pass").role(Role.EVENT_ADMIN).build());
        otherAdmin = userRepository.save(User.builder().name("Admin2").email("admin2@test.com").password("pass").role(Role.EVENT_ADMIN).build());
        superAdmin = userRepository.save(User.builder().name("Super").email("super@test.com").password("pass").role(Role.SUPER_ADMIN).build());
        participant = userRepository.save(User.builder().name("Part1").email("part1@test.com").password("pass").role(Role.PARTICIPANT).build());

        event = eventRepository.save(Event.builder()
                .title("Timeline Test Event")
                .description("Test")
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(2))
                .capacity(100)
                .status(EventStatus.PUBLISHED)
                .category(EventCategory.OTHER)
                .createdBy(eventAdmin)
                .build());
    }

    @Test
    void testOwnerCanCreateTimelineItem() {
        TimelineItemRequest request = new TimelineItemRequest();
        request.setTitle("Round 1");
        request.setType(TimelineItemType.ROUND);
        request.setStartTime(LocalDateTime.now().plusDays(1));

        TimelineItemResponse response = timelineService.createTimelineItem(event.getId(), request, eventAdmin);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Round 1");

        List<TimelineItemResponse> timeline = timelineService.getTimelineForEvent(event.getId(), participant);
        assertThat(timeline).hasSize(1);
    }

    @Test
    void testSuperAdminCanCreateTimelineItem() {
        TimelineItemRequest request = new TimelineItemRequest();
        request.setTitle("Round 1");
        request.setType(TimelineItemType.ROUND);
        request.setStartTime(LocalDateTime.now().plusDays(1));

        TimelineItemResponse response = timelineService.createTimelineItem(event.getId(), request, superAdmin);

        assertThat(response.getId()).isNotNull();
    }

    @Test
    void testOtherAdminCannotCreateTimelineItem() {
        TimelineItemRequest request = new TimelineItemRequest();
        request.setTitle("Round 1");
        request.setType(TimelineItemType.ROUND);
        request.setStartTime(LocalDateTime.now().plusDays(1));

        assertThrows(AccessDeniedException.class, () -> 
            timelineService.createTimelineItem(event.getId(), request, otherAdmin)
        );
    }

    @Test
    void testParticipantCannotCreateTimelineItem() {
        TimelineItemRequest request = new TimelineItemRequest();
        request.setTitle("Round 1");
        request.setType(TimelineItemType.ROUND);
        request.setStartTime(LocalDateTime.now().plusDays(1));

        assertThrows(AccessDeniedException.class, () -> 
            timelineService.createTimelineItem(event.getId(), request, participant)
        );
    }
}
