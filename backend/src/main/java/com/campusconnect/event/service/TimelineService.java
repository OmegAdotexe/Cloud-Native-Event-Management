package com.campusconnect.event.service;

import com.campusconnect.event.dto.TimelineItemRequest;
import com.campusconnect.event.dto.TimelineItemResponse;
import com.campusconnect.event.model.*;
import com.campusconnect.event.repository.EventChangeLogRepository;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.event.repository.TimelineItemRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineService {

    private final TimelineItemRepository timelineItemRepository;
    private final EventRepository eventRepository;
    private final EventChangeLogRepository eventChangeLogRepository;
    private final ApplicationEventPublisher eventPublisher;

    public List<TimelineItemResponse> getTimelineForEvent(Long eventId, User requester) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        if (requester.getRole() == Role.PARTICIPANT && event.getStatus() != EventStatus.PUBLISHED) {
            throw new EntityNotFoundException("Event not found");
        }

        return timelineItemRepository.findByEventOrderByStartTimeAsc(event).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TimelineItemResponse createTimelineItem(Long eventId, TimelineItemRequest request, User requester) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        ensureOwnerOrSuperAdmin(event, requester);
        validateDates(request.getStartTime(), request.getEndTime());

        TimelineItem item = TimelineItem.builder()
                .event(event)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .createdByAdmin(requester)
                .build();

        item = timelineItemRepository.save(item);

        logChange(event, requester, "timelineItem:" + item.getTitle(), "N/A", item.getType() + " at " + item.getStartTime());

        if (event.getStatus() == EventStatus.PUBLISHED) {
            eventPublisher.publishEvent(new TimelineItemCreatedEvent(event.getId(), item.getId(), item.getTitle(), item.getType().name()));
        }

        return toResponse(item);
    }

    @Transactional
    public TimelineItemResponse updateTimelineItem(Long eventId, Long itemId, TimelineItemRequest request, User requester) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        ensureOwnerOrSuperAdmin(event, requester);
        validateDates(request.getStartTime(), request.getEndTime());

        TimelineItem item = timelineItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Timeline item not found"));

        if (!item.getEvent().getId().equals(event.getId())) {
            throw new IllegalArgumentException("Timeline item does not belong to this event");
        }

        String oldTitle = item.getTitle();
        String oldStartTime = item.getStartTime().toString();

        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setType(request.getType());
        item.setStartTime(request.getStartTime());
        item.setEndTime(request.getEndTime());

        item = timelineItemRepository.save(item);

        logChange(event, requester, "timelineItem:" + oldTitle, oldStartTime, item.getStartTime().toString());

        if (event.getStatus() == EventStatus.PUBLISHED) {
            eventPublisher.publishEvent(new TimelineItemUpdatedEvent(event.getId(), item.getId(), item.getTitle()));
        }

        return toResponse(item);
    }

    @Transactional
    public void deleteTimelineItem(Long eventId, Long itemId, User requester) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        ensureOwnerOrSuperAdmin(event, requester);

        TimelineItem item = timelineItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Timeline item not found"));

        if (!item.getEvent().getId().equals(event.getId())) {
            throw new IllegalArgumentException("Timeline item does not belong to this event");
        }

        timelineItemRepository.delete(item);

        logChange(event, requester, "timelineItem:" + item.getTitle(), item.getType() + " at " + item.getStartTime(), "DELETED");

        if (event.getStatus() == EventStatus.PUBLISHED) {
            eventPublisher.publishEvent(new TimelineItemDeletedEvent(event.getId(), item.getId(), item.getTitle()));
        }
    }

    private void ensureOwnerOrSuperAdmin(Event event, User requester) {
        if (requester.getRole() == Role.SUPER_ADMIN) return;
        if (requester.getRole() != Role.EVENT_ADMIN || !event.getCreatedBy().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this event's timeline");
        }
    }

    private void validateDates(LocalDateTime startTime, LocalDateTime endTime) {
        if (endTime != null && !endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
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

    private TimelineItemResponse toResponse(TimelineItem item) {
        return TimelineItemResponse.builder()
                .id(item.getId())
                .eventId(item.getEvent().getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .type(item.getType())
                .startTime(item.getStartTime())
                .endTime(item.getEndTime())
                .createdByAdminName(item.getCreatedByAdmin().getName())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
