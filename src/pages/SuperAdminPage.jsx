import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { 
  Calendar, CheckCircle2, Users, Clock, FileText, Search, Activity,
  AlertCircle, ShieldCheck, Plus, BarChart2, Eye, Edit, Layers,
  LayoutGrid, List, RotateCcw, MoreVertical, ChevronDown, ChevronRight, Copy
} from "lucide-react";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

export default function SuperAdminPage({ events = [], isLoading, error }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [dashboard, setDashboard] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [organizerFilter, setOrganizerFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_ASC");
  const [viewMode, setViewMode] = useState("LIST");
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedDuplicates, setExpandedDuplicates] = useState({});

  useEffect(() => {
    setLoadingDashboard(true);
    relayApi.getSuperAdminDashboard()
      .then(setDashboard)
      .catch(err => console.error("Failed to load superadmin dashboard metrics", err))
      .finally(() => setLoadingDashboard(false));
  }, []);

  const availableOrganizers = Array.from(
    new Set(events.map(e => e.createdByName || e.organizerClub).filter(Boolean))
  ).sort();

  const isFiltered = search || statusFilter !== "ALL" || categoryFilter !== "ALL" || timeFilter !== "ALL" || modeFilter !== "ALL" || organizerFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setTimeFilter("ALL");
    setModeFilter("ALL");
    setOrganizerFilter("ALL");
    setSortBy("DATE_ASC");
  };

  const now = new Date();
  const filteredEvents = events.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = e.title?.toLowerCase().includes(q);
      const matchVenue = e.venueName?.toLowerCase().includes(q);
      const matchOrg = (e.createdByName || e.organizerClub)?.toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchOrg) return false;
    }
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
    if (modeFilter !== "ALL" && e.registrationMode !== modeFilter) return false;
    if (organizerFilter !== "ALL" && (e.createdByName || e.organizerClub) !== organizerFilter) return false;
    if (timeFilter !== "ALL") {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime || e.startTime);
      if (timeFilter === "UPCOMING" && start <= now) return false;
      if (timeFilter === "ONGOING" && (start > now || end < now)) return false;
      if (timeFilter === "PAST" && end >= now) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "DATE_ASC") return new Date(a.startTime) - new Date(b.startTime);
    if (sortBy === "DATE_DESC") return new Date(b.startTime) - new Date(a.startTime);
    if (sortBy === "TITLE_ASC") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "CAPACITY_DESC") return (b.capacity || 0) - (a.capacity || 0);
    return 0;
  });

  const normalizeKey = (e) => {
    const t = (e.title || "").trim().toLowerCase();
    const v = (e.venueName || "").trim().toLowerCase();
    const s = e.startTime ? e.startTime.slice(0, 16) : "";
    const o = (e.organizerClub || e.createdByName || "").trim().toLowerCase();
    return `${t}__${v}__${s}__${o}`;
  };

  const groupedEvents = React.useMemo(() => {
    const map = new Map();
    filteredEvents.forEach(e => {
      const k = normalizeKey(e);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      primary: items[0],
      items,
      count: items.length,
      hasDuplicates: items.length > 1
    }));
  }, [filteredEvents]);

  const toggleDuplicateExpand = (key) => {
    setExpandedDuplicates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleActionMenu = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setOpenMenuId(prev => (prev === id ? null : id));
  };

  return (
    <div onClick={() => setOpenMenuId(null)}>
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

        {/* Platform Events Directory */}
        <div className="relay-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="relay-feed-title" style={{ margin: 0, fontSize: "16px" }}>Campus-Wide Events Directory</div>
              <span style={{ fontSize: "12px", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                {filteredEvents.length} of {events.length} Events
              </span>
              {isFiltered && (
                <button 
                  type="button" 
                  onClick={clearFilters}
                  className="relay-btn-ghost relay-btn-sm"
                  style={{ fontSize: "11.5px", padding: "3px 8px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <RotateCcw size={12} /> Reset Filters
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="cc-view-toggle">
              <button
                type="button"
                className={`cc-view-toggle-btn ${viewMode === "LIST" ? "active" : ""}`}
                onClick={() => setViewMode("LIST")}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                className={`cc-view-toggle-btn ${viewMode === "GRID" ? "active" : ""}`}
                onClick={() => setViewMode("GRID")}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {/* Directory Toolbar */}
          <div className="cc-directory-toolbar">
            {/* Row 1: Search, Status, Category, Time */}
            <div className="cc-filter-row">
              <div style={{ position: "relative", flexGrow: 1, minWidth: "220px" }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "11px", color: "var(--mute)" }} />
                <input 
                  type="text" 
                  placeholder="Search events, clubs, organizers..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--bg)", boxSizing: "border-box" }}
                />
              </div>

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--surface)" }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--surface)" }}
              >
                <option value="ALL">All Categories</option>
                <option value="WORKSHOP">Workshop / Tech</option>
                <option value="SEMINAR">Seminar / Keynote</option>
                <option value="CULTURAL">Cultural & Arts</option>
                <option value="SPORTS">Sports & Athletics</option>
                <option value="OTHER">Other Competitions</option>
              </select>

              <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--surface)" }}
              >
                <option value="ALL">All Timelines</option>
                <option value="UPCOMING">Upcoming Events</option>
                <option value="ONGOING">Ongoing Events</option>
                <option value="PAST">Past Events</option>
              </select>
            </div>

            {/* Row 2: Mode, Organizer, Sort */}
            <div className="cc-filter-row" style={{ fontSize: "12.5px" }}>
              <select 
                value={modeFilter} 
                onChange={(e) => setModeFilter(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12.5px", outline: "none", background: "var(--surface)" }}
              >
                <option value="ALL">All Registration Modes</option>
                <option value="OPEN">Open Registration</option>
                <option value="APPROVAL_REQUIRED">Approval Required</option>
                <option value="INVITE_ONLY">Invite Only</option>
              </select>

              {availableOrganizers.length > 0 && (
                <select 
                  value={organizerFilter} 
                  onChange={(e) => setOrganizerFilter(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12.5px", outline: "none", background: "var(--surface)" }}
                >
                  <option value="ALL">All Organizers & Clubs</option>
                  {availableOrganizers.map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              )}

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--mute)", fontSize: "12px" }}>Sort:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12.5px", outline: "none", background: "var(--surface)" }}
                >
                  <option value="DATE_ASC">Date: Soonest First</option>
                  <option value="DATE_DESC">Date: Latest First</option>
                  <option value="TITLE_ASC">Title: A to Z</option>
                  <option value="CAPACITY_DESC">Capacity: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading && <div className="relay-empty">Loading events...</div>}
          {error && <div className="relay-empty" style={{ color: "var(--coral)" }}>{error}</div>}
          {!isLoading && !error && filteredEvents.length === 0 && (
            <div className="relay-empty" style={{ padding: "40px 0" }}>
              <Calendar size={32} style={{ color: "var(--mute)", margin: "0 auto 10px" }} />
              <p>No events found matching your filter criteria.</p>
              {isFiltered && (
                <button type="button" className="relay-btn-ghost relay-btn-sm" onClick={clearFilters} style={{ marginTop: "10px" }}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* List View Table */}
          {!isLoading && !error && filteredEvents.length > 0 && viewMode === "LIST" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--mute)" }}>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Event</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Category</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Organizer</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Registration</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Date & Venue</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600 }}>Capacity</th>
                    <th style={{ padding: "12px 10px", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedEvents.map(group => {
                    const event = group.primary;
                    const cover = getEventCoverImage(event);
                    const isExpanded = Boolean(expandedDuplicates[group.key]);

                    return (
                      <React.Fragment key={group.key}>
                        <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "10px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <img
                                src={cover}
                                alt={event.title}
                                onError={handleImageError}
                                style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: "var(--text)" }}>{event.title}</div>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginTop: "2px" }}>
                                  <span style={{ fontSize: "11px", color: "var(--mute)" }}>
                                    ID: #{event.id}
                                  </span>
                                  {event.institutionalOnly && (
                                    <span style={{ background: "rgba(108,59,238,0.1)", color: "var(--primary)", padding: "1px 5px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                                      Thapar Exclusive
                                    </span>
                                  )}
                                  {group.hasDuplicates && (
                                    <button
                                      type="button"
                                      className="cc-duplicate-pill"
                                      onClick={(e) => { e.stopPropagation(); toggleDuplicateExpand(group.key); }}
                                      title="Click to view identical session records in database"
                                    >
                                      <Copy size={10} /> {group.count} Identical Records {isExpanded ? "▲" : "▼"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 10px", color: "var(--text-secondary)", fontSize: "12px" }}>
                            {event.category}
                          </td>
                          <td style={{ padding: "10px 10px", color: "var(--text-secondary)" }}>
                            {event.organizerClub || event.createdByName || "Campus Admin"}
                          </td>
                          <td style={{ padding: "10px 10px" }}>
                            <span style={{ 
                              padding: "2px 7px", borderRadius: "6px", fontSize: "11px", fontWeight: 500,
                              background: event.registrationMode === "APPROVAL_REQUIRED" ? "var(--amber-light)" : "var(--bg)",
                              color: event.registrationMode === "APPROVAL_REQUIRED" ? "var(--amber)" : "var(--mute)",
                              border: "1px solid var(--border)"
                            }}>
                              {event.registrationMode === "APPROVAL_REQUIRED" ? "Approval Req." : event.registrationMode || "Open"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 10px" }}>
                            <span style={{ 
                              padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600,
                              background: event.status === "PUBLISHED" ? "var(--teal-light)" : event.status === "CANCELLED" ? "var(--coral-light)" : "var(--primary-light)",
                              color: event.status === "PUBLISHED" ? "var(--teal)" : event.status === "CANCELLED" ? "var(--coral)" : "var(--primary)"
                            }}>
                              {event.status}
                            </span>
                          </td>
                          <td style={{ padding: "10px 10px", color: "var(--text-secondary)", fontSize: "12px" }}>
                            <div>{new Date(event.startTime).toLocaleDateString()}</div>
                            <div style={{ color: "var(--mute)", fontSize: "11px" }}>
                              {event.isVirtual ? "Virtual Event" : event.venueName}
                            </div>
                          </td>
                          <td style={{ padding: "10px 10px", color: "var(--text-secondary)", fontSize: "12px" }}>
                            {event.capacity} seats
                          </td>
                          <td style={{ padding: "10px 10px", textAlign: "right" }}>
                            <div className="cc-action-menu-container">
                              <button
                                type="button"
                                className="cc-action-menu-btn"
                                onClick={(e) => toggleActionMenu(event.id, e)}
                                title="Actions"
                              >
                                <MoreVertical size={15} />
                              </button>
                              {openMenuId === event.id && (
                                <div className="cc-action-dropdown">
                                  <button
                                    type="button"
                                    className="cc-action-dropdown-item"
                                    onClick={() => { setOpenMenuId(null); navigate(`/event/${event.id}`); }}
                                  >
                                    <Eye size={13} style={{ color: "var(--teal)" }} /> View Public Page
                                  </button>
                                  <button
                                    type="button"
                                    className="cc-action-dropdown-item"
                                    onClick={() => { setOpenMenuId(null); navigate("/events", { state: { editEventId: event.id } }); }}
                                  >
                                    <Edit size={13} style={{ color: "var(--primary)" }} /> Edit Settings
                                  </button>
                                  <button
                                    type="button"
                                    className="cc-action-dropdown-item"
                                    onClick={() => { setOpenMenuId(null); navigate(`/admin/events/${event.id}/analytics`); }}
                                  >
                                    <BarChart2 size={13} style={{ color: "var(--amber)" }} /> Analytics
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded sub-rows showing duplicate IDs */}
                        {isExpanded && group.items.slice(1).map(dup => (
                          <tr key={dup.id} className="cc-duplicate-subrow" style={{ borderBottom: "1px solid var(--border-light)" }}>
                            <td style={{ padding: "8px 10px 8px 32px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                                <span style={{ color: "var(--primary)", fontWeight: 700 }}>↳ Duplicate Session #{dup.id}:</span>
                                <span style={{ color: "var(--mute)", fontSize: "11px" }}>
                                  Created {new Date(dup.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "8px 10px", color: "var(--mute)", fontSize: "11.5px" }}>{dup.category}</td>
                            <td style={{ padding: "8px 10px", color: "var(--mute)", fontSize: "11.5px" }}>{dup.organizerClub || dup.createdByName}</td>
                            <td style={{ padding: "8px 10px", color: "var(--mute)", fontSize: "11.5px" }}>{dup.registrationMode}</td>
                            <td style={{ padding: "8px 10px" }}>
                              <span style={{ 
                                padding: "1px 6px", borderRadius: "8px", fontSize: "10.5px", fontWeight: 600,
                                background: dup.status === "PUBLISHED" ? "var(--teal-light)" : "var(--primary-light)",
                                color: dup.status === "PUBLISHED" ? "var(--teal)" : "var(--primary)"
                              }}>
                                {dup.status}
                              </span>
                            </td>
                            <td style={{ padding: "8px 10px", color: "var(--mute)", fontSize: "11.5px" }}>{new Date(dup.startTime).toLocaleDateString()}</td>
                            <td style={{ padding: "8px 10px", color: "var(--mute)", fontSize: "11.5px" }}>{dup.capacity} seats</td>
                            <td style={{ padding: "8px 10px", textAlign: "right" }}>
                              <div className="cc-action-menu-container">
                                <button
                                  type="button"
                                  className="cc-action-menu-btn"
                                  onClick={(e) => toggleActionMenu(dup.id, e)}
                                  title="Actions for this session"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {openMenuId === dup.id && (
                                  <div className="cc-action-dropdown">
                                    <button
                                      type="button"
                                      className="cc-action-dropdown-item"
                                      onClick={() => { setOpenMenuId(null); navigate(`/event/${dup.id}`); }}
                                    >
                                      <Eye size={13} style={{ color: "var(--teal)" }} /> View Public Page
                                    </button>
                                    <button
                                      type="button"
                                      className="cc-action-dropdown-item"
                                      onClick={() => { setOpenMenuId(null); navigate("/events", { state: { editEventId: dup.id } }); }}
                                    >
                                      <Edit size={13} style={{ color: "var(--primary)" }} /> Edit Settings
                                    </button>
                                    <button
                                      type="button"
                                      className="cc-action-dropdown-item"
                                      onClick={() => { setOpenMenuId(null); navigate(`/admin/events/${dup.id}/analytics`); }}
                                    >
                                      <BarChart2 size={13} style={{ color: "var(--amber)" }} /> Analytics
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Grid View */}
          {!isLoading && !error && filteredEvents.length > 0 && viewMode === "GRID" && (
            <div className="cc-directory-grid">
              {groupedEvents.map(group => {
                const event = group.primary;
                const cover = getEventCoverImage(event);
                const isExpanded = Boolean(expandedDuplicates[group.key]);

                return (
                  <div 
                    key={group.key}
                    style={{ 
                      background: "var(--surface)", 
                      border: "1px solid var(--border)", 
                      borderRadius: "14px", 
                      overflow: "hidden", 
                      display: "flex", 
                      flexDirection: "column",
                      transition: "transform .2s ease, box-shadow .2s ease",
                    }}
                  >
                    <div style={{ position: "relative", height: "140px", width: "100%", background: "#17152B" }}>
                      <img 
                        src={cover} 
                        alt={event.title} 
                        onError={handleImageError}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                      <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "6px" }}>
                        {group.hasDuplicates && (
                          <span style={{ 
                            padding: "2px 8px", borderRadius: "10px", fontSize: "10.5px", fontWeight: 700,
                            background: "rgba(245, 158, 11, 0.9)", color: "#fff"
                          }}>
                            {group.count} Sessions
                          </span>
                        )}
                        <span style={{ 
                          padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                          background: event.status === "PUBLISHED" ? "var(--teal)" : event.status === "CANCELLED" ? "var(--coral)" : "var(--primary)",
                          color: "#fff"
                        }}>
                          {event.status}
                        </span>
                      </div>
                      <div style={{ position: "absolute", bottom: "10px", left: "10px" }}>
                        <span style={{ 
                          padding: "2px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 600,
                          background: "rgba(0,0,0,0.65)", color: "#fff", backdropFilter: "blur(4px)"
                        }}>
                          {event.category}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: "14px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)", marginBottom: "4px" }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--primary)", fontWeight: 600, marginBottom: "8px" }}>
                        By {event.organizerClub || event.createdByName || "Campus Organizer"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--mute)", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div>📅 {new Date(event.startTime).toLocaleDateString()}</div>
                        <div>📍 {event.isVirtual ? "Virtual Event" : event.venueName}</div>
                        <div>👥 Capacity: {event.capacity} seats</div>
                      </div>

                      {group.hasDuplicates && (
                        <div style={{ marginBottom: "10px" }}>
                          <button
                            type="button"
                            className="cc-duplicate-pill"
                            style={{ width: "100%", justifyContent: "center" }}
                            onClick={() => toggleDuplicateExpand(group.key)}
                          >
                            <Copy size={11} /> {group.count} Identical Records (IDs: #{group.items.map(i => i.id).join(', #')}) {isExpanded ? "▲" : "▼"}
                          </button>
                          {isExpanded && (
                            <div style={{ marginTop: "6px", padding: "8px", background: "var(--bg)", borderRadius: "8px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "4px" }}>
                              {group.items.map(i => (
                                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span>ID #{i.id} ({i.status})</span>
                                  <button
                                    type="button"
                                    className="relay-btn-ghost relay-btn-sm"
                                    style={{ fontSize: "10px", padding: "1px 5px" }}
                                    onClick={() => navigate("/events", { state: { editEventId: i.id } })}
                                  >
                                    Edit
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ 
                          fontSize: "11px", color: "var(--mute)",
                          background: "var(--bg)", padding: "2px 6px", borderRadius: "6px", border: "1px solid var(--border)"
                        }}>
                          {event.registrationMode === "APPROVAL_REQUIRED" ? "Approval Req." : "Open"}
                        </span>

                        <div className="cc-action-menu-container">
                          <button
                            type="button"
                            className="cc-action-menu-btn"
                            onClick={(e) => toggleActionMenu(event.id, e)}
                            title="Actions"
                          >
                            <MoreVertical size={15} />
                          </button>
                          {openMenuId === event.id && (
                            <div className="cc-action-dropdown">
                              <button
                                type="button"
                                className="cc-action-dropdown-item"
                                onClick={() => { setOpenMenuId(null); navigate(`/event/${event.id}`); }}
                              >
                                <Eye size={13} style={{ color: "var(--teal)" }} /> View Public Page
                              </button>
                              <button
                                type="button"
                                className="cc-action-dropdown-item"
                                onClick={() => { setOpenMenuId(null); navigate("/events", { state: { editEventId: event.id } }); }}
                              >
                                <Edit size={13} style={{ color: "var(--primary)" }} /> Edit Settings
                              </button>
                              <button
                                type="button"
                                className="cc-action-dropdown-item"
                                onClick={() => { setOpenMenuId(null); navigate(`/admin/events/${event.id}/analytics`); }}
                              >
                                <BarChart2 size={13} style={{ color: "var(--amber)" }} /> Analytics
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
