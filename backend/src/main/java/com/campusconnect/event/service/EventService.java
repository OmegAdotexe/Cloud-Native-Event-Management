package com.campusconnect.event.service;

import com.campusconnect.event.dto.CancelEventRequest;
import com.campusconnect.event.dto.CreateEventRequest;
import com.campusconnect.event.dto.EventResponse;
import com.campusconnect.event.dto.ReassignEventRequest;
import com.campusconnect.event.dto.UpdateEventRequest;
import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventCategory;
import com.campusconnect.event.model.EventChangeLog;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.RegistrationMode;
import com.campusconnect.event.repository.EventChangeLogRepository;
import com.campusconnect.event.repository.EventInviteRepository;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.event.repository.RegistrationRepository;
import com.campusconnect.event.repository.TimelineItemRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import com.campusconnect.event.model.*;
import com.campusconnect.event.repository.RegistrationRepository;
import java.util.Map;
import java.util.HashMap;
import java.util.EnumMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class EventService {
    private final EventRepository eventRepository;
    private final EventChangeLogRepository eventChangeLogRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final RegistrationRepository registrationRepository;
    private final TimelineItemRepository timelineItemRepository;
    private final EventInviteRepository eventInviteRepository;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request, User creator) {
        validateDates(request.getStartTime(), request.getEndTime());
        validateRegistrationDeadline(request.getRegistrationDeadline(), request.getStartTime());
        validateVirtualLink(request.isVirtual(), request.getVirtualLink());

        // Concurrency Guard: Use PostgreSQL transaction-level advisory lock to serialize simultaneous duplicate attempts
        String lockKey = creator.getId() + ":" + request.getTitle().trim().toLowerCase() + ":" 
                + (request.getVenueName() != null ? request.getVenueName().trim().toLowerCase() : "") + ":" 
                + (request.getStartTime() != null ? request.getStartTime().toString() : "");
        try {
            entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(hashtext(?1))")
                    .setParameter(1, lockKey)
                    .getSingleResult();
        } catch (Exception e) {
            log.debug("Advisory lock bypassed (non-PostgreSQL or test environment): {}", e.getMessage());
        }

        // Accidental duplicate prevention
        List<Event> duplicates = eventRepository.findDuplicates(
                creator, request.getTitle(), request.getVenueName(), request.getStartTime());
        if (!duplicates.isEmpty()) {
            Event existing = duplicates.get(0);
            throw new IllegalStateException("An identical active event with this title, venue, and start time already exists (Event ID: " + existing.getId() + "). If this is a separate session, please update the title or schedule.");
        }

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .venueName(request.getVenueName())
                .isVirtual(request.isVirtual())
                .virtualLink(request.getVirtualLink())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .registrationDeadline(request.getRegistrationDeadline())
                .capacity(request.getCapacity())
                .status(request.getStatus() == null ? EventStatus.DRAFT : request.getStatus())
                .registrationMode(request.getRegistrationMode() == null ? RegistrationMode.OPEN : request.getRegistrationMode())
                .category(request.getCategory() == null ? EventCategory.OTHER : request.getCategory())
                .waitlistEnabled(request.isWaitlistEnabled())
                .institutionalOnly(request.isInstitutionalOnly())
                .coverImageUrl(request.getCoverImageUrl())
                .createdBy(creator)
                .build();
        return toResponse(eventRepository.save(event));
    }

    public List<EventResponse> getAllEvents(User requester) {
        return getAllEvents(requester, null);
    }

    public List<EventResponse> getAllEvents(User requester, EventCategory category) {
        List<Event> events;
        if (category != null) {
            if (requester.getRole() == Role.PARTICIPANT) {
                events = eventRepository.findByStatusAndCategoryOrderByStartTimeAsc(EventStatus.PUBLISHED, category);
            } else {
                events = eventRepository.findByCategoryOrderByStartTimeAsc(category);
            }
        } else {
            if (requester.getRole() == Role.PARTICIPANT) {
                events = eventRepository.findByStatusOrderByStartTimeAsc(EventStatus.PUBLISHED);
            } else {
                events = eventRepository.findAllByOrderByStartTimeAsc();
            }
        }
        return buildEventResponses(events);
    }

    public List<EventResponse> getPublishedEvents(EventCategory category) {
        List<Event> events = (category != null)
                ? eventRepository.findByStatusAndCategoryOrderByStartTimeAsc(EventStatus.PUBLISHED, category)
                : eventRepository.findByStatusOrderByStartTimeAsc(EventStatus.PUBLISHED);
        return buildEventResponses(events);
    }

    public java.util.Map<String, Long> getCategoryStats() {
        java.util.Map<String, Long> stats = new java.util.LinkedHashMap<>();
        for (EventCategory cat : EventCategory.values()) {
            stats.put(cat.name(), 0L);
        }
        List<Object[]> rows = eventRepository.countEventsByStatusGroupByCategory(EventStatus.PUBLISHED);
        long total = 0L;
        for (Object[] row : rows) {
            if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                EventCategory cat = (EventCategory) row[0];
                Long count = ((Number) row[1]).longValue();
                stats.put(cat.name(), count);
                total += count;
            }
        }
        stats.put("TOTAL", total);
        return stats;
    }

    public EventResponse getEventById(Long id, User requester) {
        Event event = findEvent(id);
        if (requester.getRole() == Role.PARTICIPANT && event.getStatus() != EventStatus.PUBLISHED) {
            throw new EntityNotFoundException("Event not found: " + id);
        }
        return toResponse(event);
    }

    @Transactional
    public EventResponse updateEvent(Long id, UpdateEventRequest request, User requester) {
        Event event = findEvent(id);
        ensureOwnerOrSuperAdmin(event, requester);

        // Snapshot tracked fields before applying changes
        String oldVenue = event.getVenueName();
        String oldStartTime = event.getStartTime().toString();
        String oldEndTime = event.getEndTime().toString();
        String oldStatus = event.getStatus().name();

        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getVenueName() != null) event.setVenueName(request.getVenueName());
        if (request.getIsVirtual() != null) event.setIsVirtual(request.getIsVirtual());
        if (request.getVirtualLink() != null) event.setVirtualLink(request.getVirtualLink());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());
        if (request.getRegistrationDeadline() != null) event.setRegistrationDeadline(request.getRegistrationDeadline());
        if (request.getCapacity() != null) event.setCapacity(request.getCapacity());
        if (request.getStatus() != null) event.setStatus(request.getStatus());
        if (request.getRegistrationMode() != null) event.setRegistrationMode(request.getRegistrationMode());
        if (request.getCategory() != null) event.setCategory(request.getCategory());
        if (request.getWaitlistEnabled() != null) event.setWaitlistEnabled(request.getWaitlistEnabled());
        if (request.getInstitutionalOnly() != null) event.setInstitutionalOnly(request.getInstitutionalOnly());
        if (request.getCoverImageUrl() != null) event.setCoverImageUrl(request.getCoverImageUrl());
        validateDates(event.getStartTime(), event.getEndTime());
        validateRegistrationDeadline(event.getRegistrationDeadline(), event.getStartTime());
        validateVirtualLink(event.getIsVirtual(), event.getVirtualLink());

        // Log changes for tracked fields
        java.util.Map<String, String> changes = new java.util.HashMap<>();
        
        if (!Objects.equals(oldVenue, event.getVenueName())) {
            logChange(event, requester, "venue", oldVenue, event.getVenueName());
            changes.put("venue", event.getVenueName());
        }
        if (!Objects.equals(oldStartTime, event.getStartTime().toString())) {
            logChange(event, requester, "startTime", oldStartTime, event.getStartTime().toString());
            changes.put("startTime", event.getStartTime().toString());
        }
        if (!Objects.equals(oldEndTime, event.getEndTime().toString())) {
            logChange(event, requester, "endTime", oldEndTime, event.getEndTime().toString());
            changes.put("endTime", event.getEndTime().toString());
        }
        if (!Objects.equals(oldStatus, event.getStatus().name())) {
            logChange(event, requester, "status", oldStatus, event.getStatus().name());
            changes.put("status", event.getStatus().name());
        }
        
        if (!changes.isEmpty() && event.getStatus() == EventStatus.PUBLISHED) {
            eventPublisher.publishEvent(new EventUpdatedEvent(event.getId(), event.getTitle(), changes));
        }

        return toResponse(event);
    }

    @Transactional
    public EventResponse reassignEvent(Long id, ReassignEventRequest request, User requester) {
        if (requester.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Only SUPER_ADMIN can reassign events");
        }
        Event event = findEvent(id);
        User newAdmin = userRepository.findById(request.getNewEventAdminId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getNewEventAdminId()));
        if (newAdmin.getRole() != Role.EVENT_ADMIN && newAdmin.getRole() != Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Assigned user must be an event admin or super admin");
        }
        String oldAdmin = event.getCreatedBy().getName();
        event.setCreatedBy(newAdmin);
        logChange(event, requester, "createdBy", oldAdmin, newAdmin.getName());
        return toResponse(event);
    }

    @Transactional
    public EventResponse publishEvent(Long id, User requester) {
        Event event = findEvent(id);
        ensureOwnerOrSuperAdmin(event, requester);
        
        if (event.getStatus() != EventStatus.PUBLISHED) {
            event.setStatus(EventStatus.PUBLISHED);
            eventPublisher.publishEvent(new EventPublishedEvent(event.getId(), event.getTitle()));
        }
        
        return toResponse(event);
    }

    @Transactional
    public EventResponse cancelEvent(Long id, CancelEventRequest request, User requester) {
        Event event = findEvent(id);
        ensureOwnerOrSuperAdmin(event, requester);
        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Event is already cancelled");
        }
        String oldStatus = event.getStatus().name();
        event.setStatus(EventStatus.CANCELLED);
        event.setCancelledReason(request.getReason());
        event.setCancelledAt(LocalDateTime.now());
        logChange(event, requester, "status", oldStatus, "CANCELLED");
        
        eventPublisher.publishEvent(new EventCancelledEvent(event.getId(), event.getTitle(), request.getReason()));
        
        return toResponse(event);
    }

    @Transactional
    public void deleteEvent(Long id, User requester) {
        Event event = findEvent(id);
        ensureOwnerOrSuperAdmin(event, requester);
        registrationRepository.deleteByEvent(event);
        timelineItemRepository.deleteByEvent(event);
        eventInviteRepository.deleteByEvent(event);
        eventChangeLogRepository.deleteByEvent(event);
        eventRepository.delete(event);
    }

    private Event findEvent(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + id));
    }

    private void ensureOwnerOrSuperAdmin(Event event, User requester) {
        if (requester.getRole() == Role.SUPER_ADMIN) return;
        if (requester.getRole() != Role.EVENT_ADMIN || !event.getCreatedBy().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this event");
        }
    }

    private void validateDates(LocalDateTime startTime, LocalDateTime endTime) {
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
    }

    private void validateRegistrationDeadline(LocalDateTime registrationDeadline, LocalDateTime startTime) {
        if (!registrationDeadline.isBefore(startTime)) {
            throw new IllegalArgumentException("Registration deadline must be before start time");
        }
    }

    private void validateVirtualLink(boolean isVirtual, String virtualLink) {
        if (isVirtual && (virtualLink == null || virtualLink.isBlank())) {
            throw new IllegalArgumentException("Virtual link is required for virtual events");
        }
    }

    private void logChange(Event event, User changedBy, String fieldName, String oldValue, String newValue) {
        if (!Objects.equals(oldValue, newValue)) {
            eventChangeLogRepository.save(EventChangeLog.builder()
                    .event(event)
                    .fieldName(fieldName)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .changedByAdmin(changedBy)
                    .build());
        }
    }

    private List<EventResponse> buildEventResponses(List<Event> events) {
        if (events == null || events.isEmpty()) {
            return List.of();
        }
        List<Long> eventIds = events.stream().map(Event::getId).toList();
        List<RegistrationRepository.EventRegistrationCountSummary> summaries =
                registrationRepository.countRegistrationsByEventIds(eventIds);

        Map<Long, Map<RegistrationStatus, Long>> statsMap = new HashMap<>();
        for (RegistrationRepository.EventRegistrationCountSummary s : summaries) {
            statsMap.computeIfAbsent(s.getEventId(), k -> new EnumMap<>(RegistrationStatus.class))
                    .put(s.getStatus(), s.getCount());
        }

        return events.stream()
                .map(event -> toResponseWithCounts(event, statsMap.getOrDefault(event.getId(), Map.of())))
                .toList();
    }

    private EventResponse toResponseWithCounts(Event event, Map<RegistrationStatus, Long> counts) {
        long confirmed = counts.getOrDefault(RegistrationStatus.CONFIRMED, 0L);
        long pending = counts.getOrDefault(RegistrationStatus.PENDING, 0L);
        long rejected = counts.getOrDefault(RegistrationStatus.REJECTED, 0L);
        long cancelled = counts.getOrDefault(RegistrationStatus.CANCELLED, 0L);
        int totalCap = event.getCapacity() != null ? event.getCapacity() : 0;
        int available = Math.max(0, totalCap - (int) confirmed);

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .venueName(event.getVenueName())
                .isVirtual(Boolean.TRUE.equals(event.getIsVirtual()))
                .virtualLink(event.getVirtualLink())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .registrationDeadline(event.getRegistrationDeadline())
                .capacity(event.getCapacity())
                .status(event.getStatus())
                .registrationMode(event.getRegistrationMode())
                .category(event.getCategory())
                .waitlistEnabled(Boolean.TRUE.equals(event.getWaitlistEnabled()))
                .institutionalOnly(Boolean.TRUE.equals(event.getInstitutionalOnly()))
                .coverImageUrl(event.getCoverImageUrl())
                .cancelledReason(event.getCancelledReason())
                .cancelledAt(event.getCancelledAt())
                .createdByName(event.getCreatedBy() != null ? event.getCreatedBy().getName() : null)
                .createdById(event.getCreatedBy() != null ? event.getCreatedBy().getId() : null)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .confirmedRegistrations(confirmed)
                .pendingRegistrations(pending)
                .rejectedRegistrations(rejected)
                .cancelledRegistrations(cancelled)
                .availableCapacity(available)
                .totalCapacity(totalCap)
                .build();
    }

    private EventResponse toResponse(Event event) {
        long confirmed = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CONFIRMED);
        long pending = registrationRepository.countByEventAndStatus(event, RegistrationStatus.PENDING);
        long rejected = registrationRepository.countByEventAndStatus(event, RegistrationStatus.REJECTED);
        long cancelled = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CANCELLED);
        int totalCap = event.getCapacity() != null ? event.getCapacity() : 0;
        int available = Math.max(0, totalCap - (int) confirmed);

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .venueName(event.getVenueName())
                .isVirtual(Boolean.TRUE.equals(event.getIsVirtual()))
                .virtualLink(event.getVirtualLink())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .registrationDeadline(event.getRegistrationDeadline())
                .capacity(event.getCapacity())
                .status(event.getStatus())
                .registrationMode(event.getRegistrationMode())
                .category(event.getCategory())
                .waitlistEnabled(Boolean.TRUE.equals(event.getWaitlistEnabled()))
                .institutionalOnly(Boolean.TRUE.equals(event.getInstitutionalOnly()))
                .coverImageUrl(event.getCoverImageUrl())
                .cancelledReason(event.getCancelledReason())
                .cancelledAt(event.getCancelledAt())
                .createdByName(event.getCreatedBy() != null ? event.getCreatedBy().getName() : null)
                .createdById(event.getCreatedBy() != null ? event.getCreatedBy().getId() : null)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .confirmedRegistrations(confirmed)
                .pendingRegistrations(pending)
                .rejectedRegistrations(rejected)
                .cancelledRegistrations(cancelled)
                .availableCapacity(available)
                .totalCapacity(totalCap)
                .build();
    }
}
