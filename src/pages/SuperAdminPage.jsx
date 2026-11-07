import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { 
  Calendar, CheckCircle2, Users, Clock, FileText, Search, Activity,
  AlertCircle, ShieldCheck, Plus, BarChart2, Eye, Edit, Layers
} from "lucide-react";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

export default function SuperAdminPage({ events = [], isLoading, error }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [dashboard, setDashboard] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    setLoadingDashboard(true);
    relayApi.getSuperAdminDashboard()
      .then(setDashboard)
      .catch(err => console.error("Failed to load superadmin dashboard metrics", err))
      .finally(() => setLoadingDashboard(false));
  }, []);

  const filteredEvents = events.filter(e => {
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
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
        <button 
          className="cc-btn-primary" 
          onClick={() => navigate("/events", { state: { create: true } })} 
          style={{ padding: "10px 18px", fontSize: "13.5px" }}
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      <div className="relay-body">
        {loadingDashboard ? (
          <div className="relay-empty" style={{ padding: "40px 0" }}>Loading platform metrics...</div>
        ) : dashboard && (
          <>
            {/* Platform & User Health */}
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
            
            {/* Event Metrics */}
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "14px" }}>
              Event Lifecycle Breakdown
            </div>
            <div className="relay-stat-grid" style={{ marginBottom: "30px" }}>
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
          </>
        )}

        {/* Platform Events Table */}
        <div className="relay-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="relay-feed-title" style={{ margin: 0, fontSize: "16px" }}>Campus-Wide Events</div>
              <span style={{ fontSize: "12px", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                {filteredEvents.length} Total
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--mute)" }} />
                <input 
                  type="text" 
                  placeholder="Search events or clubs..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: "8px 12px 8px 30px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--bg)" }}
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--surface)" }}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {isLoading && <div className="relay-empty">Loading events...</div>}
          {error && <div className="relay-empty" style={{ color: "var(--coral)" }}>{error}</div>}
          {!isLoading && !error && filteredEvents.length === 0 && <div className="relay-empty">No events found.</div>}

          {!isLoading && !error && filteredEvents.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--mute)" }}>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Event</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Organizer</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Date</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Deadline</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Capacity</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => {
                    const cover = getEventCoverImage(event);
                    return (
                      <tr key={event.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "12px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <img
                              src={cover}
                              alt={event.title}
                              onError={handleImageError}
                              style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                            />
                            <div style={{ fontWeight: 600, color: "var(--text)" }}>{event.title}</div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 10px", color: "var(--text-secondary)" }}>
                          {event.createdByName || "Campus Admin"}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <span style={{ 
                            padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
                            background: event.status === "PUBLISHED" ? "var(--teal-light)" : event.status === "CANCELLED" ? "var(--coral-light)" : "var(--primary-light)",
                            color: event.status === "PUBLISHED" ? "var(--teal)" : event.status === "CANCELLED" ? "var(--coral)" : "var(--primary)"
                          }}>
                            {event.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", color: "var(--text-secondary)" }}>
                          {new Date(event.startTime).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "12px 10px", color: "var(--text-secondary)" }}>
                          {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : "None"}
                        </td>
                        <td style={{ padding: "12px 10px", color: "var(--text-secondary)" }}>{event.capacity} seats</td>
                        <td style={{ padding: "12px 10px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="relay-btn-ghost relay-btn-sm"
                              onClick={() => navigate(`/event/${event.id}`)}
                              title="Public Event Page"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              className="relay-btn-ghost relay-btn-sm"
                              onClick={() => navigate("/events", { state: { editEventId: event.id } })}
                              title="Edit Event Settings"
                            >
                              <Edit size={13} />
                            </button>
                            <button 
                              type="button"
                              className="relay-btn-ghost relay-btn-sm"
                              onClick={() => navigate(`/admin/events/${event.id}/analytics`)}
                              title="View Event Analytics"
                            >
                              <BarChart2 size={13} />
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
    </>
  );
}
