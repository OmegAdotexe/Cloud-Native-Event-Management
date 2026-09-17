import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { 
  Calendar, CheckCircle2, Users, Clock, FileText, Search, Activity, AlertCircle, ShieldCheck
} from "lucide-react";

export default function SuperAdminPage({ events, isLoading, error }) {
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
          <h1>Hi, {user?.name || "there"}</h1>
          <p>Platform-wide event operations and analytics.</p>
        </div>
      </div>
      <div className="relay-body">
        
        {loadingDashboard ? (
           <div className="relay-empty">Loading platform metrics...</div>
        ) : dashboard && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Platform Health & Users</h2>
            <div className="relay-stat-grid" style={{ marginBottom: "30px" }}>
              <div className="relay-stat-card">
                <div className="relay-stat-icon purple"><Users size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.totalUsers}</div>
                  <div className="relay-stat-label">Total Users</div>
                </div>
              </div>
              <div className="relay-stat-card">
                <div className="relay-stat-icon amber"><ShieldCheck size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.totalEventAdmins}</div>
                  <div className="relay-stat-label">Event Admins</div>
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
                  <div className="relay-stat-label">Total Notifications Processed</div>
                </div>
              </div>
            </div>
            
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Event Metrics</h2>
            <div className="relay-stat-grid" style={{ marginBottom: "30px" }}>
              <div className="relay-stat-card">
                <div className="relay-stat-icon"><Calendar size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.totalEvents}</div>
                  <div className="relay-stat-label">Total Events</div>
                </div>
              </div>
              <div className="relay-stat-card">
                <div className="relay-stat-icon teal"><CheckCircle2 size={20} /></div>
                <div>
                  <div className="relay-stat-num">{dashboard.publishedEvents}</div>
                  <div className="relay-stat-label">Published</div>
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
                  <div className="relay-stat-label">Drafts</div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="relay-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div className="relay-feed-title" style={{ margin: 0 }}>All Platform Events</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--mute)" }} />
                <input 
                  type="text" 
                  placeholder="Search events..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: "8px 12px 8px 30px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "13px", outline: "none" }}
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--surface)" }}
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
                    <th style={{ padding: "12px 8px", fontWeight: 600 }}>Title</th>
                    <th style={{ padding: "12px 8px", fontWeight: 600 }}>Organizer</th>
                    <th style={{ padding: "12px 8px", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 8px", fontWeight: 600 }}>Date</th>
                    <th style={{ padding: "12px 8px", fontWeight: 600 }}>Deadline</th>
                    <th style={{ padding: "12px 8px", fontWeight: 600 }}>Capacity</th>
                    <th style={{ padding: "12px 8px", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => (
                    <tr key={event.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px 8px", fontWeight: 600, color: "var(--text)" }}>{event.title}</td>
                      <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>{event.createdByName}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
                          background: event.status === "PUBLISHED" ? "var(--teal-light)" : "var(--bg)",
                          color: event.status === "PUBLISHED" ? "var(--teal)" : "var(--mute)"
                        }}>
                          {event.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>
                        {new Date(event.startTime).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>
                        {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : "None"}
                      </td>
                      <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>{event.capacity}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button 
                            onClick={() => navigate(`/admin/events/${event.id}/analytics`)}
                            style={{ background: "none", border: "1px solid var(--border)", padding: "6px", borderRadius: "6px", cursor: "pointer", color: "var(--blue)", display: "flex", alignItems: "center" }}
                            title="View Analytics"
                          >
                            <FileText size={14} /> Analytics
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
