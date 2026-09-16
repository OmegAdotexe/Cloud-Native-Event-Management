package com.campusconnect.event.repository;

import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.EventChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventChangeLogRepository extends JpaRepository<EventChangeLog, Long> {
    List<EventChangeLog> findByEventId(Long eventId);
    void deleteByEvent(Event event);
}
