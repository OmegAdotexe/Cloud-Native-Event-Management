import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { 
  Calendar, CheckCircle2, Users, Clock, Plus, ArrowRight,
  ShieldCheck, Eye, Edit, AlertCircle, FileText
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

  // Filter events belonging to or created by this organizer
  const myEvents = events.filter(e => 
    e.createdById === user?.id || 
    (e.createdByName && user?.name && e.createdByName.toLowerCase() === user.name.toLowerCase()) ||
    (e.organizerClub && user?.email && e.organizerClub.toLowerCase().includes(user.email.split("@")[0].toLowerCase()))
  );
  const displayEvents = myEvents.length > 0 ? myEvents : events;
  const recentOrganizerEvents = displayEvents.slice(0, 5);

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
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>
                      {reg.participantName}
                      <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--mute)", fontWeight: 400 }}>#{reg.participantId}</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--primary)", marginTop: "2px", fontWeight: 500 }}>
                      Event: {reg.eventTitle || `Event #${reg.eventId}`}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--mute)", marginTop: "2px" }}>
                      Requested: {new Date(reg.registeredAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>My Campus Sessions</div>
              <div style={{ fontSize: "12px", color: "var(--mute)" }}>Events organized and managed by your society</div>
            </div>
            <button
              type="button"
              className="relay-btn-ghost relay-btn-sm"
              onClick={() => navigate("/events")}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
            >
              View All Events <ArrowRight size={13} />
            </button>
          </div>

          {recentOrganizerEvents.length === 0 ? (
            <div className="relay-empty" style={{ padding: "30px 0" }}>No events organized yet. Click "Create Event" to launch one!</div>
          ) : (
            <div className="relay-table-wrap">
              <table className="relay-table">
                <thead>
                  <tr>
                    <th style={{ width: "48px" }}>Cover</th>
                    <th>Event Title</th>
                    <th>Date & Time</th>
                    <th>Venue</th>
                    <th>Registrations</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrganizerEvents.map((ev) => {
                    const coverImg = getEventCoverImage(ev.id, ev.category, ev.title);
                    return (
                      <tr key={ev.id}>
                        <td>
                          <img
                            src={coverImg}
                            alt=""
                            onError={handleImageError}
                            style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "13px" }}>
                            {ev.title}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--mute)" }}>
                            {ev.category || "General"}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "var(--text)" }}>
                            {new Date(ev.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {ev.venueName || "Online"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "var(--text)" }}>
                            {ev.confirmedRegistrations || 0} / {ev.capacity}
                          </span>
                        </td>
                        <td>
                          <span className={`relay-pill ${
                            ev.status === "PUBLISHED" ? "green" :
                            ev.status === "DRAFT" ? "amber" : "blue"
                          }`} style={{ fontSize: "10.5px", padding: "2px 7px" }}>
                            {ev.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="relay-btn-ghost relay-btn-sm"
                            onClick={() => navigate("/events", { state: { editEventId: ev.id } })}
                            style={{ fontSize: "11.5px", padding: "3px 8px" }}
                          >
                            Edit
                          </button>
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
