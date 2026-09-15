import React from "react";
import { MapPin, CalendarClock, Users, ChevronRight } from "lucide-react";

/**
 * EventCard — a single selectable event row used in the Admin event list.
 *
 * @param {{
 *   event: object,
 *   isActive: boolean,
 *   onClick: function
 * }} props
 */
export default function EventCard({ event, isActive, onClick }) {
  return (
    <div
      className={`relay-event-card ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="relay-event-name">{event.name}</div>
        <ChevronRight size={14} color="var(--mute)" />
      </div>
      <div className="relay-event-meta">
        <span className="relay-meta-item"><MapPin size={11} /> {event.venue}</span>
        <span className="relay-meta-item"><CalendarClock size={11} /> {event.schedule}</span>
        <span className="relay-meta-item">
          <Users size={11} /> {event.registered.length}/{event.capacity} registered
        </span>
      </div>
    </div>
  );
}
