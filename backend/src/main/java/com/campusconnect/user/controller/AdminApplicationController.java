package com.campusconnect.user.controller;

import com.campusconnect.user.dto.AdminApplicationDecisionRequest;
import com.campusconnect.user.dto.AdminApplicationRequest;
import com.campusconnect.user.dto.AdminApplicationResponse;
import com.campusconnect.user.dto.AdminApplicationStatsResponse;
import com.campusconnect.user.model.AdminApplicationAudit;
import com.campusconnect.user.model.AdminApplicationStatus;
import com.campusconnect.user.model.User;
import com.campusconnect.user.service.AdminApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin-applications")
@RequiredArgsConstructor
public class AdminApplicationController {

    private final AdminApplicationService applicationService;

    @PostMapping("/apply")
    public ResponseEntity<AdminApplicationResponse> apply(
            @Valid @RequestBody AdminApplicationRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(applicationService.submitApplication(request, user));
    }

    @GetMapping("/status")
    public ResponseEntity<AdminApplicationResponse> getMyStatus(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.getMyApplicationStatus(user));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<AdminApplicationResponse>> getApplications(
            @RequestParam(required = false) AdminApplicationStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort,
            @AuthenticationPrincipal User user) {

        Sort sorting = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort.length >= 2) {
            sorting = Sort.by(Sort.Direction.fromString(sort[1]), sort[0]);
        }
        return ResponseEntity.ok(applicationService.getApplications(
                status, search, PageRequest.of(page, size, sorting), user));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminApplicationStatsResponse> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.getStats(user));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminApplicationResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.getApplicationById(id, user));
    }

    @GetMapping("/{id}/audits")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AdminApplicationAudit>> getAudits(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.getApplicationAudits(id, user));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminApplicationResponse> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.approveApplication(id, user));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminApplicationResponse> reject(
            @PathVariable Long id,
            @RequestBody AdminApplicationDecisionRequest request,
            @AuthenticationPrincipal User user) {
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(applicationService.rejectApplication(id, reason, user));
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminApplicationResponse> revoke(
            @PathVariable Long id,
            @RequestBody(required = false) AdminApplicationDecisionRequest request,
            @AuthenticationPrincipal User user) {
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(applicationService.revokePrivileges(id, reason, user));
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminApplicationResponse> suspend(
            @PathVariable Long id,
            @RequestBody(required = false) AdminApplicationDecisionRequest request,
            @AuthenticationPrincipal User user) {
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(applicationService.suspendAdmin(id, reason, user));
    }
}
