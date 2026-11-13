import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { 
  Calendar, CheckCircle2, Users, Clock, Plus, ArrowRight,
  ShieldCheck, Eye, Edit, AlertCircle, FileText, Trash2
} from "lucide-react";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

export default function AdminDashboardPage({ events = [], isLoading, error, onRefresh }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [dashboard, setDashboard] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [actionError, setActionError] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    setLoadingDashboard(true);
    relayApi.getAdminDashboard()
      .then(setDashboard)
      .catch(err => console.error("Failed to load organizer dashboard", err))
      .finally(() => setLoadingDashboard(false));

    loadPending();
  }, []);

  const loadPending = () => {
    relayApi.getPendingRegistrations(0, 20)
      .then(res => setPendingApprovals(res?.content || []))
      .catch(() => setPendingApprovals([]));
  };

  const handlePendingApprove = async (eventId, regId) => {
    try {
      await relayApi.approveRegistration(eventId, regId);
      loadPending();
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message || "Failed to approve registration");
    }
  };

  const handlePendingReject = async (eventId, regId) => {
    try {
      await relayApi.rejectRegistration(eventId, regId, "Registration request declined by organizer.");
      loadPending();
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message || "Failed to reject registration");
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle || 'this event'}"? This action will permanently remove the event from the database.`)) {
      try {
        setActionError("");
        await relayApi.deleteEvent(eventId);
        if (onRefresh) await onRefresh();
      } catch (err) {
        setActionError(err.message || "Failed to delete event.");
      }
    }
  };

  const displayEvents = events;

  return (
    <div>
      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <div className="relay-topbar">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Hi, {user?.name || "Organizer"}</span>
            <span style={{ fontSize: "11.5px", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
              Event Organizer
            </span>
          </h1>
          <p>Review attendees, respond to join requests, and track your campus sessions.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className="relay-btn-ghost" 
            onClick={() => navigate("/events")}
            style={{ padding: "9px 16px", fontSize: "13.5px" }}
          >
            <Calendar size={16} /> Manage Events
          </button>
          <button 
            className="cc-btn-primary" 
            onClick={() => navigate("/events", { state: { create: true } })} 
            style={{ padding: "9px 18px", fontSize: "13.5px" }}
          >
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      <div className="relay-body">
        {error && <div className="relay-error" style={{ marginBottom: "16px" }}>{error}</div>}
        {actionError && <div className="relay-error" style={{ marginBottom: "16px" }}>{actionError}</div>}

        {/* ── KPI Stat Cards ───────────────────────────────────────────── */}
        {dashboard && (
          <div className="relay-stat-grid" style={{ marginBottom: "28px" }}>
            <div className="relay-stat-card">
              <div className="relay-stat-icon purple"><Calendar size={20} /></div>
              <div>
                <div className="relay-stat-num">{dashboard.totalEvents}</div>
                <div className="relay-stat-label">Total Events</div>
              </div>
            </div>
            <div className="relay-stat-card">
              <div className="relay-stat-icon teal"><CheckCircle2 size={20} /></div>
              <div>
                <div className="relay-stat-num">{dashboard.publishedEvents}</div>
                <div className="relay-stat-label">Published & Live</div>
              </div>
            </div>
            <div className="relay-stat-card">
              <div className="relay-stat-icon blue"><Users size={20} /></div>
              <div>
                <div className="relay-stat-num">{dashboard.totalRegistrations}</div>
                <div className="relay-stat-label">Total Registrations</div>
              </div>
            </div>
            <div className="relay-stat-card">
              <div className="relay-stat-icon amber"><Clock size={20} /></div>
              <div>
                <div className="relay-stat-num">{dashboard.pendingRegistrations}</div>
                <div className="relay-stat-label">Pending Approvals</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Pending Approvals Quick-Action Banner ─────────────────────── */}
        {pendingApprovals.length > 0 && (
          <div className="relay-card" style={{ marginBottom: "24px", border: "1.5px solid var(--amber)", background: "rgba(232, 148, 58, 0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FFF4E6", color: "#E8943A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
                    Action Required: {pendingApprovals.length} Registration Approval{pendingApprovals.length > 1 ? "s" : ""} Pending
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--mute)" }}>
                    Review participant join requests for your approval-required events.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {pendingApprovals.map((reg) => (
                <div key={reg.id} style={{
                  padding: "12px 16px",
                  background: "var(--surface)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px"
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>
                        {reg.participantName}
                      </span>
                      <span style={{
                        fontSize: "10.5px",
                        padding: "1px 7px",
                        borderRadius: "10px",
                        fontWeight: 700,
                        background: reg.participantRole === "EVENT_ADMIN" ? "var(--primary-light)" : "var(--border)",
                        color: reg.participantRole === "EVENT_ADMIN" ? "var(--primary)" : "var(--mute)"
                      }}>
                        {reg.participantRole || "PARTICIPANT"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--primary)", marginTop: "2px", fontWeight: 500 }}>
                      Event: {reg.eventTitle || `Event #${reg.eventId}`}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--mute)", marginTop: "2px" }}>
                      Submitted: {new Date(reg.registeredAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {(reg.selfRegistration || reg.participantId === user?.id) ? (
                      <>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "var(--coral)",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          border: "1px solid rgba(239, 68, 68, 0.25)"
                        }}>
                          <AlertCircle size={13} /> Self-Application (Cannot Self-Approve)
                        </span>
                        <button
                          type="button"
                          className="relay-btn-ghost relay-btn-sm"
                          onClick={() => navigate("/events", { state: { editEventId: reg.eventId, tab: "REGISTRATIONS" } })}
                        >
                          View Event
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="relay-btn relay-btn-sm"
                          style={{ background: "var(--teal)", color: "#fff" }}
                          onClick={() => handlePendingApprove(reg.eventId, reg.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="relay-btn-danger relay-btn-sm"
                          onClick={() => handlePendingReject(reg.eventId, reg.id)}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="relay-btn-ghost relay-btn-sm"
                          onClick={() => navigate("/events", { state: { editEventId: reg.eventId, tab: "REGISTRATIONS" } })}
                        >
                          View Event
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Organizer Workspaces ─────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          <div className="relay-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Calendar size={18} />
                </div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>Events Directory</div>
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--mute)", margin: "0 0 16px" }}>
                Access the full event management workspace, search, filters, and attendee lists.
              </p>
            </div>
            <button
              type="button"
              className="relay-btn-ghost"
              onClick={() => navigate("/events")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", fontSize: "13px" }}
            >
              <span>Manage Events</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="relay-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--teal-light)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={18} />
                </div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>Create Event</div>
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--mute)", margin: "0 0 16px" }}>
                Launch a new workshop, society meet, competition, or keynote seminar.
              </p>
            </div>
            <button
              type="button"
              className="relay-btn-ghost"
              onClick={() => navigate("/events", { state: { create: true } })}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", fontSize: "13px" }}
            >
              <span>New Event Form</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Active & Upcoming Events Overview ────────────────────────── */}
        <div className="relay-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Campus Events Directory</div>
              <div style={{ fontSize: "12px", color: "var(--mute)" }}>
                {isLoading ? "Fetching events from database..." : `${displayEvents.length} Event${displayEvents.length === 1 ? "" : "s"} stored in the database`}
              </div>
            </div>
            <button
              type="button"
              className="relay-btn-ghost relay-btn-sm"
              onClick={() => navigate("/events")}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
            >
              Full Workspace <ArrowRight size={13} />
            </button>
          </div>

          {isLoading && (
            <div className="relay-empty" style={{ padding: "40px 0" }}>
              <Clock size={28} style={{ color: "var(--primary)", margin: "0 auto 10px" }} />
              <p>Loading events from database...</p>
            </div>
          )}

          {error && (
            <div className="relay-empty" style={{ padding: "30px 0", color: "var(--coral)" }}>
              <AlertCircle size={28} style={{ color: "var(--coral)", margin: "0 auto 10px" }} />
              <p>{error}</p>
              {onRefresh && (
                <button type="button" className="relay-btn-ghost relay-btn-sm" onClick={onRefresh} style={{ marginTop: "10px" }}>
                  Retry
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && displayEvents.length === 0 && (
            <div className="relay-empty" style={{ padding: "40px 0" }}>
              <Calendar size={32} style={{ color: "var(--mute)", margin: "0 auto 10px" }} />
              <p>No events found in the database. Click "Create Event" to launch one!</p>
            </div>
          )}

          {!isLoading && !error && displayEvents.length > 0 && (
            <div className="relay-table-wrap">
              <table className="relay-table">
                <thead>
                  <tr>
                    <th style={{ width: "48px" }}>Cover</th>
                    <th>Event Details</th>
                    <th>Category</th>
                    <th>Organizer</th>
                    <th>Date & Time</th>
                    <th>Venue</th>
                    <th>Registrations</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayEvents.map((ev) => {
                    const coverImg = getEventCoverImage(ev);
                    return (
                      <tr key={ev.id}>
                        <td>
                          <img
                            src={coverImg}
                            alt=""
                            onError={handleImageError}
                            style={{ width: "38px", height: "38px", borderRadius: "6px", objectFit: "cover" }}
                          />
                        </td>
                        <td style={{ maxWidth: "260px" }}>
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "13px" }}>
                            {ev.title}
                          </div>
                          {ev.description && (
                            <div style={{ fontSize: "11px", color: "var(--mute)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{
                            fontSize: "11px",
                            padding: "2px 7px",
                            borderRadius: "6px",
                            fontWeight: 600,
                            background: "var(--bg)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)"
                          }}>
                            {ev.category || "OTHER"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {ev.createdByName || ev.organizerClub || "Campus Organizer"}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>
                            {new Date(ev.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--mute)" }}>
                            {new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {ev.isVirtual ? "Virtual / Online" : (ev.venueName || "Online")}
                          </span>
                        </td>
                        <td>
                          {ev.status === "CANCELLED" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "11px", color: "var(--coral)", fontWeight: 700 }}>Inactive (Cancelled)</span>
                              <span style={{ fontSize: "11.5px", color: "var(--mute)" }}>
                                {ev.confirmedRegistrations || 0} / {ev.capacity}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>
                                <span style={{ color: "var(--teal)" }}>{ev.confirmedRegistrations || 0} Confirmed</span>
                                <span style={{ color: "var(--mute)", fontWeight: 400 }}> / {ev.capacity}</span>
                              </div>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "10.5px", color: "var(--mute)", flexWrap: "wrap" }}>
                                <span>{ev.availableCapacity ?? Math.max(0, (ev.capacity || 0) - (ev.confirmedRegistrations || 0))} Available</span>
                                {ev.pendingRegistrations > 0 && (
                                  <span style={{ color: "var(--amber)", fontWeight: 700, background: "rgba(245, 158, 11, 0.12)", padding: "1px 5px", borderRadius: "4px" }}>
                                    {ev.pendingRegistrations} Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`relay-pill ${
                            ev.status === "PUBLISHED" ? "green" :
                            ev.status === "CANCELLED" ? "coral" :
                            ev.status === "DRAFT" ? "amber" : "blue"
                          }`} style={{ fontSize: "10.5px", padding: "2px 7px", fontWeight: 700 }}>
                            {ev.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="relay-btn-ghost relay-btn-sm"
                              onClick={() => navigate("/events", { state: { editEventId: ev.id } })}
                              style={{ fontSize: "11.5px", padding: "3px 8px" }}
                            >
                              <Edit size={12} style={{ marginRight: "3px" }} /> Edit
                            </button>
                            <button
                              type="button"
                              className="relay-btn-danger relay-btn-sm"
                              onClick={() => handleDeleteEvent(ev.id, ev.title)}
                              style={{ fontSize: "11.5px", padding: "3px 8px" }}
                              title="Delete event"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
