package com.campusconnect.common.config;

import com.campusconnect.event.model.*;
import com.campusconnect.event.repository.EventChangeLogRepository;
import com.campusconnect.event.repository.EventInviteRepository;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.event.repository.RegistrationRepository;
import com.campusconnect.event.repository.TimelineItemRepository;
import com.campusconnect.notification.model.*;
import com.campusconnect.notification.repository.NotificationRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final TimelineItemRepository timelineItemRepository;
    private final NotificationRepository notificationRepository;
    private final EventChangeLogRepository eventChangeLogRepository;
    private final EventInviteRepository eventInviteRepository;

    @Bean
    @Profile({"dev", "local", "default"}) // Demo accounts are seeded in all development and local environments
    public CommandLineRunner seedDatabase() {
        return args -> {
            // --- Clean up any existing duplicate events in database ---
            cleanupDuplicateEvents();

            // --- Seed Demo Users ---
            User superAdmin = seedDemoUser("superadmin@example.com", "Super Admin", Role.SUPER_ADMIN);
            User admin = seedDemoUser("admin@example.com", "Event Admin", Role.EVENT_ADMIN);
            User participant = seedDemoUser("participant@example.com", "Participant", Role.PARTICIPANT);

            // --- Seed Demo Data (Events, Registrations, Timeline Items, Notifications) ---
            seedDemoData(superAdmin, admin, participant);
        };
    }

    private User seedDemoUser(String email, String name, Role role) {
        return userRepository.findByEmail(email).map(user -> {
            // Ensure demo account is approved, local auth, and reset to standard password
            user.setStatus("APPROVED");
            user.setAuthProvider("LOCAL");
            user.setPassword(passwordEncoder.encode("password"));
            return userRepository.save(user);
        }).orElseGet(() -> userRepository.save(User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode("password"))
                .role(role)
                .status("APPROVED")
                .authProvider("LOCAL")
                .build()));
    }

    private void seedDemoData(User superAdmin, User admin, User participant) {
        // Only seed if no events exist yet (idempotent)
        if (eventRepository.count() > 0) {
            log.info("Demo data already exists — skipping seed.");
            return;
        }

        log.info("Seeding demo events, registrations, timeline items, and notifications...");

        LocalDateTime now = LocalDateTime.now();
        List<Event> events = new ArrayList<>();

        // ===== EVENT 1: WORKSHOP — Cloud Native Workshop =====
        Event cloudWorkshop = eventRepository.save(Event.builder()
                .title("Cloud Native Development Workshop")
                .description("A hands-on workshop covering Docker, Kubernetes, and microservices architecture. " +
                        "Learn how to containerize applications, deploy to Kubernetes clusters, and implement " +
                        "cloud-native patterns. Bring your laptop with Docker Desktop installed.")
                .venueName("Computer Science Lab 301")
                .isVirtual(false)
                .startTime(now.plusDays(7).withHour(10).withMinute(0))
                .endTime(now.plusDays(7).withHour(16).withMinute(0))
                .registrationDeadline(now.plusDays(5).withHour(23).withMinute(59))
                .capacity(50)
                .status(EventStatus.PUBLISHED)
                .registrationMode(RegistrationMode.OPEN)
                .category(EventCategory.WORKSHOP)
                .waitlistEnabled(true)
                .coverImageUrl("https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80")
                .createdBy(admin)
                .build());
        events.add(cloudWorkshop);

        // ===== EVENT 2: SEMINAR — AI & Machine Learning Seminar =====
        Event aiSeminar = eventRepository.save(Event.builder()
                .title("AI & Machine Learning: Future of Technology")
                .description("Join industry experts for an insightful seminar on the latest advancements in " +
                        "Artificial Intelligence and Machine Learning. Topics include generative AI, " +
                        "large language models, computer vision, and ethical AI development. " +
                        "Q&A session with panelists after the talks.")
                .venueName("Main Auditorium")
                .isVirtual(false)
                .startTime(now.plusDays(10).withHour(14).withMinute(0))
                .endTime(now.plusDays(10).withHour(17).withMinute(30))
                .registrationDeadline(now.plusDays(9).withHour(23).withMinute(59))
                .capacity(200)
                .status(EventStatus.PUBLISHED)
                .registrationMode(RegistrationMode.OPEN)
                .category(EventCategory.SEMINAR)
                .waitlistEnabled(false)
                .coverImageUrl("https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80")
                .createdBy(admin)
                .build());
        events.add(aiSeminar);

        // ===== EVENT 3: CULTURAL — Annual Cultural Fest =====
        Event culturalFest = eventRepository.save(Event.builder()
                .title("Resonance 2025 — Annual Cultural Festival")
                .description("The biggest cultural extravaganza of the year! Three days of music, dance, " +
                        "drama, art exhibitions, and food stalls. Featuring performances by renowned " +
                        "artists, inter-college competitions, and an open-mic night. " +
                        "Don't miss the grand finale concert!")
                .venueName("Central Campus Ground")
                .isVirtual(false)
                .startTime(now.plusDays(14).withHour(9).withMinute(0))
                .endTime(now.plusDays(16).withHour(22).withMinute(0))
                .registrationDeadline(now.plusDays(12).withHour(23).withMinute(59))
                .capacity(500)
                .status(EventStatus.PUBLISHED)
                .registrationMode(RegistrationMode.OPEN)
                .category(EventCategory.CULTURAL)
                .waitlistEnabled(true)
                .coverImageUrl("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80")
                .createdBy(admin)
                .build());
        events.add(culturalFest);

        // ===== EVENT 4: SPORTS — Inter-Department Cricket Tournament =====
        Event cricketTournament = eventRepository.save(Event.builder()
                .title("Inter-Department Cricket Tournament")
                .description("Annual cricket tournament featuring teams from all departments. " +
                        "Format: T20 matches with league stage and knockouts. " +
                        "Register your department team of 11+4 players. " +
                        "Prizes for winners, runners-up, and best individual performances.")
                .venueName("University Cricket Ground")
                .isVirtual(false)
                .startTime(now.plusDays(21).withHour(8).withMinute(0))
                .endTime(now.plusDays(25).withHour(18).withMinute(0))
                .registrationDeadline(now.plusDays(18).withHour(23).withMinute(59))
                .capacity(150)
                .status(EventStatus.PUBLISHED)
                .registrationMode(RegistrationMode.OPEN)
                .category(EventCategory.SPORTS)
                .waitlistEnabled(false)
                .coverImageUrl("https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80")
                .createdBy(admin)
                .build());
        events.add(cricketTournament);

        // ===== EVENT 5: WORKSHOP — UI/UX Design Sprint =====
        Event designWorkshop = eventRepository.save(Event.builder()
                .title("UI/UX Design Sprint — From Wireframe to Prototype")
                .description("A 2-day intensive design sprint where you'll learn the complete UI/UX workflow. " +
                        "Day 1: User research, personas, wireframing with Figma. " +
                        "Day 2: High-fidelity prototyping, usability testing, and portfolio building. " +
                        "Open to all skill levels.")
                .venueName("Design Studio, Block B")
                .isVirtual(false)
                .startTime(now.plusDays(8).withHour(9).withMinute(30))
                .endTime(now.plusDays(9).withHour(17).withMinute(0))
                .registrationDeadline(now.plusDays(6).withHour(23).withMinute(59))
                .capacity(30)
                .status(EventStatus.PUBLISHED)
                .registrationMode(RegistrationMode.APPROVAL_REQUIRED)
                .category(EventCategory.WORKSHOP)
                .waitlistEnabled(true)
                .coverImageUrl("https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80")
                .createdBy(admin)
                .build());
        events.add(designWorkshop);

        // ===== EVENT 6: OTHER — Startup Pitch Competition =====
        Event pitchComp = eventRepository.save(Event.builder()
                .title("Campus Startup Pitch Night")
                .description("Got a startup idea? Pitch it to a panel of investors and mentors! " +
                        "Top 3 ideas receive seed funding and incubation support. " +
                        "Each team gets 5 minutes to pitch followed by 3 minutes of Q&A. " +
                        "Individual participants and teams of up to 4 welcome.")
                .venueName("Innovation Hub, 2nd Floor")
                .isVirtual(false)
                .startTime(now.plusDays(12).withHour(18).withMinute(0))
                .endTime(now.plusDays(12).withHour(21).withMinute(0))
                .registrationDeadline(now.plusDays(10).withHour(23).withMinute(59))
                .capacity(60)
                .status(EventStatus.PUBLISHED)
                .registrationMode(RegistrationMode.OPEN)
                .category(EventCategory.OTHER)
                .waitlistEnabled(false)
                .coverImageUrl("https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80")
                .createdBy(admin)
                .build());
        events.add(pitchComp);

        // ===== EVENT 7: SEMINAR — Cybersecurity Awareness (VIRTUAL) =====
        Event cyberSeminar = eventRepository.save(Event.builder()
                .title("Cybersecurity Awareness: Protect Your Digital Life")
                .description("An online seminar covering essential cybersecurity practices for students. " +
                        "Topics: password security, phishing attacks, safe browsing, social engineering, " +
                        "and securing personal devices. Live demo of common attack vectors included.")
                .venueName("Online — Zoom")
                .isVirtual(true)
                .virtualLink("https://zoom.us/j/example-meeting-id")
                .startTime(now.plusDays(5).withHour(15).withMinute(0))
                .endTime(now.plusDays(5).withHour(17).withMinute(0))
                .registrationDeadline(now.plusDays(4).withHour(23).withMinute(59))
                .capacity(300)
                .status(EventStatus.PUBLISHED)
                .registrationMode(RegistrationMode.OPEN)
                .category(EventCategory.SEMINAR)
                .waitlistEnabled(false)
                .coverImageUrl("https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80")
                .createdBy(admin)
                .build());
        events.add(cyberSeminar);

        // ===== EVENT 8: SPORTS — Basketball Championship (DRAFT — not published) =====
        Event basketballDraft = eventRepository.save(Event.builder()
                .title("Inter-College Basketball Championship")
                .description("Annual basketball championship inviting teams from neighbouring colleges. " +
                        "Full-court 5v5 format. Details to be announced soon.")
                .venueName("Indoor Sports Complex")
                .isVirtual(false)
                .startTime(now.plusDays(30).withHour(9).withMinute(0))
                .endTime(now.plusDays(32).withHour(18).withMinute(0))
                .registrationDeadline(now.plusDays(27).withHour(23).withMinute(59))
                .capacity(100)
                .status(EventStatus.DRAFT)
                .registrationMode(RegistrationMode.OPEN)
                .category(EventCategory.SPORTS)
                .waitlistEnabled(false)
                .coverImageUrl("https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80")
                .createdBy(admin)
                .build());
        events.add(basketballDraft);

        log.info("Seeded {} demo events.", events.size());

        // ===== REGISTRATIONS =====
        // Register participant for several published events
        Registration reg1 = registrationRepository.save(Registration.builder()
                .event(cloudWorkshop)
                .participant(participant)
                .status(RegistrationStatus.CONFIRMED)
                .registeredAt(now.minusDays(2))
                .build());

        Registration reg2 = registrationRepository.save(Registration.builder()
                .event(aiSeminar)
                .participant(participant)
                .status(RegistrationStatus.CONFIRMED)
                .registeredAt(now.minusDays(1))
                .build());

        Registration reg3 = registrationRepository.save(Registration.builder()
                .event(culturalFest)
                .participant(participant)
                .status(RegistrationStatus.CONFIRMED)
                .registeredAt(now.minusHours(12))
                .build());

        Registration reg4 = registrationRepository.save(Registration.builder()
                .event(cyberSeminar)
                .participant(participant)
                .status(RegistrationStatus.CONFIRMED)
                .registeredAt(now.minusHours(6))
                .build());

        Registration reg5 = registrationRepository.save(Registration.builder()
                .event(designWorkshop)
                .participant(participant)
                .status(RegistrationStatus.PENDING)
                .registeredAt(now.minusHours(3))
                .build());

        log.info("Seeded 5 demo registrations for participant.");

        // ===== TIMELINE ITEMS =====
        // Cloud Workshop timeline
        timelineItemRepository.save(TimelineItem.builder()
                .event(cloudWorkshop)
                .title("Registration Opens")
                .description("Online registration goes live for all students.")
                .type(TimelineItemType.REGISTRATION_OPEN)
                .startTime(now.minusDays(3))
                .createdByAdmin(admin)
                .build());

        timelineItemRepository.save(TimelineItem.builder()
                .event(cloudWorkshop)
                .title("Registration Deadline")
                .description("Last day to register for the workshop.")
                .type(TimelineItemType.REGISTRATION_DEADLINE)
                .startTime(now.plusDays(5).withHour(23).withMinute(59))
                .createdByAdmin(admin)
                .build());

        timelineItemRepository.save(TimelineItem.builder()
                .event(cloudWorkshop)
                .title("Workshop Begins — Docker Fundamentals")
                .description("Morning session covering Docker images, containers, and Dockerfile best practices.")
                .type(TimelineItemType.EVENT_START)
                .startTime(now.plusDays(7).withHour(10).withMinute(0))
                .endTime(now.plusDays(7).withHour(12).withMinute(30))
                .createdByAdmin(admin)
                .build());

        timelineItemRepository.save(TimelineItem.builder()
                .event(cloudWorkshop)
                .title("Kubernetes Hands-On Session")
                .description("Afternoon session on deploying applications to Kubernetes.")
                .type(TimelineItemType.ROUND)
                .startTime(now.plusDays(7).withHour(13).withMinute(30))
                .endTime(now.plusDays(7).withHour(16).withMinute(0))
                .createdByAdmin(admin)
                .build());

        // Cultural Fest timeline
        timelineItemRepository.save(TimelineItem.builder()
                .event(culturalFest)
                .title("Inauguration Ceremony")
                .description("Lamp lighting and welcome address by the Dean.")
                .type(TimelineItemType.EVENT_START)
                .startTime(now.plusDays(14).withHour(9).withMinute(0))
                .endTime(now.plusDays(14).withHour(10).withMinute(0))
                .createdByAdmin(admin)
                .build());

        timelineItemRepository.save(TimelineItem.builder()
                .event(culturalFest)
                .title("Dance Competition — Round 1")
                .description("Solo and duo dance performances. Top 10 advance to finals.")
                .type(TimelineItemType.ROUND)
                .startTime(now.plusDays(14).withHour(11).withMinute(0))
                .endTime(now.plusDays(14).withHour(14).withMinute(0))
                .createdByAdmin(admin)
                .build());

        timelineItemRepository.save(TimelineItem.builder()
                .event(culturalFest)
                .title("Music Night & Grand Finale")
                .description("Live band performance followed by prize distribution.")
                .type(TimelineItemType.EVENT_END)
                .startTime(now.plusDays(16).withHour(18).withMinute(0))
                .endTime(now.plusDays(16).withHour(22).withMinute(0))
                .createdByAdmin(admin)
                .build());

        // AI Seminar timeline
        timelineItemRepository.save(TimelineItem.builder()
                .event(aiSeminar)
                .title("Keynote: The Future of Generative AI")
                .description("Opening keynote by Dr. Priya Sharma on recent breakthroughs in generative AI.")
                .type(TimelineItemType.EVENT_START)
                .startTime(now.plusDays(10).withHour(14).withMinute(0))
                .endTime(now.plusDays(10).withHour(15).withMinute(0))
                .createdByAdmin(admin)
                .build());

        timelineItemRepository.save(TimelineItem.builder()
                .event(aiSeminar)
                .title("Panel Discussion: Ethics in AI")
                .description("Panel discussion with industry experts on responsible AI development.")
                .type(TimelineItemType.ROUND)
                .startTime(now.plusDays(10).withHour(15).withMinute(15))
                .endTime(now.plusDays(10).withHour(16).withMinute(30))
                .createdByAdmin(admin)
                .build());

        timelineItemRepository.save(TimelineItem.builder()
                .event(aiSeminar)
                .title("Q&A and Networking")
                .description("Open Q&A session followed by informal networking with speakers.")
                .type(TimelineItemType.EVENT_END)
                .startTime(now.plusDays(10).withHour(16).withMinute(30))
                .endTime(now.plusDays(10).withHour(17).withMinute(30))
                .createdByAdmin(admin)
                .build());

        log.info("Seeded demo timeline items.");

        // ===== NOTIFICATIONS =====
        // Notifications for participant
        createNotification(participant, cloudWorkshop.getId(), NotificationType.REGISTRATION_CONFIRMED,
                "Registration Confirmed",
                "Your registration for \"Cloud Native Development Workshop\" has been confirmed. See you on " +
                        cloudWorkshop.getStartTime().toLocalDate() + "!");

        createNotification(participant, aiSeminar.getId(), NotificationType.REGISTRATION_CONFIRMED,
                "Registration Confirmed",
                "You're all set for \"AI & Machine Learning: Future of Technology\". Don't forget to bring your questions for the panel!");

        createNotification(participant, culturalFest.getId(), NotificationType.REGISTRATION_CONFIRMED,
                "Registration Confirmed",
                "Welcome to Resonance 2025! Your registration for the Annual Cultural Festival is confirmed.");

        createNotification(participant, cyberSeminar.getId(), NotificationType.REGISTRATION_CONFIRMED,
                "Registration Confirmed",
                "You've registered for \"Cybersecurity Awareness\". The Zoom link will be shared before the event.");

        createNotification(participant, designWorkshop.getId(), NotificationType.REGISTRATION_PENDING,
                "Registration Pending Approval",
                "Your registration for \"UI/UX Design Sprint\" is pending admin approval. You'll be notified once reviewed.");

        createNotification(participant, cyberSeminar.getId(), NotificationType.EVENT_REMINDER,
                "Event Reminder",
                "\"Cybersecurity Awareness\" is happening in 5 days. Make sure to check the event details and keep the slot free!");

        // Notifications for admin
        createNotification(admin, cloudWorkshop.getId(), NotificationType.EVENT_PUBLISHED,
                "Event Published",
                "Your event \"Cloud Native Development Workshop\" is now live and accepting registrations.");

        createNotification(admin, aiSeminar.getId(), NotificationType.EVENT_PUBLISHED,
                "Event Published",
                "\"AI & Machine Learning: Future of Technology\" has been published successfully.");

        createNotification(admin, culturalFest.getId(), NotificationType.EVENT_PUBLISHED,
                "Event Published",
                "Resonance 2025 is now published! Registrations are open for all students.");

        createNotification(admin, null, NotificationType.REGISTRATION_CONFIRMED,
                "New Registration",
                "Participant has registered for \"Cloud Native Development Workshop\". Total registrations: 1.");

        // Notification for superadmin
        createNotification(superAdmin, null, NotificationType.ADMIN_APPLICATION_APPROVED,
                "Admin Application Approved",
                "Event Admin's application to become an Event Admin has been approved. They now have full event management access.");

        log.info("Seeded demo notifications.");
        log.info("Demo data seeding complete!");
    }

    private void cleanupDuplicateEvents() {
        List<Event> allEvents = eventRepository.findAll();
        if (allEvents.isEmpty()) return;

        Map<String, Event> primaryEvents = new HashMap<>();
        List<Event> duplicatesToDelete = new ArrayList<>();

        for (Event event : allEvents) {
            String titleKey = event.getTitle() != null ? event.getTitle().trim().toLowerCase() : "";
            String venueKey = event.getVenueName() != null ? event.getVenueName().trim().toLowerCase() : "";
            String timeKey = event.getStartTime() != null ? event.getStartTime().toString().substring(0, 16) : "";
            String dedupKey = titleKey + "__" + venueKey + "__" + timeKey;

            if (primaryEvents.containsKey(dedupKey)) {
                Event existing = primaryEvents.get(dedupKey);
                long existingRegs = registrationRepository.countByEvent(existing);
                long currentRegs = registrationRepository.countByEvent(event);

                if (currentRegs > existingRegs || (existing.getStatus() == EventStatus.CANCELLED && event.getStatus() != EventStatus.CANCELLED)) {
                    duplicatesToDelete.add(existing);
                    primaryEvents.put(dedupKey, event);
                } else {
                    duplicatesToDelete.add(event);
                }
            } else {
                primaryEvents.put(dedupKey, event);
            }
        }

        if (!duplicatesToDelete.isEmpty()) {
            log.info("Found {} duplicate event records in the database. Cleaning up...", duplicatesToDelete.size());
            for (Event dup : duplicatesToDelete) {
                try {
                    registrationRepository.deleteByEvent(dup);
                    timelineItemRepository.deleteByEvent(dup);
                    eventInviteRepository.deleteByEvent(dup);
                    eventChangeLogRepository.deleteByEvent(dup);
                    eventRepository.delete(dup);
                    log.info("Cleaned up duplicate event record: ID={}, Title='{}'", dup.getId(), dup.getTitle());
                } catch (Exception e) {
                    log.warn("Failed to delete duplicate event ID={}: {}", dup.getId(), e.getMessage());
                }
            }
        }
    }

    private void createNotification(User recipient, Long eventId, NotificationType type,
                                     String title, String message) {
        String messageId = "demo-" + UUID.randomUUID().toString();
        // Skip if a notification with this combination already exists (though UUID makes it unique)
        if (notificationRepository.existsByMessageId(messageId)) {
            return;
        }
        notificationRepository.save(Notification.builder()
                .messageId(messageId)
                .recipient(recipient)
                .eventId(eventId)
                .type(type)
                .title(title)
                .message(message)
                .channel(NotificationChannel.IN_APP)
                .status(NotificationStatus.SENT)
                .build());
    }
}
