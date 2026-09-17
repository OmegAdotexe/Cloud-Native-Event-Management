package com.campusconnect.analytics.controller;

import com.campusconnect.analytics.dto.AdminDashboardResponse;
import com.campusconnect.analytics.dto.EventAnalyticsResponse;
import com.campusconnect.analytics.dto.SuperAdminDashboardResponse;
import com.campusconnect.analytics.service.AnalyticsService;
import com.campusconnect.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('EVENT_ADMIN')")
    public ResponseEntity<AdminDashboardResponse> getAdminDashboard(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analyticsService.getAdminDashboard(user));
    }

    @GetMapping("/superadmin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SuperAdminDashboardResponse> getSuperAdminDashboard() {
        return ResponseEntity.ok(analyticsService.getSuperAdminDashboard());
    }

    @GetMapping("/events/{eventId}")
    @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<EventAnalyticsResponse> getEventAnalytics(
            @PathVariable Long eventId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analyticsService.getEventAnalytics(eventId, user));
    }
}
