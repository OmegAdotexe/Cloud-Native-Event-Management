package com.campusconnect.event.service;

import com.campusconnect.event.dto.CreateEventRequest;
import com.campusconnect.event.dto.EventResponse;
import com.campusconnect.event.dto.UpdateEventRequest;
import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {
    private final EventRepository eventRepository;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request, User creator) {
        validateDates(request.getStartTime(), request.getEndTime());
        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .venue(request.getVenue())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .capacity(request.getCapacity())
                .status(request.getStatus() == null ? EventStatus.DRAFT : request.getStatus())
                .createdBy(creator)
                .build();
        return toResponse(eventRepository.save(event));
    }

    public List<EventResponse> getAllEvents(User requester) {
        List<Event> events = requester.getRole() == Role.PARTICIPANT
                ? eventRepository.findByStatusOrderByStartTimeAsc(EventStatus.PUBLISHED)
                : eventRepository.findAllByOrderByStartTimeAsc();
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
        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getVenue() != null) event.setVenue(request.getVenue());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());
        if (request.getCapacity() != null) event.setCapacity(request.getCapacity());
        if (request.getStatus() != null) event.setStatus(request.getStatus());
        validateDates(event.getStartTime(), event.getEndTime());
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
    public EventResponse cancelEvent(Long id, User requester) {
        Event event = findEvent(id);
        ensureOwnerOrSuperAdmin(event, requester);
        event.setStatus(EventStatus.CANCELLED);
        return toResponse(event);
    }

    @Transactional
    public void deleteEvent(Long id, User requester) {
        Event event = findEvent(id);
        ensureOwnerOrSuperAdmin(event, requester);
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

    private EventResponse toResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .venue(event.getVenue())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .capacity(event.getCapacity())
                .status(event.getStatus())
                .createdByName(event.getCreatedBy().getName())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
