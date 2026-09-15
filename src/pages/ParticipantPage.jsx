import React from "react";
import { Bell, MapPin, CalendarClock } from "lucide-react";
import { FOCUS_PARTICIPANT } from "../data/mockData.js";
import NotificationRow from "../components/NotificationRow.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * ParticipantPage — shows the demo participant's registered events
 * and the notifications they've received.
 */
export default function ParticipantPage({ events, notifications }) {
  const { user } = useAuth();
  
  const myEvents = events.filter((e) =>
    e.registered.includes(FOCUS_PARTICIPANT)
  );
  const myNotifs = notifications.filter(
    (n) => n.person === FOCUS_PARTICIPANT
  );

  return (
    <>
      {/* Top bar */}
      <div className="relay-topbar">
        <div>
          <h1>Hi, {user?.name || "there"}</h1>
          <p>Your registered events and the notifications you've received.</p>
        </div>
      </div>

      {/* Body */}
      <div className="relay-body">
        <div className="relay-grid">

          {/* ── Left: registered events ── */}
          <div>
            <label
              className="relay-field-label"
              style={{ marginBottom: 10, display: "block" }}
            >
              Registered events
            </label>

            {myEvents.map((ev) => (
              <div key={ev.id} className="relay-card" style={{ marginBottom: 8 }}>
                <div className="relay-event-name">{ev.name}</div>
                <div className="relay-event-meta">
                  <span className="relay-meta-item">
                    <MapPin size={11} /> {ev.venue}
                  </span>
                  <span className="relay-meta-item">
                    <CalendarClock size={11} /> {ev.schedule}
                  </span>
                </div>
              </div>
            ))}

            {myEvents.length === 0 && (
              <div className="relay-empty">No registrations.</div>
            )}
          </div>

          {/* ── Right: notifications ── */}
          <div className="relay-card">
            <div className="relay-feed-title">
              <Bell size={13} color="var(--amber)" />
              Notifications ({myNotifs.length})
            </div>

            {myNotifs.length === 0 && (
              <div className="relay-empty">
                Nothing yet — switch to Event Admin and change a venue or
                schedule for one of your events to see it land here.
              </div>
            )}

            <div
              className="relay-scroll"
              style={{ maxHeight: 420, overflow: "auto" }}
            >
              {myNotifs.map((n) => (
                <NotificationRow key={n.id} notification={n} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
