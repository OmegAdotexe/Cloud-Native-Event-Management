package com.campusconnect.event.repository;

import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventInvite;
import com.campusconnect.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventInviteRepository extends JpaRepository<EventInvite, Long> {
    
    boolean existsByEventAndParticipant(Event event, User participant);
}
