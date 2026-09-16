import React from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function SuperAdminPage({ events, isLoading, error }) {
  const { user } = useAuth();
  const published = events.filter((event) => event.status === "PUBLISHED").length;
  return <>
    <div className="relay-topbar"><div><h1>Hi, {user?.name || "there"}</h1><p>Platform-wide event operations.</p></div></div>
    <div className="relay-body">
      <div className="relay-stat-grid"><div className="relay-stat-card"><div className="relay-stat-num">{events.length}</div><div className="relay-stat-label">All events</div></div><div className="relay-stat-card"><div className="relay-stat-num">{published}</div><div className="relay-stat-label">Published</div></div></div>
      {isLoading && <div className="relay-empty">Loading events...</div>}
      {error && <div className="relay-empty">{error}</div>}
      {!isLoading && !error && events.length === 0 && <div className="relay-empty">No events yet.</div>}
      {events.map((event) => <div key={event.id} className="relay-card" style={{ marginBottom: 8 }}><strong>{event.title}</strong><div className="relay-event-meta">{event.status} · {event.venue} · {new Date(event.startTime).toLocaleString()}</div></div>)}
    </div>
  </>;
}
