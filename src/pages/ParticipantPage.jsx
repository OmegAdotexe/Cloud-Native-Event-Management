import React, { useState, useEffect } from "react";
import { CalendarClock, MapPin } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as relayApi from "../api/relayApi.js";
import TimelineDisplay from "../components/TimelineDisplay.jsx";

export default function ParticipantPage({ events, isLoading, error }) {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const data = await relayApi.getMyRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleRegister = async (eventId) => {
    setActionLoading(true);
    try {
      await relayApi.registerForEvent(eventId);
      await fetchRegistrations();
    } catch (err) {
      alert(err.message || "Failed to register");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (eventId, registrationId) => {
    setActionLoading(true);
    try {
      await relayApi.cancelRegistration(eventId, registrationId);
      await fetchRegistrations();
    } catch (err) {
      alert(err.message || "Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  };

  return <>
    <div className="relay-topbar"><div><h1>Hi, {user?.name || "there"}</h1><p>Published events available on campus.</p></div></div>
    <div className="relay-body"><div className="relay-grid"><div>
      <label className="relay-field-label">Published events</label>
      {isLoading && <div className="relay-empty">Loading events...</div>}
      {error && <div className="relay-empty">{error}</div>}
      {!isLoading && !error && events.length === 0 && <div className="relay-empty">No published events yet.</div>}
      {events.map((event) => {
        const reg = registrations.find(r => r.eventId === event.id);
        const isPastDeadline = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
        
        return (
          <div key={event.id} className="relay-card" style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="relay-event-name">{event.title}</div>
              <div style={{ display: "flex", gap: "6px" }}>
                {event.registrationMode === 'INVITE_ONLY' && <span style={{ fontSize: "10px", padding: "2px 6px", background: "var(--mute)", color: "var(--paper)", borderRadius: "4px" }}>INVITE ONLY</span>}
                {event.registrationMode === 'APPROVAL_REQUIRED' && <span style={{ fontSize: "10px", padding: "2px 6px", background: "#f59e0b", color: "#fff", borderRadius: "4px" }}>APPROVAL REQUIRED</span>}
              </div>
            </div>
            
            <div className="relay-event-meta" style={{ marginTop: "4px" }}>
              <span className="relay-meta-item"><MapPin size={11} /> {event.isVirtual ? `Virtual${event.virtualLink ? ': ' + event.virtualLink : ''}` : event.venueName}</span>
              <span className="relay-meta-item"><CalendarClock size={11} /> {new Date(event.startTime).toLocaleString()}</span>
            </div>
            
            {event.description && <p className="relay-meta-item" style={{ marginTop: "8px" }}>{event.description}</p>}
            
            <TimelineDisplay event={event} />

            <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--mute)" }}>
                <div style={{ marginBottom: "2px" }}>Capacity: {event.capacity} {event.waitlistEnabled ? "(Waitlist enabled)" : ""}</div>
                {event.registrationDeadline && <div>Deadline: {new Date(event.registrationDeadline).toLocaleString()} {isPastDeadline ? "(Closed)" : ""}</div>}
              </div>
              
              <div>
                {!reg ? (
                  <button 
                    className="relay-btn" 
                    disabled={actionLoading || isPastDeadline} 
                    onClick={() => handleRegister(event.id)}
                  >
                    {isPastDeadline ? "Closed" : "Register"}
                  </button>
                ) : reg.status === 'CANCELLED' || reg.status === 'REJECTED' ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#ef4444" }}>Status: {reg.status}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: reg.status === 'CONFIRMED' ? "#10b981" : reg.status === 'WAITLISTED' ? "#f59e0b" : "#6366f1" }}>Status: {reg.status}</span>
                    <button className="relay-btn" disabled={actionLoading} onClick={() => handleCancel(event.id, reg.id)} style={{ backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444" }}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div></div></div>
  </>;
}
