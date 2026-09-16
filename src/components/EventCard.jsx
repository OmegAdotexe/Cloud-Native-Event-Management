import React from "react";
import { CalendarClock, MapPin, Users } from "lucide-react";

export default function EventCard({ event, isActive, onClick }) {
  return <button type="button" className={`relay-event-card ${isActive ? "active" : ""}`} onClick={onClick} style={{ width: "100%", textAlign: "left", border: "none" }}>
    <div className="relay-event-name">{event.title}</div>
    <div className="relay-event-meta">
      <span className="relay-meta-item"><MapPin size={11} /> {event.venue}</span>
      <span className="relay-meta-item"><CalendarClock size={11} /> {new Date(event.startTime).toLocaleString()}</span>
      <span className="relay-meta-item"><Users size={11} /> Capacity {event.capacity}</span>
    </div>
    <div className="relay-meta-item" style={{ marginTop: 5 }}>{event.status}</div>
  </button>;
}
