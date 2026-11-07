package com.campusconnect.user.dto;

import com.campusconnect.user.model.AdminApplicationStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminApplicationResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String department;
    private String phoneNumber;
    private String organizationRole;
    private String statement;
    private AdminApplicationStatus status;
    private String rejectionReason;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long managedEventsCount;
}
