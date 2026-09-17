package com.campusconnect.analytics.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SuperAdminDashboardResponse {
    private long totalUsers;
    private long totalParticipants;
    private long totalEventAdmins;
    private long totalSuperAdmins;

    private long totalEvents;
    private long draftEvents;
    private long publishedEvents;
    private long cancelledEvents;
    private long upcomingEvents;
    
    private long totalRegistrations;
    private long confirmedRegistrations;
    private long pendingRegistrations;
    private long waitlistedRegistrations;

    private long totalNotifications;
}
