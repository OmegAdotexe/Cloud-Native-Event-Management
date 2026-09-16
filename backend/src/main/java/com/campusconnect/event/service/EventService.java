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
import com.campusconnect.event.repository.EventRepository;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {
    private final EventRepository eventRepository;
    private final EventChangeLogRepository eventChangeLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request, User creator) {
        validateDates(request.getStartTime(), request.getEndTime());
        validateRegistrationDeadline(request.getRegistrationDeadline(), request.getStartTime());
        validateVirtualLink(request.isVirtual(), request.getVirtualLink());
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
            events = requester.getRole() == Role.PARTICIPANT
                    ? eventRepository.findByStatusAndCategoryOrderByStartTimeAsc(EventStatus.PUBLISHED, category)
                    : eventRepository.findByCategoryOrderByStartTimeAsc(category);
        } else {
            events = requester.getRole() == Role.PARTICIPANT
                    ? eventRepository.findByStatusOrderByStartTimeAsc(EventStatus.PUBLISHED)
                    : eventRepository.findAllByOrderByStartTimeAsc();
        }
        return events.stream().map(this::toResponse).toList();
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
        validateDates(event.getStartTime(), event.getEndTime());
        validateRegistrationDeadline(event.getRegistrationDeadline(), event.getStartTime());
        validateVirtualLink(event.getIsVirtual(), event.getVirtualLink());

        // Log changes for tracked fields
        logChange(event, requester, "venue", oldVenue, event.getVenueName());
        logChange(event, requester, "startTime", oldStartTime, event.getStartTime().toString());
        logChange(event, requester, "endTime", oldEndTime, event.getEndTime().toString());
        logChange(event, requester, "status", oldStatus, event.getStatus().name());

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
        event.setStatus(EventStatus.PUBLISHED);
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
        return toResponse(event);
    }

    @Transactional
    public void deleteEvent(Long id, User requester) {
        Event event = findEvent(id);
        ensureOwnerOrSuperAdmin(event, requester);
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

    private EventResponse toResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .venueName(event.getVenueName())
                .isVirtual(event.getIsVirtual())
                .virtualLink(event.getVirtualLink())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .registrationDeadline(event.getRegistrationDeadline())
                .capacity(event.getCapacity())
                .status(event.getStatus())
                .registrationMode(event.getRegistrationMode())
                .category(event.getCategory())
                .waitlistEnabled(event.getWaitlistEnabled())
                .cancelledReason(event.getCancelledReason())
                .cancelledAt(event.getCancelledAt())
                .createdByName(event.getCreatedBy().getName())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
