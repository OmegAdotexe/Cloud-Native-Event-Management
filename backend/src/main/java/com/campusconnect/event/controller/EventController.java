package com.campusconnect.event.controller;

import com.campusconnect.event.dto.CancelEventRequest;
import com.campusconnect.event.dto.CreateEventRequest;
import com.campusconnect.event.dto.EventResponse;
import com.campusconnect.event.dto.ReassignEventRequest;
import com.campusconnect.event.dto.UpdateEventRequest;
import com.campusconnect.event.model.EventCategory;
import com.campusconnect.event.service.EventService;
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
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @PostMapping
    @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<EventResponse> create(@Valid @RequestBody CreateEventRequest request,
                                                 @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(request, user));
    }

    @GetMapping
    public ResponseEntity<List<EventResponse>> getAll(@RequestParam(required = false) EventCategory category,
                                                      @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.getAllEvents(user, category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.getEventById(id, user));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<EventResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateEventRequest request,
                                                 @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.updateEvent(id, request, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        eventService.deleteEvent(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<EventResponse> publish(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.publishEvent(id, user));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<EventResponse> cancel(@PathVariable Long id, @Valid @RequestBody CancelEventRequest request,
                                                 @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.cancelEvent(id, request, user));
    }

    @PatchMapping("/{id}/reassign")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<EventResponse> reassign(@PathVariable Long id,
                                                  @Valid @RequestBody ReassignEventRequest request,
                                                  @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.reassignEvent(id, request, user));
    }
}
