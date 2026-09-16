package com.campusconnect.event;

import com.campusconnect.auth.service.JwtService;
import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.RegistrationStatus;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.event.repository.RegistrationRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RegistrationConcurrencyIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired EventRepository eventRepository;
    @Autowired RegistrationRepository registrationRepository;
    @Autowired JwtService jwtService;

    @BeforeEach
    void setUp() {
        registrationRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void concurrentRegistrations_respectsCapacity() throws InterruptedException {
        // Create Admin
        User admin = userRepository.save(User.builder().name("Admin").email("admin@test.com").password("pass").role(Role.EVENT_ADMIN).build());

        // Create Event with capacity 5
        Event event = eventRepository.save(Event.builder()
                .title("Concurrent Event")
                .venueName("Room 101")
                .startTime(LocalDateTime.now().plusDays(10))
                .endTime(LocalDateTime.now().plusDays(10).plusHours(2))
                .registrationDeadline(LocalDateTime.now().plusDays(5))
                .capacity(5)
                .status(EventStatus.PUBLISHED)
                .waitlistEnabled(false)
                .createdBy(admin)
                .build());

        int numParticipants = 20;
        List<String> tokens = new ArrayList<>();
        for (int i = 0; i < numParticipants; i++) {
            User p = userRepository.save(User.builder().name("User " + i).email("user" + i + "@test.com").password("pass").role(Role.PARTICIPANT).build());
            tokens.add(jwtService.generateToken(p));
        }

        ExecutorService executor = Executors.newFixedThreadPool(numParticipants);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numParticipants);
        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger conflictCount = new AtomicInteger();

        for (int i = 0; i < numParticipants; i++) {
            final String token = tokens.get(i);
            executor.submit(() -> {
                try {
                    startLatch.await(); // wait until all threads are ready
                    int statusCode = mockMvc.perform(post("/api/events/{eventId}/registrations", event.getId())
                                    .header("Authorization", "Bearer " + token)
                                    .contentType(MediaType.APPLICATION_JSON))
                            .andReturn().getResponse().getStatus();

                    if (statusCode == 200) {
                        successCount.incrementAndGet();
                    } else if (statusCode == 409) {
                        conflictCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Unleash the threads
        startLatch.countDown();
        doneLatch.await(10, TimeUnit.SECONDS);

        // Verify results
        assertEquals(5, successCount.get(), "Exactly 5 requests should succeed");
        assertEquals(15, conflictCount.get(), "Exactly 15 requests should get 409 conflict");

        int dbConfirmedCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CONFIRMED);
        assertEquals(5, dbConfirmedCount, "Database should have exactly 5 confirmed registrations");
        assertEquals(5, registrationRepository.findAll().size(), "Database should have exactly 5 total registrations");
    }
}
