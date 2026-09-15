import React from "react";
import { Send } from "lucide-react";
import { MapPin, CalendarClock } from "lucide-react";
import EventCard from "../components/EventCard.jsx";
import LiveFeed from "../components/LiveFeed.jsx";
import TraceWaterfall from "../components/TraceWaterfall.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * AdminPage — Event Admin view.
 *
 * Props come from App.jsx (shared state that drives all views).
 */
export default function AdminPage({
  events,
  selected,
  selectedId,
  setSelectedId,
  draftVenue,
  draftSchedule,
  setDraftVenue,
  setDraftSchedule,
  onTriggerChange,
  running,
  feed,
  trace,
}) {
  const { user } = useAuth();
  
  return (
    <>
      {/* Top bar */}
      <div className="relay-topbar">
        <div>
          <h1>Hi, {user?.name || "there"}</h1>
          <p>Events — Change a venue or schedule to see who gets notified — and how.</p>
        </div>
      </div>

      {/* Body */}
      <div className="relay-body">
        <div className="relay-grid">

          {/* ── Left column: event list + editor ── */}
          <div>
            {events.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                isActive={ev.id === selectedId}
                onClick={() => setSelectedId(ev.id)}
              />
            ))}

            {selected && (
              <div className="relay-card" style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  Edit "{selected.name}"
                </div>

                {/* Venue / Schedule inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {/* Venue */}
                  <div>
                    <label className="relay-field-label">Venue</label>
                    <input
                      className="relay-input"
                      value={draftVenue}
                      onChange={(e) => setDraftVenue(e.target.value)}
                    />
                    <button
                      className="relay-btn"
                      style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
                      disabled={running || draftVenue === selected.venue}
                      onClick={() => onTriggerChange("venue")}
                    >
                      <Send size={12} /> Save venue change
                    </button>
                  </div>

                  {/* Schedule */}
                  <div>
                    <label className="relay-field-label">Schedule</label>
                    <input
                      className="relay-input"
                      value={draftSchedule}
                      onChange={(e) => setDraftSchedule(e.target.value)}
                    />
                    <button
                      className="relay-btn"
                      style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
                      disabled={running || draftSchedule === selected.schedule}
                      onClick={() => onTriggerChange("schedule")}
                    >
                      <Send size={12} /> Save schedule change
                    </button>
                  </div>
                </div>

                {/* Registered participants */}
                <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                  <label className="relay-field-label">
                    Registered participants ({selected.registered.length})
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.registered.map((p) => (
                      <span
                        key={p}
                        className="relay-pill"
                        style={{ color: "var(--paper)", background: "var(--panel-2)" }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: live feed + trace ── */}
          <div>
            <LiveFeed entries={feed} />
            <TraceWaterfall spans={trace} />
          </div>
        </div>
      </div>
    </>
  );
}
