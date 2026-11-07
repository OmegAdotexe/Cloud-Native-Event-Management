package com.campusconnect.user.service;

import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.notification.messaging.NotificationProducer;
import com.campusconnect.notification.model.NotificationChannel;
import com.campusconnect.notification.model.NotificationType;
import com.campusconnect.user.dto.AdminApplicationRequest;
import com.campusconnect.user.dto.AdminApplicationResponse;
import com.campusconnect.user.dto.AdminApplicationStatsResponse;
import com.campusconnect.user.model.AdminApplication;
import com.campusconnect.user.model.AdminApplicationAudit;
import com.campusconnect.user.model.AdminApplicationStatus;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.AdminApplicationAuditRepository;
import com.campusconnect.user.repository.AdminApplicationRepository;
import com.campusconnect.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminApplicationService {

    private final AdminApplicationRepository applicationRepository;
    private final AdminApplicationAuditRepository auditRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final NotificationProducer notificationProducer;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AdminApplicationResponse submitApplication(AdminApplicationRequest req, User applicant) {
        if (applicant == null) {
            if (req.getEmail() == null || req.getEmail().isBlank()) {
                throw new IllegalArgumentException("Email is required to register as an event organizer.");
            }
            String email = req.getEmail().trim().toLowerCase();
            applicant = userRepository.findByEmail(email).orElseGet(() -> {
                if (req.getPassword() == null || req.getPassword().isBlank()) {
                    throw new IllegalArgumentException("Password is required to register as an event organizer.");
                }
                User newUser = User.builder()
                        .name(req.getFullName().trim())
                        .email(email)
                        .password(passwordEncoder.encode(req.getPassword()))
                        .role(Role.PARTICIPANT) // Zero privilege escalation: starts as PARTICIPANT
                        .department(req.getDepartment().trim())
                        .status("ACTIVE")
                        .authProvider("LOCAL")
                        .build();
                return userRepository.save(newUser);
            });
        }

        if (applicant.getRole() == Role.EVENT_ADMIN || applicant.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalStateException("Your account already holds administrative privileges.");
        }

        if (applicationRepository.existsByUserIdAndStatus(applicant.getId(), AdminApplicationStatus.PENDING_APPROVAL)) {
            throw new IllegalStateException("You already have an active Event Admin application pending review.");
        }

        AdminApplication application = AdminApplication.builder()
                .user(applicant)
                .fullName(req.getFullName().trim())
                .email(applicant.getEmail())
                .department(req.getDepartment().trim())
                .phoneNumber(req.getPhoneNumber().trim())
                .organizationRole(req.getOrganizationRole() != null ? req.getOrganizationRole().trim() : null)
                .statement(req.getStatement() != null ? req.getStatement().trim() : null)
                .status(AdminApplicationStatus.PENDING_APPROVAL)
                .build();

        AdminApplication saved = applicationRepository.save(application);

        // Audit log
        auditRepository.save(AdminApplicationAudit.builder()
                .application(saved)
                .actor(applicant)
                .action("SUBMITTED")
                .notes("Application submitted for department: " + saved.getDepartment())
                .build());

        // Notify Super Admins
        List<User> superAdmins = userRepository.findByRole(Role.SUPER_ADMIN);
        for (User sa : superAdmins) {
            notificationProducer.sendDirectNotification(
                    sa.getId(),
                    null,
                    NotificationType.ADMIN_APPLICATION_SUBMITTED,
                    "New Event Admin Application",
                    "New organizer request submitted by " + saved.getFullName() + " (" + saved.getDepartment() + "). Click to review.",
                    NotificationChannel.IN_APP
            );
        }

        // Notify Applicant
        notificationProducer.sendDirectNotification(
                applicant.getId(),
                null,
                NotificationType.ADMIN_APPLICATION_RECEIVED,
                "Application Received",
                "Your application for Event Admin in " + saved.getDepartment() + " has been received and is pending Super Admin review.",
                NotificationChannel.IN_APP
        );

        return toResponse(saved);
    }

    public AdminApplicationResponse getMyApplicationStatus(User applicant) {
        return applicationRepository.findFirstByUserIdOrderByCreatedAtDesc(applicant.getId())
                .map(this::toResponse)
                .orElse(null);
    }

    public Page<AdminApplicationResponse> getApplications(AdminApplicationStatus status, String search, Pageable pageable, User requester) {
        ensureSuperAdmin(requester);
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return applicationRepository.searchApplications(status, searchParam, pageable)
                .map(this::toResponse);
    }

    public AdminApplicationResponse getApplicationById(Long id, User requester) {
        ensureSuperAdmin(requester);
        AdminApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Application not found: " + id));
        return toResponse(app);
    }

    public List<AdminApplicationAudit> getApplicationAudits(Long id, User requester) {
        ensureSuperAdmin(requester);
        return auditRepository.findByApplicationIdOrderByCreatedAtDesc(id);
    }

    @Transactional
    public synchronized AdminApplicationResponse approveApplication(Long id, User superAdmin) {
        ensureSuperAdmin(superAdmin);
        AdminApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Application not found: " + id));

        if (app.getStatus() != AdminApplicationStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Application is not in PENDING_APPROVAL status (Current: " + app.getStatus() + ")");
        }

        app.setStatus(AdminApplicationStatus.APPROVED);
        app.setReviewedBy(superAdmin);
        app.setReviewedAt(LocalDateTime.now());
        app.setRejectionReason(null);
        AdminApplication saved = applicationRepository.save(app);

        // Elevate user role
        User applicantUser = app.getUser();
        applicantUser.setRole(Role.EVENT_ADMIN);
        applicantUser.setDepartment(app.getDepartment());
        userRepository.save(applicantUser);

        // Audit log
        auditRepository.save(AdminApplicationAudit.builder()
                .application(saved)
                .actor(superAdmin)
                .action("APPROVED")
                .notes("Approved by " + superAdmin.getName() + " (" + superAdmin.getEmail() + ")")
                .build());

        // Notify Applicant
        notificationProducer.sendDirectNotification(
                applicantUser.getId(),
                null,
                NotificationType.ADMIN_APPLICATION_APPROVED,
                "Event Admin Application Approved",
                "Congratulations! Your Event Admin request for " + app.getDepartment() + " has been approved. You can now create and manage campus events.",
                NotificationChannel.IN_APP
        );

        log.info("Admin application #{} approved for user {} by {}", id, applicantUser.getEmail(), superAdmin.getEmail());
        return toResponse(saved);
    }

    @Transactional
    public synchronized AdminApplicationResponse rejectApplication(Long id, String reason, User superAdmin) {
        ensureSuperAdmin(superAdmin);
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason is required.");
        }

        AdminApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Application not found: " + id));

        if (app.getStatus() != AdminApplicationStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Application is not in PENDING_APPROVAL status (Current: " + app.getStatus() + ")");
        }

        app.setStatus(AdminApplicationStatus.REJECTED);
        app.setReviewedBy(superAdmin);
        app.setReviewedAt(LocalDateTime.now());
        app.setRejectionReason(reason.trim());
        AdminApplication saved = applicationRepository.save(app);

        // Ensure user remains PARTICIPANT
        User applicantUser = app.getUser();
        if (applicantUser.getRole() == Role.EVENT_ADMIN) {
            applicantUser.setRole(Role.PARTICIPANT);
            userRepository.save(applicantUser);
        }

        // Audit log
        auditRepository.save(AdminApplicationAudit.builder()
                .application(saved)
                .actor(superAdmin)
                .action("REJECTED")
                .notes("Rejected by " + superAdmin.getName() + ". Reason: " + reason.trim())
                .build());

        // Notify Applicant
        notificationProducer.sendDirectNotification(
                applicantUser.getId(),
                null,
                NotificationType.ADMIN_APPLICATION_REJECTED,
                "Event Admin Application Declined",
                "Your application for Event Admin in " + app.getDepartment() + " was declined. Reason: " + reason.trim(),
                NotificationChannel.IN_APP
        );

        log.info("Admin application #{} rejected for user {} by {}. Reason: {}", id, applicantUser.getEmail(), superAdmin.getEmail(), reason);
        return toResponse(saved);
    }

    @Transactional
    public synchronized AdminApplicationResponse revokePrivileges(Long id, String reason, User superAdmin) {
        ensureSuperAdmin(superAdmin);
        AdminApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Application not found: " + id));

        app.setStatus(AdminApplicationStatus.REVOKED);
        app.setReviewedBy(superAdmin);
        app.setReviewedAt(LocalDateTime.now());
        if (reason != null && !reason.trim().isEmpty()) {
            app.setRejectionReason(reason.trim());
        }
        AdminApplication saved = applicationRepository.save(app);

        // Revoke privileges
        User targetUser = app.getUser();
        targetUser.setRole(Role.PARTICIPANT);
        userRepository.save(targetUser);

        // Audit log
        auditRepository.save(AdminApplicationAudit.builder()
                .application(saved)
                .actor(superAdmin)
                .action("REVOKED")
                .notes("Privileges revoked by " + superAdmin.getName() + (reason != null ? ". Reason: " + reason : ""))
                .build());

        // Notify User
        notificationProducer.sendDirectNotification(
                targetUser.getId(),
                null,
                NotificationType.ADMIN_PRIVILEGES_REVOKED,
                "Event Admin Privileges Revoked",
                "Your Event Admin privileges for " + app.getDepartment() + " have been revoked by platform administration.",
                NotificationChannel.IN_APP
        );

        return toResponse(saved);
    }

    @Transactional
    public synchronized AdminApplicationResponse suspendAdmin(Long id, String reason, User superAdmin) {
        ensureSuperAdmin(superAdmin);
        AdminApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Application not found: " + id));

        app.setStatus(AdminApplicationStatus.SUSPENDED);
        app.setReviewedBy(superAdmin);
        app.setReviewedAt(LocalDateTime.now());
        if (reason != null && !reason.trim().isEmpty()) {
            app.setRejectionReason(reason.trim());
        }
        AdminApplication saved = applicationRepository.save(app);

        // Temporarily suspend privileges
        User targetUser = app.getUser();
        targetUser.setRole(Role.PARTICIPANT);
        userRepository.save(targetUser);

        // Audit log
        auditRepository.save(AdminApplicationAudit.builder()
                .application(saved)
                .actor(superAdmin)
                .action("SUSPENDED")
                .notes("Admin suspended by " + superAdmin.getName() + (reason != null ? ". Reason: " + reason : ""))
                .build());

        // Notify User
        notificationProducer.sendDirectNotification(
                targetUser.getId(),
                null,
                NotificationType.ADMIN_PRIVILEGES_SUSPENDED,
                "Event Admin Account Suspended",
                "Your organizer privileges have been temporarily suspended. Please contact platform administration.",
                NotificationChannel.IN_APP
        );

        return toResponse(saved);
    }

    public AdminApplicationStatsResponse getStats(User requester) {
        ensureSuperAdmin(requester);
        return AdminApplicationStatsResponse.builder()
                .total(applicationRepository.count())
                .pending(applicationRepository.countByStatus(AdminApplicationStatus.PENDING_APPROVAL))
                .approved(applicationRepository.countByStatus(AdminApplicationStatus.APPROVED))
                .rejected(applicationRepository.countByStatus(AdminApplicationStatus.REJECTED))
                .suspended(applicationRepository.countByStatus(AdminApplicationStatus.SUSPENDED))
                .revoked(applicationRepository.countByStatus(AdminApplicationStatus.REVOKED))
                .build();
    }

    private void ensureSuperAdmin(User user) {
        if (user == null || user.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Only SUPER_ADMIN can perform this action.");
        }
    }

    private AdminApplicationResponse toResponse(AdminApplication a) {
        long eventsCount = 0;
        try {
            if (a.getUser() != null) {
                eventsCount = eventRepository.countByCreatedBy(a.getUser());
            }
        } catch (Exception ignored) {}

        return AdminApplicationResponse.builder()
                .id(a.getId())
                .userId(a.getUser() != null ? a.getUser().getId() : null)
                .fullName(a.getFullName())
                .email(a.getEmail())
                .department(a.getDepartment())
                .phoneNumber(a.getPhoneNumber())
                .organizationRole(a.getOrganizationRole())
                .statement(a.getStatement())
                .status(a.getStatus())
                .rejectionReason(a.getRejectionReason())
                .reviewedByName(a.getReviewedBy() != null ? a.getReviewedBy().getName() : null)
                .reviewedAt(a.getReviewedAt())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .managedEventsCount(eventsCount)
                .build();
    }
}

