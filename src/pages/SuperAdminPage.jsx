import React from "react";
import { CHANNELS } from "../data/mockData.js";
import LiveFeed from "../components/LiveFeed.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * SuperAdminPage — platform-wide operations overview.
 */
export default function SuperAdminPage({ events, notifications, feed }) {
  const { user } = useAuth();
  
  const totalParticipants = new Set(events.flatMap((e) => e.registered)).size;
  const sent       = notifications.filter((n) => n.status === "Sent").length;
  const failedNow  = notifications.filter((n) => n.status === "Retrying").length;

  const byChannel  = CHANNELS.map((c) => ({
    ...c,
    count: notifications.filter((n) => n.channel === c.key).length,
  }));
  const maxChannel = Math.max(1, ...byChannel.map((c) => c.count));

  return (
    <>
      {/* Top bar */}
      <div className="relay-topbar">
        <div>
          <h1>Hi, {user?.name || "there"}</h1>
          <p>Operations overview — Platform-wide activity across all events and admins.</p>
        </div>
      </div>

      {/* Body */}
      <div className="relay-body">

        {/* ── Stat cards ── */}
        <div className="relay-stat-grid">
          <div className="relay-stat-card">
            <div className="relay-stat-num">{events.length}</div>
            <div className="relay-stat-label">Active events</div>
          </div>
          <div className="relay-stat-card">
            <div className="relay-stat-num">{totalParticipants}</div>
            <div className="relay-stat-label">Registered participants</div>
          </div>
          <div className="relay-stat-card">
            <div className="relay-stat-num" style={{ color: "var(--teal)" }}>
              {sent}
            </div>
            <div className="relay-stat-label">Notifications delivered</div>
          </div>
          <div className="relay-stat-card">
            <div className="relay-stat-num" style={{ color: "var(--amber)" }}>
              {failedNow}
            </div>
            <div className="relay-stat-label">Currently retrying</div>
          </div>
        </div>

        {/* ── Two-column grid ── */}
        <div className="relay-grid">

          {/* Left: channel bar chart + events at a glance */}
          <div className="relay-card">
            <div className="relay-feed-title">Deliveries by channel</div>

            {byChannel.map((c) => (
              <div className="relay-bar-row" key={c.key}>
                <div className="relay-bar-label">
                  <c.icon size={12} /> {c.label}
                </div>
                <div className="relay-bar-track">
                  <div
                    className="relay-bar-fill"
                    style={{
                      width: `${(c.count / maxChannel) * 100}%`,
                      background: "var(--teal)",
                    }}
                  />
                </div>
                <div className="relay-bar-val">{c.count}</div>
              </div>
            ))}

            {/* Events at a glance */}
            <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <div className="relay-feed-title" style={{ marginBottom: 10 }}>
                Events at a glance
              </div>
              {events.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    padding: "6px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span>{ev.name}</span>
                  <span style={{ color: "var(--mute)" }}>
                    {ev.registered.length}/{ev.capacity} · {ev.venue}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: platform event log */}
          <LiveFeed
            entries={feed}
            title="Platform event log"
            accentColor="var(--amber)"
            emptyMessage="No domain events yet."
          />
        </div>
      </div>
    </>
  );
}
