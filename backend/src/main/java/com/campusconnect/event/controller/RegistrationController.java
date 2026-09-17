package com.campusconnect.event.controller;

import com.campusconnect.event.dto.RejectRegistrationRequest;
import com.campusconnect.event.dto.RegistrationResponse;
import com.campusconnect.event.model.RegistrationStatus;
import com.campusconnect.event.service.RegistrationService;
import com.campusconnect.user.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping("/{eventId}/registrations")
    public ResponseEntity<RegistrationResponse> registerForEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(registrationService.registerForEvent(eventId, user));
    }

    @PostMapping("/{eventId}/registrations/{id}/cancel")
    public ResponseEntity<RegistrationResponse> cancelRegistration(
            @PathVariable Long eventId,
            @PathVariable Long id,
            @RequestBody(required = false) com.campusconnect.event.dto.CancelRegistrationRequest request,
            @AuthenticationPrincipal User user) {
        String reason = (request != null) ? request.getReason() : null;
        return ResponseEntity.ok(registrationService.cancelRegistration(eventId, id, user, reason));
    }

    @PostMapping("/{eventId}/registrations/{id}/approve")
    public ResponseEntity<RegistrationResponse> approveRegistration(
            @PathVariable Long eventId,
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(registrationService.approveRegistration(eventId, id, user));
    }

    @PostMapping("/{eventId}/registrations/{id}/reject")
    public ResponseEntity<RegistrationResponse> rejectRegistration(
            @PathVariable Long eventId,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) RejectRegistrationRequest request,
            @AuthenticationPrincipal User user) {
        String reason = (request != null) ? request.getReason() : null;
        return ResponseEntity.ok(registrationService.rejectRegistration(eventId, id, user, reason));
    }

    @GetMapping("/{eventId}/registrations")
    public ResponseEntity<Page<RegistrationResponse>> getEventRegistrations(
            @PathVariable Long eventId,
            @RequestParam(required = false) RegistrationStatus status,
            Pageable pageable,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(registrationService.getEventRegistrations(eventId, status, pageable, user));
    }

    @GetMapping(value = "/{eventId}/registrations/export", produces = "text/csv")
    public ResponseEntity<String> exportRegistrationsCsv(
            @PathVariable Long eventId,
            @AuthenticationPrincipal User user) {
        String csv = registrationService.exportRegistrationsCsv(eventId, user);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"registrations_" + eventId + ".csv\"")
                .body(csv);
    }
}
