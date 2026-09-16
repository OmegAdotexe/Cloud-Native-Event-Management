import React from "react";
import { CalendarClock, MapPin, Users, Tag, AlertCircle } from "lucide-react";

export default function EventCard({ event, isActive, onClick }) {
  return <button type="button" className={`relay-event-card ${isActive ? "active" : ""}`} onClick={onClick} style={{ width: "100%", textAlign: "left", border: "none" }}>
    <div className="relay-event-name">{event.title}</div>
    <div className="relay-event-meta">
      <span className="relay-meta-item"><MapPin size={11} /> {event.isVirtual ? `Virtual${event.virtualLink ? ': ' + event.virtualLink : ''}` : event.venueName}</span>
      <span className="relay-meta-item"><CalendarClock size={11} /> {new Date(event.startTime).toLocaleString()}</span>
      <span className="relay-meta-item"><Users size={11} /> Capacity {event.capacity}</span>
      <span className="relay-meta-item"><Tag size={11} /> {event.category} - {event.registrationMode}</span>
    </div>
    <div className="relay-meta-item" style={{ marginTop: 5 }}>
        {event.status} {event.waitlistEnabled && " | Waitlist On"}
        {event.status === "CANCELLED" && <><br /><AlertCircle size={11} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Reason: {event.cancelledReason}</>}
    </div>
  </button>;
}
