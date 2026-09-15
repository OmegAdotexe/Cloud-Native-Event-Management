package com.campusconnect.event.repository;

import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventStatus;
import com.campusconnect.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findAllByOrderByStartTimeAsc();
    List<Event> findByStatusOrderByStartTimeAsc(EventStatus status);
    List<Event> findByCreatedBy(User user);
}
