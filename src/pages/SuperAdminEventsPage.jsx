import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, CheckCircle2, Users, Clock, Search, 
  Plus, BarChart2, Eye, Edit,
  LayoutGrid, List, RotateCcw, MoreVertical, ChevronDown, ChevronRight, Copy
} from "lucide-react";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

export default function SuperAdminEventsPage({ events = [], isLoading, error }) {
  const navigate = useNavigate();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [organizerFilter, setOrganizerFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_ASC");
  const [viewMode, setViewMode] = useState("LIST");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedDuplicates, setExpandedDuplicates] = useState({});

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
            <span>Campus-Wide Events Directory</span>
            <span style={{ fontSize: "11.5px", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
              {filteredEvents.length} Events
            </span>
          </h1>
          <p>Browse, inspect, filter, and moderate all active and archived events across campus societies.</p>
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
        {error && <div className="relay-error" style={{ marginBottom: "16px" }}>{error}</div>}

        <div className="relay-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="relay-feed-title" style={{ margin: 0, fontSize: "16px" }}>Platform Events Workspace</div>
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
                <option value="ALL">All Dates</option>
                <option value="UPCOMING">Upcoming Only</option>
                <option value="ONGOING">Ongoing Today</option>
                <option value="PAST">Past Events</option>
              </select>

              <select 
                value={modeFilter} 
                onChange={(e) => setModeFilter(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--surface)" }}
              >
                <option value="ALL">All Entry Modes</option>
                <option value="OPEN">Open Entry</option>
                <option value="APPROVAL_REQUIRED">Approval Required</option>
                <option value="INVITE_ONLY">Invite Only</option>
              </select>

              {availableOrganizers.length > 0 && (
                <select 
                  value={organizerFilter} 
                  onChange={(e) => setOrganizerFilter(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--surface)", maxWidth: "160px" }}
                >
                  <option value="ALL">All Organizers</option>
                  {availableOrganizers.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", background: "var(--surface)" }}
              >
                <option value="DATE_ASC">Earliest First</option>
                <option value="DATE_DESC">Latest First</option>
                <option value="TITLE_ASC">Title (A-Z)</option>
                <option value="CAPACITY_DESC">Capacity (High-Low)</option>
              </select>
            </div>
          </div>

          {/* Directory Content */}
          {isLoading ? (
            <div className="relay-empty" style={{ padding: "40px 0" }}>Loading campus events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="relay-empty" style={{ padding: "40px 0" }}>
              No events found matching current criteria.
            </div>
          ) : viewMode === "LIST" ? (
            <div className="relay-table-wrap">
              <table className="relay-table">
                <thead>
                  <tr>
                    <th style={{ width: "52px" }}>Cover</th>
                    <th>Event Details</th>
                    <th>Organizer</th>
                    <th>Date & Time</th>
                    <th>Venue</th>
                    <th>Registrations</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right", width: "70px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedEvents.map(({ key, primary: event, items, count, hasDuplicates }) => {
                    const isExpanded = !!expandedDuplicates[key];
                    const coverImg = getEventCoverImage(event.id, event.category, event.title);

                    return (
                      <React.Fragment key={key}>
                        <tr style={{ background: hasDuplicates ? "rgba(245, 158, 11, 0.02)" : "transparent" }}>
                          <td>
                            <img
                              src={coverImg}
                              alt=""
                              onError={handleImageError}
                              style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--border)" }}
                            />
                          </td>

                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontWeight: 600, color: "var(--text)", fontSize: "13.5px" }}>
                                {event.title}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "11px", color: "var(--mute)" }}>
                                  ID: {event.id.slice(0, 8)}...
                                </span>
                                <span style={{ fontSize: "10.5px", background: "var(--border-light)", color: "var(--text-secondary)", padding: "1px 5px", borderRadius: "4px" }}>
                                  {event.category || "EVENT"}
                                </span>
                                {event.registrationMode === "APPROVAL_REQUIRED" && (
                                  <span style={{ fontSize: "10.5px", background: "var(--amber-light)", color: "var(--amber)", padding: "1px 5px", borderRadius: "4px", fontWeight: 600 }}>
                                    Approval
                                  </span>
                                )}
                              </div>

                              {hasDuplicates && (
                                <button
                                  type="button"
                                  className="cc-duplicate-pill"
                                  onClick={() => toggleDuplicateExpand(key)}
                                >
                                  {count} identical sessions
                                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                              )}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: "13px", color: "var(--text)" }}>
                              {event.organizerClub || event.createdByName || "University"}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: "12.5px", color: "var(--text)" }}>
                              {new Date(event.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--mute)" }}>
                              {new Date(event.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </div>
                          </td>

                          <td>
                            <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                              {event.venueName || (event.isVirtual ? "Virtual" : "Main Campus")}
                            </span>
                          </td>

                          <td>
                            <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text)" }}>
                              {event.confirmedRegistrations || 0} / {event.capacity}
                            </div>
                            <div style={{ width: "60px", height: "4px", background: "var(--border)", borderRadius: "2px", marginTop: "4px", overflow: "hidden" }}>
                              <div style={{
                                width: `${Math.min(100, Math.round(((event.confirmedRegistrations || 0) / (event.capacity || 1)) * 100))}%`,
                                height: "100%",
                                background: "var(--primary)"
                              }} />
                            </div>
                          </td>

                          <td>
                            <span className={`relay-pill ${
                              event.status === "PUBLISHED" ? "green" :
                              event.status === "DRAFT" ? "amber" :
                              event.status === "COMPLETED" ? "blue" : "coral"
                            }`} style={{ fontSize: "11px", padding: "3px 8px" }}>
                              {event.status}
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>
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
                                  <button
                                    type="button"
                                    className="cc-action-dropdown-item"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      navigator.clipboard?.writeText(event.id);
                                    }}
                                  >
                                    <Copy size={13} style={{ color: "var(--blue)" }} /> Copy ID
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable duplicate child rows */}
                        {hasDuplicates && isExpanded && items.slice(1).map((dup, idx) => (
                          <tr key={dup.id} className="cc-duplicate-subrow">
                            <td style={{ textAlign: "center", color: "var(--mute)", fontSize: "11px" }}>
                              ↳
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                                  ID: {dup.id}
                                </span>
                                <span style={{ fontSize: "10.5px", background: "var(--border)", padding: "1px 6px", borderRadius: "4px" }}>
                                  Copy #{idx + 2}
                                </span>
                              </div>
                            </td>
                            <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {dup.organizerClub || dup.createdByName}
                            </td>
                            <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {new Date(dup.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            </td>
                            <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {dup.venueName}
                            </td>
                            <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {dup.confirmedRegistrations || 0} / {dup.capacity}
                            </td>
                            <td>
                              <span className={`relay-pill ${dup.status === "PUBLISHED" ? "green" : "amber"}`} style={{ fontSize: "10.5px", padding: "2px 6px" }}>
                                {dup.status}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="relay-btn-ghost relay-btn-sm"
                                style={{ fontSize: "11px", padding: "3px 8px" }}
                                onClick={() => navigate("/events", { state: { editEventId: dup.id } })}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="cc-directory-grid">
              {groupedEvents.map(({ key, primary: event, items, count, hasDuplicates }) => {
                const isExpanded = !!expandedDuplicates[key];
                const coverImg = getEventCoverImage(event.id, event.category, event.title);

                return (
                  <div key={key} className="relay-card" style={{ display: "flex", flexDirection: "column", padding: "14px", position: "relative" }}>
                    <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", height: "140px", marginBottom: "12px" }}>
                      <img
                        src={coverImg}
                        alt=""
                        onError={handleImageError}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <span className={`relay-pill ${
                        event.status === "PUBLISHED" ? "green" :
                        event.status === "DRAFT" ? "amber" :
                        event.status === "COMPLETED" ? "blue" : "coral"
                      }`} style={{ position: "absolute", top: "8px", right: "8px", fontSize: "10.5px", padding: "3px 8px" }}>
                        {event.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "10.5px", background: "var(--border-light)", color: "var(--text-secondary)", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                          {event.category || "EVENT"}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--mute)" }}>
                          {event.organizerClub || event.createdByName}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.3 }}>
                        {event.title}
                      </h3>

                      <div style={{ fontSize: "12px", color: "var(--mute)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Calendar size={13} />
                        {new Date(event.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>

                      <div style={{ fontSize: "12px", color: "var(--mute)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                        <Users size={13} />
                        {event.confirmedRegistrations || 0} / {event.capacity} registered
                      </div>

                      {hasDuplicates && (
                        <div style={{ marginBottom: "10px" }}>
                          <button
                            type="button"
                            className="cc-duplicate-pill"
                            onClick={() => toggleDuplicateExpand(key)}
                          >
                            {count} identical sessions
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>

                          {isExpanded && (
                            <div style={{ marginTop: "6px", padding: "6px 8px", background: "var(--bg)", borderRadius: "6px", fontSize: "11px" }}>
                              {items.map((i, idx) => (
                                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none" }}>
                                  <span style={{ fontFamily: "monospace" }}>#{idx + 1} {i.id.slice(0, 8)}...</span>
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
