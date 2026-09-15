import React from "react";
import { CalendarClock, MapPin } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ParticipantPage({ events, isLoading, error }) {
  const { user } = useAuth();
  return <>
    <div className="relay-topbar"><div><h1>Hi, {user?.name || "there"}</h1><p>Published events available on campus.</p></div></div>
    <div className="relay-body"><div className="relay-grid"><div>
      <label className="relay-field-label">Published events</label>
      {isLoading && <div className="relay-empty">Loading events...</div>}
      {error && <div className="relay-empty">{error}</div>}
      {!isLoading && !error && events.length === 0 && <div className="relay-empty">No published events yet.</div>}
      {events.map((event) => <div key={event.id} className="relay-card" style={{ marginTop: 8 }}>
        <div className="relay-event-name">{event.title}</div>
        <div className="relay-event-meta"><span className="relay-meta-item"><MapPin size={11} /> {event.venue}</span><span className="relay-meta-item"><CalendarClock size={11} /> {new Date(event.startTime).toLocaleString()}</span></div>
        {event.description && <p className="relay-meta-item">{event.description}</p>}
      </div>)}
    </div></div></div>
  </>;
}
