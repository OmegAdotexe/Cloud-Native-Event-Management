package com.campusconnect.event.model;

import com.campusconnect.user.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_invites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;

    @Column(name = "invited_at", nullable = false, updatable = false)
    private LocalDateTime invitedAt;

    @PrePersist
    void onCreate() {
        if (invitedAt == null) {
            invitedAt = LocalDateTime.now();
        }
    }
}
