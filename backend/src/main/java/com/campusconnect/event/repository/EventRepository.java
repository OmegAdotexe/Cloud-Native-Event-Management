package com.campusconnect.event.repository;

import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventCategory;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findAllByOrderByStartTimeAsc();
    List<Event> findByStatusOrderByStartTimeAsc(EventStatus status);
    List<Event> findByCategoryOrderByStartTimeAsc(EventCategory category);
    List<Event> findByStatusAndCategoryOrderByStartTimeAsc(EventStatus status, EventCategory category);
    List<Event> findByCreatedBy(User user);
    List<Event> findByCreatedByOrderByStartTimeAsc(User user);
    List<Event> findByCreatedByAndCategoryOrderByStartTimeAsc(User user, EventCategory category);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Optional<Event> findByIdForUpdate(Long id);

    long countByCreatedBy(User user);
    long countByCreatedByAndStatus(User user, EventStatus status);
    
    @Query("SELECT COUNT(e) FROM Event e WHERE e.createdBy = :user AND e.startTime > CURRENT_TIMESTAMP AND e.status != 'CANCELLED'")
    long countUpcomingByCreatedBy(@Param("user") User user);

    long countByStatus(EventStatus status);
    
    @Query("SELECT COUNT(e) FROM Event e WHERE e.startTime > CURRENT_TIMESTAMP AND e.status != 'CANCELLED'")
    long countUpcomingEvents();

    @Query("SELECT e.category, COUNT(e) FROM Event e WHERE e.status = :status GROUP BY e.category")
    List<Object[]> countEventsByStatusGroupByCategory(@Param("status") EventStatus status);

    @Query("SELECT e FROM Event e WHERE e.createdBy = :user AND LOWER(TRIM(e.title)) = LOWER(TRIM(:title)) AND LOWER(TRIM(e.venueName)) = LOWER(TRIM(:venueName)) AND e.startTime = :startTime AND e.status != 'CANCELLED'")
    List<Event> findDuplicates(@Param("user") User user, @Param("title") String title, @Param("venueName") String venueName, @Param("startTime") java.time.LocalDateTime startTime);
}
