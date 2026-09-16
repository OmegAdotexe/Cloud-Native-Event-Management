package com.campusconnect.event.controller;

import com.campusconnect.event.dto.TimelineItemRequest;
import com.campusconnect.event.dto.TimelineItemResponse;
import com.campusconnect.event.service.TimelineService;
import com.campusconnect.user.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping
    public ResponseEntity<List<TimelineItemResponse>> getTimeline(@PathVariable Long eventId,
                                                                  @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(timelineService.getTimelineForEvent(eventId, user));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<TimelineItemResponse> createTimelineItem(@PathVariable Long eventId,
                                                                   @Valid @RequestBody TimelineItemRequest request,
                                                                   @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(timelineService.createTimelineItem(eventId, request, user));
    }

    @PutMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<TimelineItemResponse> updateTimelineItem(@PathVariable Long eventId,
                                                                   @PathVariable Long itemId,
                                                                   @Valid @RequestBody TimelineItemRequest request,
                                                                   @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(timelineService.updateTimelineItem(eventId, itemId, request, user));
    }

    @DeleteMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTimelineItem(@PathVariable Long eventId,
                                                   @PathVariable Long itemId,
                                                   @AuthenticationPrincipal User user) {
        timelineService.deleteTimelineItem(eventId, itemId, user);
        return ResponseEntity.noContent().build();
    }
}
