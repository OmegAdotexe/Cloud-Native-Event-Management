package com.campusconnect.event.repository;

import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.Registration;
import com.campusconnect.event.model.RegistrationStatus;
import com.campusconnect.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    
    Optional<Registration> findByEventAndParticipantAndStatusIn(Event event, User participant, List<RegistrationStatus> statuses);
    
    Optional<Registration> findByEventAndParticipant(Event event, User participant);
    
    int countByEventAndStatus(Event event, RegistrationStatus status);
    
    Optional<Registration> findFirstByEventAndStatusOrderByRegisteredAtAsc(Event event, RegistrationStatus status);

    Page<Registration> findByEvent(Event event, Pageable pageable);
    
    Page<Registration> findByEventAndStatus(Event event, RegistrationStatus status, Pageable pageable);
    
    List<Registration> findByParticipantOrderByRegisteredAtDesc(User participant);
}
