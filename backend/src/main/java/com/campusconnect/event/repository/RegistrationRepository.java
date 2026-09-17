package com.campusconnect.event.repository;

import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.Registration;
import com.campusconnect.event.model.RegistrationStatus;
import com.campusconnect.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    
    Optional<Registration> findByEventAndParticipantAndStatusIn(Event event, User participant, List<RegistrationStatus> statuses);
    
    Optional<Registration> findByEventAndParticipant(Event event, User participant);
    
    int countByEventAndStatus(Event event, RegistrationStatus status);
    
    Optional<Registration> findFirstByEventAndStatusOrderByRegisteredAtAsc(Event event, RegistrationStatus status);

    Page<Registration> findByEvent(Event event, Pageable pageable);
    
    List<Registration> findByEventOrderByRegisteredAtDesc(Event event);
    
    List<Registration> findByEventIdAndStatusNotIn(Long eventId, List<RegistrationStatus> statuses);
    
    Page<Registration> findByEventAndStatus(Event event, RegistrationStatus status, Pageable pageable);
    
    List<Registration> findByParticipantOrderByRegisteredAtDesc(User participant);

    @Query("SELECT COUNT(r) FROM Registration r JOIN r.event e WHERE e.createdBy = :user")
    long countByEventCreatedBy(@Param("user") User user);

    @Query("SELECT COUNT(r) FROM Registration r JOIN r.event e WHERE e.createdBy = :user AND r.status = :status")
    long countByEventCreatedByAndStatus(@Param("user") User user, @Param("status") RegistrationStatus status);

    @Query("SELECT new com.campusconnect.analytics.dto.RegistrationTrendDto(CAST(r.registeredAt AS localdate), COUNT(r)) " +
           "FROM Registration r WHERE r.event = :event " +
           "GROUP BY CAST(r.registeredAt AS localdate) ORDER BY CAST(r.registeredAt AS localdate) ASC")
    List<com.campusconnect.analytics.dto.RegistrationTrendDto> getRegistrationTrendForEvent(@Param("event") Event event);

    long countByStatus(RegistrationStatus status);
}
