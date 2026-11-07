import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { 
  Calendar, CheckCircle2, Users, Clock, FileText, Activity,
  AlertCircle, ShieldCheck, Plus, ArrowRight, Sparkles, Layers,
  ExternalLink, Bell, BarChart2
} from "lucide-react";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

export default function SuperAdminPage({ events = [], isLoading, error }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    setLoadingDashboard(true);
    relayApi.getSuperAdminDashboard()
      .then(setDashboard)
      .catch(err => console.error("Failed to load superadmin dashboard metrics", err))
      .finally(() => setLoadingDashboard(false));
  }, []);

  // Top 5 recent campus events for the summary table
  const recentEvents = [...events].slice(0, 5);

  return (
    <div>
      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <div className="relay-topbar">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Platform Overview</span>
            <span style={{ fontSize: "11.5px", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
              Super Admin Console
            </span>
          </h1>
          <p>University-wide event operations, active user engagement, and infrastructure metrics.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className="relay-btn-ghost" 
            onClick={() => navigate("/events")}
            style={{ padding: "9px 16px", fontSize: "13.5px" }}
          >
            <Calendar size={16} /> Browse Directory
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

        {loadingDashboard ? (
          <div className="relay-empty" style={{ padding: "40px 0" }}>Loading platform metrics...</div>
        ) : dashboard && (
          <>
            {/* ── Platform & User Reach ────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Platform Health & User Reach</div>
              <span style={{ fontSize: "12px", color: "var(--teal)", fontWeight: 600 }}>● All Cloud Systems Operational</span>
            </div>

            <div className="relay-stat-grid" style={{ marginBottom: "28px" }}>
              <div className="relay-stat-card">
                <div className="relay-stat-icon purple"><Users size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.totalUsers}</div>
                  <div className="relay-stat-label">Total Registered Users</div>
                </div>
              </div>
              <div className="relay-stat-card">
                <div className="relay-stat-icon amber"><ShieldCheck size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.totalEventAdmins}</div>
                  <div className="relay-stat-label">Event Organizers</div>
                </div>
              </div>
              <div className="relay-stat-card">
                <div className="relay-stat-icon teal"><Activity size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.totalRegistrations}</div>
                  <div className="relay-stat-label">Total Registrations</div>
                </div>
              </div>
              <div className="relay-stat-card">
                <div className="relay-stat-icon blue"><AlertCircle size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.totalNotifications}</div>
                  <div className="relay-stat-label">Notifications Processed</div>
                </div>
              </div>
            </div>
            
            {/* ── Event Lifecycle Breakdown ────────────────────────────────── */}
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "14px" }}>
              Event Lifecycle Breakdown
            </div>
            <div className="relay-stat-grid" style={{ marginBottom: "28px" }}>
              <div className="relay-stat-card">
                <div className="relay-stat-icon purple"><Calendar size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.totalEvents}</div>
                  <div className="relay-stat-label">All Events</div>
                </div>
              </div>
              <div className="relay-stat-card">
                <div className="relay-stat-icon teal"><CheckCircle2 size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.publishedEvents}</div>
                  <div className="relay-stat-label">Published Live</div>
                </div>
              </div>
              <div className="relay-stat-card">
                <div className="relay-stat-icon blue"><Clock size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.upcomingEvents}</div>
                  <div className="relay-stat-label">Upcoming Events</div>
                </div>
              </div>
              <div className="relay-stat-card">
                <div className="relay-stat-icon amber"><FileText size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.draftEvents}</div>
                  <div className="relay-stat-label">Draft Reviews</div>
                </div>
              </div>
            </div>

            {/* ── Quick Platform Workspaces ────────────────────────────────── */}
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
                    Browse, filter, and inspect all {events.length} campus events with duplicate session grouping.
                  </p>
                </div>
                <button
                  type="button"
                  className="relay-btn-ghost"
                  onClick={() => navigate("/events")}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", fontSize: "13px" }}
                >
                  <span>Open Directory</span>
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
                    Publish a university-wide conference, technical workshop, or departmental seminar.
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

              <div className="relay-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--blue-light)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bell size={18} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>System Alerts & Activity</div>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "var(--mute)", margin: "0 0 16px" }}>
                    Review participant registrations, approvals, and automated dispatch delivery logs.
                  </p>
                </div>
                <button
                  type="button"
                  className="relay-btn-ghost"
                  onClick={() => navigate("/notifications")}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", fontSize: "13px" }}
                >
                  <span>Audit Notifications</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* ── Recent Platform Events Summary ───────────────────────────── */}
            <div className="relay-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Recent Platform Events</div>
                  <div style={{ fontSize: "12px", color: "var(--mute)" }}>Latest campus sessions created across academic departments and clubs</div>
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

              {recentEvents.length === 0 ? (
                <div className="relay-empty" style={{ padding: "30px 0" }}>No events found on the platform.</div>
              ) : (
                <div className="relay-table-wrap">
                  <table className="relay-table">
                    <thead>
                      <tr>
                        <th style={{ width: "48px" }}>Cover</th>
                        <th>Event Title</th>
                        <th>Organizer</th>
                        <th>Date & Time</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEvents.map((ev) => {
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
                                {ev.venueName || "Online"}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: "12.5px", color: "var(--text)" }}>
                                {ev.organizerClub || ev.createdByName || "University"}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: "12px", color: "var(--text)" }}>
                                {new Date(ev.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
                                onClick={() => navigate(`/event/${ev.id}`)}
                                style={{ fontSize: "11.5px", padding: "3px 8px" }}
                              >
                                View
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
          </>
        )}
      </div>
    </div>
  );
}
