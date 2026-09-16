package com.campusconnect.event.repository;

import com.campusconnect.event.model.Event;
import com.campusconnect.event.model.TimelineItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimelineItemRepository extends JpaRepository<TimelineItem, Long> {
    List<TimelineItem> findByEventOrderByStartTimeAsc(Event event);
}
