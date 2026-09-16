package com.campusconnect.event.controller;

import com.campusconnect.event.dto.RegistrationResponse;
import com.campusconnect.event.service.RegistrationService;
import com.campusconnect.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/participants/me/registrations")
@RequiredArgsConstructor
public class ParticipantRegistrationController {

    private final RegistrationService registrationService;

    @GetMapping
    public ResponseEntity<List<RegistrationResponse>> getMyRegistrations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(registrationService.getMyRegistrations(user));
    }
}
