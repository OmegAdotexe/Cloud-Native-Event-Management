import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { 
  Calendar, CheckCircle2, Users, Clock, Edit, FileText, Search, Plus
} from "lucide-react";
import AdminRegistrations from "../components/AdminRegistrations.jsx";
import AdminTimeline from "../components/AdminTimeline.jsx";

const initialForm = { title: "", description: "", venueName: "", isVirtual: false, virtualLink: "", startTime: "", endTime: "", registrationDeadline: "", capacity: 1, status: "DRAFT", registrationMode: "OPEN", category: "OTHER", waitlistEnabled: false };
const toInputTime = (value) => value ? value.slice(0, 16) : "";

export default function AdminPage({ events, isLoading, error, onRefresh }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  const [dashboard, setDashboard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("DETAILS");
  
  const selected = events.find((event) => event.id === selectedId);

  useEffect(() => {
    if (location.state?.editEventId && events.length > 0) {
      const ev = events.find(e => e.id === location.state.editEventId);
      if (ev) {
        setSelectedId(ev.id);
        setForm({ ...ev, startTime: toInputTime(ev.startTime), endTime: toInputTime(ev.endTime), registrationDeadline: toInputTime(ev.registrationDeadline) });
        if (location.state.tab) {
          setActiveTab(location.state.tab);
        }
        // clear state so it doesn't reopen on subsequent refreshes
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, events]);

  useEffect(() => {
    relayApi.getAdminDashboard()
      .then(setDashboard)
      .catch(err => console.error("Failed to load dashboard metrics", err));
  }, [events]); // Refresh when events change

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const edit = (event) => { 
    setSelectedId(event.id); 
    setActionError(""); 
    setForm({ ...event, startTime: toInputTime(event.startTime), endTime: toInputTime(event.endTime), registrationDeadline: toInputTime(event.registrationDeadline) }); 
    setActiveTab("DETAILS"); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const reset = () => { 
    setSelectedId(null); 
    setForm(initialForm); 
    setActionError(""); 
    setActiveTab("DETAILS"); 
  };
  
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setActionError("");
    try { 
      selected ? await relayApi.updateEvent(selected.id, form) : await relayApi.createEvent(form); 
      reset(); 
      await onRefresh(); 
    }
    catch (err) { setActionError(err.message || "Unable to save event."); }
    finally { setSaving(false); }
  };
  
  const transition = async (action, data = null) => { 
    setSaving(true); setActionError(""); 
    try { 
      data !== null ? await action(selected.id, data) : await action(selected.id); 
      await onRefresh(); 
    } catch (err) { setActionError(err.message || "Unable to update event."); } 
    finally { setSaving(false); } 
  };

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
          <p>{isSuperAdmin ? "Manage all platform events." : "Manage your campus events and view analytics."}</p>
        </div>
        <button className="relay-btn" onClick={reset} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Plus size={16} /> Create event
        </button>
      </div>

      <div className="relay-body">
        
        {/* Analytics Dashboard Cards */}
        {dashboard && !selectedId && (
          <div className="relay-stat-grid" style={{ marginBottom: "30px" }}>
            <div className="relay-stat-card">
              <div className="relay-stat-icon amber"><Calendar size={20} /></div>
              <div>
                <div className="relay-stat-num">{dashboard.totalEvents}</div>
                <div className="relay-stat-label">All Events</div>
              </div>
            </div>
            <div className="relay-stat-card">
              <div className="relay-stat-icon teal"><CheckCircle2 size={20} /></div>
              <div>
                <div className="relay-stat-num">{dashboard.publishedEvents}</div>
                <div className="relay-stat-label">Published Events</div>
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
              <div className="relay-stat-icon purple"><Clock size={20} /></div>
              <div>
                <div className="relay-stat-num">{dashboard.pendingRegistrations}</div>
                <div className="relay-stat-label">Pending Approvals</div>
              </div>
            </div>
          </div>
        )}

        {/* Edit/Create Form Area */}
        {(selectedId || (form !== initialForm)) && (
          <div className="relay-card" style={{ marginBottom: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="relay-feed-title">{selected ? `Editing: ${selected.title}` : "Create new event"}</div>
              <button className="relay-btn-ghost" onClick={reset}>Cancel</button>
            </div>
            
            {actionError && <div className="relay-auth-error" style={{ marginBottom: 16 }}>{actionError}</div>}
            
            {selected && (
              <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--border)", marginBottom: "20px", paddingBottom: "10px" }}>
                {["DETAILS", "REGISTRATIONS", "TIMELINE"].map(tab => (
                  <div 
                    key={tab} 
                    onClick={() => setActiveTab(tab)} 
                    style={{ 
                      cursor: "pointer", 
                      fontSize: "13px", 
                      fontWeight: 600, 
                      color: activeTab === tab ? "var(--text)" : "var(--mute)",
                      borderBottom: activeTab === tab ? "2px solid var(--amber)" : "none",
                      paddingBottom: "4px",
                      marginBottom: "-12px"
                    }}
                  >
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </div>
                ))}
              </div>
            )}

            {(!selected || activeTab === "DETAILS") && (
              <form onSubmit={save}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="relay-field-label">Title</label>
                    <input className="relay-input" type="text" value={form.title} onChange={(e) => update('title', e.target.value)} required />
                  </div>
                  
                  <div>
                    <label className="relay-field-label">Venue Name</label>
                    <input className="relay-input" type="text" value={form.venueName} onChange={(e) => update('venueName', e.target.value)} required />
                  </div>

                  <div>
                    <label className="relay-field-label">Virtual Link</label>
                    <input className="relay-input" type="text" value={form.virtualLink || ""} onChange={(e) => update('virtualLink', e.target.value)} />
                  </div>

                  <div>
                    <label className="relay-field-label">Start time</label>
                    <input className="relay-input" type="datetime-local" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} required />
                  </div>

                  <div>
                    <label className="relay-field-label">End time</label>
                    <input className="relay-input" type="datetime-local" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} required />
                  </div>

                  <div>
                    <label className="relay-field-label">Registration Deadline</label>
                    <input className="relay-input" type="datetime-local" value={form.registrationDeadline} onChange={(e) => update('registrationDeadline', e.target.value)} required />
                  </div>

                  <div>
                    <label className="relay-field-label">Capacity</label>
                    <input className="relay-input" type="number" min="1" value={form.capacity} onChange={(e) => update('capacity', Number(e.target.value))} required />
                  </div>

                  <div>
                    <label className="relay-field-label">Registration Mode</label>
                    <select className="relay-input" value={form.registrationMode} onChange={(e) => update('registrationMode', e.target.value)}>
                        <option value="OPEN">OPEN</option>
                        <option value="INVITE_ONLY">INVITE ONLY</option>
                        <option value="APPROVAL_REQUIRED">APPROVAL REQUIRED</option>
                    </select>
                  </div>

                  <div>
                    <label className="relay-field-label">Category</label>
                    <select className="relay-input" value={form.category} onChange={(e) => update('category', e.target.value)}>
                        <option value="WORKSHOP">WORKSHOP</option>
                        <option value="SEMINAR">SEMINAR</option>
                        <option value="CULTURAL">CULTURAL</option>
                        <option value="SPORTS">SPORTS</option>
                        <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  
                  <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "10px" }}>
                    <label className="relay-field-label" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                      <input type="checkbox" checked={form.isVirtual || false} onChange={(e) => update('isVirtual', e.target.checked)} style={{ accentColor: "var(--amber)" }} /> 
                      Is Virtual
                    </label>
                    <label className="relay-field-label" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                      <input type="checkbox" checked={form.waitlistEnabled || false} onChange={(e) => update('waitlistEnabled', e.target.checked)} style={{ accentColor: "var(--amber)" }} /> 
                      Enable Waitlist
                    </label>
                  </div>
                  
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="relay-field-label">Description</label>
                    <textarea className="relay-input" value={form.description || ""} onChange={(e) => update('description', e.target.value)} rows={3} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <button className="relay-btn" disabled={saving}>{saving ? "Saving..." : selected ? "Save changes" : "Create draft"}</button>
                  {selected && <button type="button" className="relay-btn" disabled={saving || selected.status === "PUBLISHED"} onClick={() => transition(relayApi.publishEvent)} style={{ background: "var(--teal)", color: "#fff" }}>Publish</button>}
                  {selected && <button type="button" className="relay-btn-danger" disabled={saving || selected.status === "CANCELLED"} onClick={() => { const reason = window.prompt("Reason for cancellation?"); if(reason) transition(relayApi.cancelEvent, reason); }}>Cancel Event</button>}
                  {selected && <button type="button" className="relay-btn-danger" disabled={saving} onClick={() => transition(relayApi.deleteEvent)}>Delete</button>}
                </div>
              </form>
            )}

            {selected && activeTab === "REGISTRATIONS" && <div style={{ marginTop: "-24px" }}><AdminRegistrations event={selected} /></div>}
            {selected && activeTab === "TIMELINE" && <div style={{ marginTop: "-24px" }}><AdminTimeline event={selected} /></div>}
          </div>
        )}

        {/* Event List Table */}
        {!selectedId && (form === initialForm) && (
          <div className="relay-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div className="relay-feed-title" style={{ margin: 0 }}>My Events</div>
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
                              onClick={() => { edit(event); setTimeout(() => setActiveTab("REGISTRATIONS"), 0); }}
                              style={{ background: "none", border: "1px solid var(--border)", padding: "6px", borderRadius: "6px", cursor: "pointer", color: "var(--mute)", display: "flex", alignItems: "center" }}
                              title="Manage Registrations"
                            >
                              <Users size={14} />
                            </button>
                            <button 
                              onClick={() => edit(event)}
                              style={{ background: "none", border: "1px solid var(--border)", padding: "6px", borderRadius: "6px", cursor: "pointer", color: "var(--mute)", display: "flex", alignItems: "center" }}
                              title="Edit Event"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => navigate(`/admin/events/${event.id}/analytics`)}
                              style={{ background: "none", border: "1px solid var(--border)", padding: "6px", borderRadius: "6px", cursor: "pointer", color: "var(--blue)", display: "flex", alignItems: "center" }}
                              title="View Analytics"
                            >
                              <FileText size={14} />
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
        )}
      </div>
    </>
  );
}
