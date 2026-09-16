import React from "react";
import { CalendarClock, MapPin, Users, Tag, AlertCircle } from "lucide-react";

export default function EventCard({ event, isActive, onClick }) {
  return <button type="button" className={`relay-event-card ${isActive ? "active" : ""}`} onClick={onClick} style={{ width: "100%", textAlign: "left", border: isActive ? "1px solid var(--amber)" : "1px solid var(--border)", fontFamily: "inherit" }}>
    <div className="relay-event-name">{event.title}</div>
    <div className="relay-event-meta">
      <span className="relay-meta-item"><MapPin size={11} /> {event.isVirtual ? `Virtual${event.virtualLink ? ': ' + event.virtualLink : ''}` : event.venueName}</span>
      <span className="relay-meta-item"><CalendarClock size={11} /> {new Date(event.startTime).toLocaleString()}</span>
      <span className="relay-meta-item"><Users size={11} /> Capacity {event.capacity}</span>
      <span className="relay-meta-item"><Tag size={11} /> {event.category} - {event.registrationMode}</span>
    </div>
    <div className="relay-meta-item" style={{ marginTop: 6 }}>
        <span style={{ 
          padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
          background: event.status === "PUBLISHED" ? "#E6F7F2" : event.status === "CANCELLED" ? "#FDE8E7" : "#F0EDE8",
          color: event.status === "PUBLISHED" ? "#1A8A6A" : event.status === "CANCELLED" ? "#C44035" : "var(--text-secondary)",
        }}>
          {event.status}
        </span>
        {event.waitlistEnabled && <span style={{ fontSize: "11px", color: "var(--mute)", marginLeft: 8 }}>Waitlist On</span>}
        {event.status === "CANCELLED" && <><br /><AlertCircle size={11} style={{ display: 'inline', verticalAlign: 'text-bottom', color: 'var(--coral)' }} /> <span style={{ color: 'var(--coral)', fontSize: '11px' }}>Reason: {event.cancelledReason}</span></>}
    </div>
  </button>;
}
