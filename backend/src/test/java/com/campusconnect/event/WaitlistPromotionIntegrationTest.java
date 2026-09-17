package com.campusconnect.event;

import com.campusconnect.auth.service.JwtService;
import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.Registration;
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
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.springframework.test.annotation.DirtiesContext;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class WaitlistPromotionIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired EventRepository eventRepository;
    @Autowired RegistrationRepository registrationRepository;
    @Autowired com.campusconnect.notification.repository.NotificationRepository notificationRepository;
    @Autowired JwtService jwtService;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        registrationRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void cancellingConfirmedRegistration_promotesWaitlistedParticipant() throws Exception {
        User admin = userRepository.save(User.builder().name("Admin").email("admin@test.com").password("pass").role(Role.EVENT_ADMIN).build());
        String adminToken = jwtService.generateToken(admin);

        Event event = eventRepository.save(Event.builder()
                .title("Waitlist Event")
                .venueName("Room 101")
                .startTime(LocalDateTime.now().plusDays(10))
                .endTime(LocalDateTime.now().plusDays(10).plusHours(2))
                .registrationDeadline(LocalDateTime.now().plusDays(5))
                .capacity(1) // Capacity of 1
                .status(EventStatus.PUBLISHED)
                .waitlistEnabled(true)
                .createdBy(admin)
                .build());

        User p1 = userRepository.save(User.builder().name("P1").email("p1@test.com").password("pass").role(Role.PARTICIPANT).build());
        User p2 = userRepository.save(User.builder().name("P2").email("p2@test.com").password("pass").role(Role.PARTICIPANT).build());
        User p3 = userRepository.save(User.builder().name("P3").email("p3@test.com").password("pass").role(Role.PARTICIPANT).build());

        String t1 = jwtService.generateToken(p1);
        String t2 = jwtService.generateToken(p2);
        String t3 = jwtService.generateToken(p3);

        // P1 registers -> CONFIRMED
        MvcResult r1 = mockMvc.perform(post("/api/events/{eventId}/registrations", event.getId())
                        .header("Authorization", "Bearer " + t1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andReturn();
        Long reg1Id = Long.valueOf(com.jayway.jsonpath.JsonPath.read(r1.getResponse().getContentAsString(), "$.id").toString());

        // P2 registers -> WAITLISTED
        mockMvc.perform(post("/api/events/{eventId}/registrations", event.getId())
                        .header("Authorization", "Bearer " + t2)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WAITLISTED"));

        // P3 registers -> WAITLISTED
        mockMvc.perform(post("/api/events/{eventId}/registrations", event.getId())
                        .header("Authorization", "Bearer " + t3)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WAITLISTED"));

        // Admin cancels P1's registration
        mockMvc.perform(post("/api/events/{eventId}/registrations/{id}/cancel", event.getId(), reg1Id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // Verify P2 is promoted
        Registration reg2 = registrationRepository.findByParticipantOrderByRegisteredAtDesc(p2).get(0);
        assertEquals(RegistrationStatus.CONFIRMED, reg2.getStatus(), "P2 should be promoted to CONFIRMED");

        // Verify P3 is still waitlisted
        Registration reg3 = registrationRepository.findByParticipantOrderByRegisteredAtDesc(p3).get(0);
        assertEquals(RegistrationStatus.WAITLISTED, reg3.getStatus(), "P3 should still be WAITLISTED");
    }
}
