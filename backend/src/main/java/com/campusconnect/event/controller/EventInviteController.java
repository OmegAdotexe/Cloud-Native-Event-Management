package com.campusconnect.event.controller;

import com.campusconnect.event.dto.CreateInvitesRequest;
import com.campusconnect.event.service.EventInviteService;
import com.campusconnect.user.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventInviteController {

    private final EventInviteService eventInviteService;

    @PostMapping("/{eventId}/invites")
    public ResponseEntity<Void> createInvites(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateInvitesRequest request,
            @AuthenticationPrincipal User user) {
        eventInviteService.createInvites(eventId, request, user);
        return ResponseEntity.ok().build();
    }
}
