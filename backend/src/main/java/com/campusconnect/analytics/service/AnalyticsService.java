package com.campusconnect.analytics.service;

import com.campusconnect.analytics.dto.AdminDashboardResponse;
import com.campusconnect.analytics.dto.EventAnalyticsResponse;
import com.campusconnect.analytics.dto.SuperAdminDashboardResponse;
import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.event.model.RegistrationStatus;
import com.campusconnect.event.repository.EventRepository;
import com.campusconnect.event.repository.RegistrationRepository;
import com.campusconnect.notification.repository.NotificationRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboard(User user) {
        return AdminDashboardResponse.builder()
                .totalEvents(eventRepository.countByCreatedBy(user))
                .draftEvents(eventRepository.countByCreatedByAndStatus(user, EventStatus.DRAFT))
                .publishedEvents(eventRepository.countByCreatedByAndStatus(user, EventStatus.PUBLISHED))
                .cancelledEvents(eventRepository.countByCreatedByAndStatus(user, EventStatus.CANCELLED))
                .upcomingEvents(eventRepository.countUpcomingByCreatedBy(user))
                
                .totalRegistrations(registrationRepository.countByEventCreatedBy(user))
                .confirmedRegistrations(registrationRepository.countByEventCreatedByAndStatus(user, RegistrationStatus.CONFIRMED))
                .pendingRegistrations(registrationRepository.countByEventCreatedByAndStatus(user, RegistrationStatus.PENDING))
                .waitlistedRegistrations(registrationRepository.countByEventCreatedByAndStatus(user, RegistrationStatus.WAITLISTED))
                .build();
    }

    @Transactional(readOnly = true)
    public SuperAdminDashboardResponse getSuperAdminDashboard() {
        return SuperAdminDashboardResponse.builder()
                .totalUsers(userRepository.count())
                .totalParticipants(userRepository.countByRole(Role.PARTICIPANT))
                .totalEventAdmins(userRepository.countByRole(Role.EVENT_ADMIN))
                .totalSuperAdmins(userRepository.countByRole(Role.SUPER_ADMIN))
                
                .totalEvents(eventRepository.count())
                .draftEvents(eventRepository.countByStatus(EventStatus.DRAFT))
                .publishedEvents(eventRepository.countByStatus(EventStatus.PUBLISHED))
                .cancelledEvents(eventRepository.countByStatus(EventStatus.CANCELLED))
                .upcomingEvents(eventRepository.countUpcomingEvents())
                
                .totalRegistrations(registrationRepository.count())
                .confirmedRegistrations(registrationRepository.countByStatus(RegistrationStatus.CONFIRMED))
                .pendingRegistrations(registrationRepository.countByStatus(RegistrationStatus.PENDING))
                .waitlistedRegistrations(registrationRepository.countByStatus(RegistrationStatus.WAITLISTED))
                
                .totalNotifications(notificationRepository.count())
                .build();
    }

    @Transactional(readOnly = true)
    public EventAnalyticsResponse getEventAnalytics(Long eventId, User user) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        if (user.getRole() != Role.SUPER_ADMIN && !event.getCreatedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to view analytics for this event.");
        }

        long confirmedCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CONFIRMED);
        long waitlistCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.WAITLISTED);
        long pendingCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.PENDING);
        long cancelledCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CANCELLED);
        long rejectedCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.REJECTED);

        double capacityUtilization = event.getCapacity() > 0 
                ? ((double) confirmedCount / event.getCapacity()) * 100 
                : 0.0;
                
        long availableSeats = event.getCapacity() > confirmedCount ? event.getCapacity() - confirmedCount : 0;

        return EventAnalyticsResponse.builder()
                .eventId(event.getId())
                .title(event.getTitle())
                .status(event.getStatus())
                .startTime(event.getStartTime())
                .registrationDeadline(event.getRegistrationDeadline())
                .capacity(event.getCapacity())
                .confirmedRegistrations(confirmedCount)
                .availableSeats(availableSeats)
                .capacityUtilization(capacityUtilization)
                .waitlistCount(waitlistCount)
                .pendingCount(pendingCount)
                .cancelledCount(cancelledCount)
                .rejectedCount(rejectedCount)
                .registrationTrend(registrationRepository.getRegistrationTrendForEvent(event))
                .build();
    }
}
