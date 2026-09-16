package com.campusconnect.event.controller;

import com.campusconnect.auth.service.JwtService;
import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventChangeLog;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.repository.EventChangeLogRepository;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EventControllerTest {
    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired EventRepository eventRepository;
    @Autowired EventChangeLogRepository eventChangeLogRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    private User admin;
    private String adminToken;
    private String participantToken;

    @BeforeEach
    void setUp() {
        eventChangeLogRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();
        admin = userRepository.save(user("admin@test.com", Role.EVENT_ADMIN));
        adminToken = jwtService.generateToken(admin);
        participantToken = jwtService.generateToken(userRepository.save(user("participant@test.com", Role.PARTICIPANT)));
    }

    @Test
    void eventAdminCanCreateEvent() throws Exception {
        mockMvc.perform(post("/api/events").header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content(validRequest()))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.title").value("Robotics Workshop"));
    }

    @Test
    void participantCannotCreateEvent() throws Exception {
        mockMvc.perform(post("/api/events").header("Authorization", bearer(participantToken)).contentType(MediaType.APPLICATION_JSON).content(validRequest()))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsInvalidCapacityAndDateRange() throws Exception {
        mockMvc.perform(post("/api/events").header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest().replace("\"capacity\":30", "\"capacity\":0")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/events").header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest().replace("2030-06-01T12:00:00", "2030-06-01T09:00:00")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void ownerCanUpdateButAnotherAdminCannot() throws Exception {
        Long id = createEvent();
        mockMvc.perform(patch("/api/events/{id}", id).header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content("{\"venueName\":\"New Hall\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.venueName").value("New Hall"));
        User other = userRepository.save(user("other@test.com", Role.EVENT_ADMIN));
        mockMvc.perform(patch("/api/events/{id}", id).header("Authorization", bearer(jwtService.generateToken(other))).contentType(MediaType.APPLICATION_JSON).content("{\"venueName\":\"Nope\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdminCanEditAnyEvent() throws Exception {
        Long id = createEvent();
        User superAdmin = userRepository.save(user("supermod@test.com", Role.SUPER_ADMIN));
        mockMvc.perform(patch("/api/events/{id}", id).header("Authorization", bearer(jwtService.generateToken(superAdmin))).contentType(MediaType.APPLICATION_JSON).content("{\"venueName\":\"Super Hall\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.venueName").value("Super Hall"));
    }

    @Test
    void publishAndMissingEventBehaveCorrectly() throws Exception {
        Long id = createEvent();
        mockMvc.perform(patch("/api/events/{id}/publish", id).header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"));
        mockMvc.perform(get("/api/events/99999").header("Authorization", bearer(adminToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void superAdminCanCreateEvent() throws Exception {
        User superAdmin = userRepository.save(user("super@test.com", Role.SUPER_ADMIN));
        mockMvc.perform(post("/api/events").header("Authorization", bearer(jwtService.generateToken(superAdmin))).contentType(MediaType.APPLICATION_JSON).content(validRequest()))
                .andExpect(status().isCreated());
    }

    @Test
    void ownerCanCancelAndDeleteEvent() throws Exception {
        Long id = createEvent();
        mockMvc.perform(patch("/api/events/{id}/cancel", id).header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Weather emergency\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED")).andExpect(jsonPath("$.cancelledReason").value("Weather emergency"));
        mockMvc.perform(delete("/api/events/{id}", id).header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());
    }

    @Test
    void updateVenueOnly_createsOneChangeLogRow() throws Exception {
        Long id = createEvent();
        mockMvc.perform(patch("/api/events/{id}", id).header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content("{\"venueName\":\"Auditorium\"}"))
                .andExpect(status().isOk());
        List<EventChangeLog> logs = eventChangeLogRepository.findByEventId(id);
        assertEquals(1, logs.size());
        assertEquals("venue", logs.get(0).getFieldName());
        assertEquals("Lab 204", logs.get(0).getOldValue());
        assertEquals("Auditorium", logs.get(0).getNewValue());
    }

    @Test
    void cancelPublishedEvent_producesChangeLogRow() throws Exception {
        Long id = createEvent();
        mockMvc.perform(patch("/api/events/{id}/publish", id).header("Authorization", bearer(adminToken)));
        mockMvc.perform(patch("/api/events/{id}/cancel", id).header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Cancelled due to rain\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
        List<EventChangeLog> logs = eventChangeLogRepository.findByEventId(id);
        boolean hasStatusLog = logs.stream().anyMatch(l -> "status".equals(l.getFieldName()) && "PUBLISHED".equals(l.getOldValue()) && "CANCELLED".equals(l.getNewValue()));
        assertEquals(true, hasStatusLog);
    }

    @Test
    void cancelAlreadyCancelledEvent_returns409() throws Exception {
        Long id = createEvent();
        mockMvc.perform(patch("/api/events/{id}/cancel", id).header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"First cancel\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/events/{id}/cancel", id).header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Second cancel\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void nonOwnerCannotCancelEvent() throws Exception {
        Long id = createEvent();
        User other = userRepository.save(user("other2@test.com", Role.EVENT_ADMIN));
        mockMvc.perform(patch("/api/events/{id}/cancel", id).header("Authorization", bearer(jwtService.generateToken(other))).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Not my event\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void participantOnlySeesPublishedEvents() throws Exception {
        eventRepository.save(Event.builder().title("Draft").venueName("A").startTime(LocalDateTime.of(2030, 6, 1, 10, 0)).endTime(LocalDateTime.of(2030, 6, 1, 11, 0)).registrationDeadline(LocalDateTime.of(2030, 5, 31, 10, 0)).capacity(10).status(EventStatus.DRAFT).createdBy(admin).build());
        eventRepository.save(Event.builder().title("Published").venueName("B").startTime(LocalDateTime.of(2030, 6, 2, 10, 0)).endTime(LocalDateTime.of(2030, 6, 2, 11, 0)).registrationDeadline(LocalDateTime.of(2030, 6, 1, 10, 0)).capacity(10).status(EventStatus.PUBLISHED).createdBy(admin).build());
        mockMvc.perform(get("/api/events").header("Authorization", bearer(participantToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].title").value("Published"));
    }

    @Test
    void createEvent_withRegistrationModeCategoryAndWaitlist() throws Exception {
        String payload = validRequest()
                .replace("}", ",\"registrationMode\":\"APPROVAL_REQUIRED\",\"category\":\"WORKSHOP\",\"waitlistEnabled\":true}");
        mockMvc.perform(post("/api/events").header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registrationMode").value("APPROVAL_REQUIRED"))
                .andExpect(jsonPath("$.category").value("WORKSHOP"))
                .andExpect(jsonPath("$.waitlistEnabled").value(true));
    }

    @Test
    void getAllEvents_withCategoryFilter() throws Exception {
        String workshopPayload = validRequest().replace("Robotics Workshop", "Workshop 1")
                .replace("}", ",\"category\":\"WORKSHOP\"}");
        String seminarPayload = validRequest().replace("Robotics Workshop", "Seminar 1")
                .replace("}", ",\"category\":\"SEMINAR\"}");

        mockMvc.perform(post("/api/events").header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content(workshopPayload))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/events").header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content(seminarPayload))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/events?category=WORKSHOP").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Workshop 1"));
    }

    @Test
    void superAdminCanReassignEvent_andProducesChangeLog() throws Exception {
        Long id = createEvent();
        User newAdmin = userRepository.save(user("newadmin@test.com", Role.EVENT_ADMIN));
        User superAdmin = userRepository.save(user("supermod@test.com", Role.SUPER_ADMIN));

        mockMvc.perform(patch("/api/events/{id}/reassign", id)
                        .header("Authorization", bearer(jwtService.generateToken(superAdmin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEventAdminId\":" + newAdmin.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.createdByName").value(newAdmin.getName()));

        List<EventChangeLog> logs = eventChangeLogRepository.findByEventId(id);
        boolean hasReassignLog = logs.stream().anyMatch(l -> "createdBy".equals(l.getFieldName())
                && admin.getName().equals(l.getOldValue())
                && newAdmin.getName().equals(l.getNewValue()));
        assertEquals(true, hasReassignLog);
    }

    @Test
    void eventAdminCannotReassignEvent_returns403() throws Exception {
        Long id = createEvent();
        User newAdmin = userRepository.save(user("newadmin2@test.com", Role.EVENT_ADMIN));

        mockMvc.perform(patch("/api/events/{id}/reassign", id)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEventAdminId\":" + newAdmin.getId() + "}"))
                .andExpect(status().isForbidden());
    }

    private Long createEvent() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/events").header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON).content(validRequest()))
                .andExpect(status().isCreated()).andReturn();
        return Long.valueOf(com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.id").toString());
    }
    private User user(String email, Role role) { return User.builder().name(email).email(email).password(passwordEncoder.encode("password")).role(role).build(); }
    private String bearer(String token) { return "Bearer " + token; }
    private String validRequest() { return "{\"title\":\"Robotics Workshop\",\"description\":\"Build robots\",\"venueName\":\"Lab 204\",\"startTime\":\"2030-06-01T10:00:00\",\"endTime\":\"2030-06-01T12:00:00\",\"registrationDeadline\":\"2030-05-30T23:59:00\",\"capacity\":30}"; }
}
