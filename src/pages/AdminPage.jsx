import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { 
  Calendar, CheckCircle2, Users, Clock, Edit, FileText, Search, Plus,
  BarChart2, Eye, MapPin, Globe, Sparkles, AlertCircle, ShieldCheck,
  LayoutGrid, List, Filter, RotateCcw, MoreVertical, ChevronDown, ChevronRight, Copy, Layers
} from "lucide-react";
import AdminRegistrations from "../components/AdminRegistrations.jsx";
import AdminTimeline from "../components/AdminTimeline.jsx";
import ImageUploader from "../components/ImageUploader.jsx";
import EventCard from "../components/EventCard.jsx";
import { getCustomEventImages, saveCustomEventImages } from "../services/imageStorageService.js";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

const initialForm = {
  title: "",
  description: "",
  venueName: "",
  isVirtual: false,
  virtualLink: "",
  startTime: "",
  endTime: "",
  registrationDeadline: "",
  capacity: 50,
  status: "DRAFT",
  registrationMode: "OPEN",
  category: "WORKSHOP",
  waitlistEnabled: false,
  organizerClub: "",
};

const toInputTime = (value) => value ? value.slice(0, 16) : "";

export default function AdminPage({ events = [], isLoading, error, onRefresh }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  const [dashboard, setDashboard] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [customPoster, setCustomPoster] = useState(null);
  const [customGallery, setCustomGallery] = useState([]);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [clubFilter, setClubFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_ASC");
  const [viewMode, setViewMode] = useState("LIST");
  const [activeTab, setActiveTab] = useState("DETAILS");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedDuplicates, setExpandedDuplicates] = useState({});
  
  const selected = events.find((event) => event.id === selectedId);

  useEffect(() => {
    if (location.state?.create) {
      setSelectedId(null);
      setIsCreating(true);
      setForm(initialForm);
      setCustomPoster(null);
      setCustomGallery([]);
      setActionError("");
      setActiveTab("DETAILS");
      window.history.replaceState({}, document.title);
    } else if (location.state?.editEventId && events.length > 0) {
      const ev = events.find(e => e.id === location.state.editEventId);
      if (ev) {
        setSelectedId(ev.id);
        setIsCreating(false);
        const images = getCustomEventImages(ev.id);
        setCustomPoster(images?.poster || null);
        setCustomGallery(images?.gallery || []);
        setForm({
          ...ev,
          startTime: toInputTime(ev.startTime),
          endTime: toInputTime(ev.endTime),
          registrationDeadline: toInputTime(ev.registrationDeadline),
          organizerClub: ev.organizerClub || "",
        });
        if (location.state.tab) {
          setActiveTab(location.state.tab);
        }
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, events]);

  useEffect(() => {
    relayApi.getAdminDashboard()
      .then(setDashboard)
      .catch(err => console.error("Failed to load dashboard metrics", err));

    relayApi.getPendingRegistrations(0, 20)
      .then(res => setPendingApprovals(res.content || []))
      .catch(err => console.warn("Failed to load pending registrations", err));
  }, [events]);

  const refreshPending = () => {
    relayApi.getPendingRegistrations(0, 20)
      .then(res => setPendingApprovals(res.content || []))
      .catch(() => {});
    relayApi.getAdminDashboard()
      .then(setDashboard)
      .catch(() => {});
  };

  const handlePendingApprove = async (eventId, regId) => {
    try {
      await relayApi.approveRegistration(eventId, regId);
      refreshPending();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || "Approval failed");
    }
  };

  const handlePendingReject = async (eventId, regId) => {
    const reason = window.prompt("Reason for rejection (optional):");
    if (reason === null) return;
    try {
      await relayApi.rejectRegistration(eventId, regId, reason);
      refreshPending();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || "Rejection failed");
    }
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setForm(initialForm);
    setCustomPoster(null);
    setCustomGallery([]);
    setActionError("");
    setActiveTab("DETAILS");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const edit = (event) => { 
    setSelectedId(event.id); 
    setIsCreating(false);
    setActionError(""); 
    const images = getCustomEventImages(event.id);
    setCustomPoster(images?.poster || null);
    setCustomGallery(images?.gallery || []);
    setForm({
      ...event,
      startTime: toInputTime(event.startTime),
      endTime: toInputTime(event.endTime),
      registrationDeadline: toInputTime(event.registrationDeadline),
      organizerClub: event.organizerClub || "",
    }); 
    setActiveTab("DETAILS"); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const reset = () => { 
    setSelectedId(null); 
    setIsCreating(false);
    setForm(initialForm); 
    setCustomPoster(null);
    setCustomGallery([]);
    setActionError(""); 
    setActiveTab("DETAILS"); 
  };
  
  const save = async (e) => {
    e.preventDefault(); 
    setActionError("");

    if (!form.title?.trim()) {
      setActionError("Title is required.");
      return;
    }

    if (!form.isVirtual && !form.venueName?.trim()) {
      setActionError("Venue name is required for in-person events.");
      return;
    }

    if (form.isVirtual && !form.virtualLink?.trim()) {
      setActionError("Virtual link is required for virtual events.");
      return;
    }

    if (!form.startTime || !form.endTime || !form.registrationDeadline) {
      setActionError("Start time, end time, and registration deadline are all required.");
      return;
    }

    const startTime = new Date(form.startTime);
    const endTime = new Date(form.endTime);
    const deadline = new Date(form.registrationDeadline);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || isNaN(deadline.getTime())) {
      setActionError("Please provide valid dates and times.");
      return;
    }

    if (endTime <= startTime) {
      setActionError("End time must be after start time.");
      return;
    }

    if (deadline >= startTime) {
      setActionError("Registration deadline must be before start time.");
      return;
    }

    if (!form.capacity || Number(form.capacity) < 1) {
      setActionError("Capacity must be at least 1.");
      return;
    }

    setSaving(true);
    try { 
      const payload = {
        title: form.title.trim(),
        description: form.description || "",
        venueName: form.isVirtual && !form.venueName?.trim() ? "Virtual / Online" : form.venueName.trim(),
        isVirtual: Boolean(form.isVirtual),
        virtualLink: form.virtualLink?.trim() || "",
        startTime: form.startTime.length === 16 ? form.startTime + ":00" : form.startTime,
        endTime: form.endTime.length === 16 ? form.endTime + ":00" : form.endTime,
        registrationDeadline: form.registrationDeadline.length === 16 ? form.registrationDeadline + ":00" : form.registrationDeadline,
        capacity: Number(form.capacity),
        status: form.status || "DRAFT",
        registrationMode: form.registrationMode || "OPEN",
        category: form.category || "OTHER",
        waitlistEnabled: Boolean(form.waitlistEnabled),
      };

      const result = selected
        ? await relayApi.updateEvent(selected.id, payload)
        : await relayApi.createEvent(payload); 

      // Save custom uploaded images in client storage / S3 service
      const targetId = selected ? selected.id : result?.id;
      if (targetId && (customPoster || customGallery.length > 0)) {
        saveCustomEventImages(targetId, {
          poster: customPoster,
          gallery: customGallery,
        });
        if (form.title) {
          saveCustomEventImages(form.title, {
            poster: customPoster,
            gallery: customGallery,
          });
        }
      }

      reset(); 
      await onRefresh(); 
    }
    catch (err) {
      setActionError(err.message || "Unable to save event.");
    }
    finally {
      setSaving(false);
    }
  };
  
  const transition = async (action, data = null) => { 
    setSaving(true);
    setActionError(""); 
    try { 
      data !== null ? await action(selected.id, data) : await action(selected.id); 
      await onRefresh(); 
    } catch (err) {
      setActionError(err.message || "Unable to update event.");
    } 
    finally {
      setSaving(false);
    } 
  };

  const availableClubs = Array.from(
    new Set(events.map(e => e.organizerClub || e.organizer).filter(Boolean))
  ).sort();

  const isFiltered = search || statusFilter !== "ALL" || categoryFilter !== "ALL" || timeFilter !== "ALL" || modeFilter !== "ALL" || clubFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setTimeFilter("ALL");
    setModeFilter("ALL");
    setClubFilter("ALL");
    setSortBy("DATE_ASC");
  };

  const now = new Date();
  const filteredEvents = events.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = e.title?.toLowerCase().includes(q);
      const matchVenue = e.venueName?.toLowerCase().includes(q);
      const matchClub = (e.organizerClub || e.organizer)?.toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchClub) return false;
    }
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
    if (modeFilter !== "ALL" && e.registrationMode !== modeFilter) return false;
    if (clubFilter !== "ALL" && (e.organizerClub || e.organizer) !== clubFilter) return false;
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
            <span>Hi, {user?.name || "Organizer"}</span>
            <span style={{ fontSize: "11.5px", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
              {isSuperAdmin ? "Super Admin" : "Event Organizer"}
            </span>
          </h1>
          <p>{isSuperAdmin ? "Manage all university events, registrations, and platform operations." : "Manage your campus events, review attendees, and view analytics."}</p>
        </div>
        <button className="cc-btn-primary" onClick={openCreate} style={{ padding: "10px 18px", fontSize: "13.5px" }}>
          <Plus size={16} /> Create Event
        </button>
      </div>

      <div className="relay-body">
        {/* KPI Stat Cards */}
        {dashboard && !selectedId && !isCreating && (
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

        {/* ── Pending Approvals Quick-Action Banner ───────────────────────────── */}
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
                      className="relay-btn relay-btn-sm"
                      style={{ background: "var(--teal)", color: "#fff" }}
                      onClick={() => handlePendingApprove(reg.eventId, reg.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="relay-btn-danger relay-btn-sm"
                      onClick={() => handlePendingReject(reg.eventId, reg.id)}
                    >
                      Reject
                    </button>
                    <button
                      className="relay-btn-ghost relay-btn-sm"
                      onClick={() => {
                        const ev = events.find(e => e.id === reg.eventId);
                        if (ev) {
                          edit(ev);
                          setActiveTab("REGISTRATIONS");
                        }
                      }}
                    >
                      View Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Event Create / Edit Form ───────────────────────────── */}
        {(selectedId || isCreating) && (
          <div className="relay-card" style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="cc-brand-icon" style={{ width: "32px", height: "32px" }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
                    {selected ? `Editing: ${selected.title}` : "Create New Campus Event"}
                  </h2>
                  <p style={{ fontSize: "12px", color: "var(--mute)", margin: 0 }}>
                    Configure event details, cover poster, schedule, and attendee capacity
                  </p>
                </div>
              </div>
              <button className="relay-btn-ghost relay-btn-sm" onClick={reset}>Close Form</button>
            </div>
            
            {actionError && <div className="relay-auth-error" style={{ marginBottom: 16 }}>{actionError}</div>}
            
            {selected && (
              <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
                {[
                  { id: "DETAILS", label: "Event Details & Media" },
                  { id: "REGISTRATIONS", label: "Attendees & Approvals" },
                  { id: "TIMELINE", label: "Live Schedule Timeline" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)} 
                    style={{ 
                      background: "transparent",
                      border: "none",
                      cursor: "pointer", 
                      fontSize: "13.5px", 
                      fontWeight: activeTab === tab.id ? 700 : 500, 
                      color: activeTab === tab.id ? "var(--primary)" : "var(--mute)",
                      borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "none",
                      padding: "8px 4px 12px",
                      transition: "all .2s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {(!selected || activeTab === "DETAILS") && (
              <form onSubmit={save}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px", alignItems: "start" }}>
                  
                  {/* Left Column: Form Fields */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label className="relay-field-label">Event Title <span style={{ color: "var(--primary)" }}>*</span></label>
                      <input
                        className="relay-input"
                        type="text"
                        placeholder="e.g. Annual University Hackathon 2026"
                        value={form.title}
                        onChange={(e) => update('title', e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label className="relay-field-label">Event Category <span style={{ color: "var(--primary)" }}>*</span></label>
                        <select className="relay-input" value={form.category} onChange={(e) => update('category', e.target.value)}>
                          <option value="WORKSHOP">Workshop / Tech</option>
                          <option value="SEMINAR">Seminar / Keynote</option>
                          <option value="CULTURAL">Cultural & Arts</option>
                          <option value="SPORTS">Sports & Athletics</option>
                          <option value="OTHER">Other Competition</option>
                        </select>
                      </div>

                      <div>
                        <label className="relay-field-label">Organizing Club or Society</label>
                        <input
                          className="relay-input"
                          type="text"
                          placeholder="e.g. Computer Science Society"
                          value={form.organizerClub || ""}
                          onChange={(e) => update('organizerClub', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Image Upload Area */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px" }}>
                      <ImageUploader
                        label="Event Poster / Cover Photo"
                        currentImage={customPoster}
                        onImageSelected={(base64) => setCustomPoster(base64)}
                        onImageRemoved={() => setCustomPoster(null)}
                        allowGallery={true}
                        galleryImages={customGallery}
                        onGalleryUpdated={(imgs) => setCustomGallery(imgs)}
                      />
                    </div>

                    {/* Venue & Virtual Toggle */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label className="relay-field-label">
                          Venue Location {!form.isVirtual && <span style={{ color: "var(--primary)" }}>*</span>}
                        </label>
                        <input 
                          className="relay-input" 
                          type="text" 
                          value={form.venueName} 
                          onChange={(e) => update('venueName', e.target.value)} 
                          placeholder={form.isVirtual ? "Virtual / Online" : "e.g. Main Auditorium Hall A"}
                          required={!form.isVirtual} 
                        />
                      </div>

                      <div>
                        <label className="relay-field-label">
                          Virtual Link {form.isVirtual && <span style={{ color: "var(--coral)" }}>*</span>}
                        </label>
                        <input 
                          className="relay-input" 
                          type="text" 
                          value={form.virtualLink || ""} 
                          onChange={(e) => update('virtualLink', e.target.value)} 
                          placeholder={form.isVirtual ? "https://meet.google.com/xyz" : "Optional unless virtual"}
                          required={form.isVirtual}
                        />
                      </div>
                    </div>

                    {/* Dates & Times */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label className="relay-field-label">Start Date & Time <span style={{ color: "var(--primary)" }}>*</span></label>
                        <input 
                          className="relay-input" 
                          type="datetime-local" 
                          value={form.startTime} 
                          onChange={(e) => update('startTime', e.target.value)} 
                          required 
                        />
                      </div>

                      <div>
                        <label className="relay-field-label">End Date & Time <span style={{ color: "var(--primary)" }}>*</span></label>
                        <input 
                          className="relay-input" 
                          type="datetime-local" 
                          value={form.endTime} 
                          onChange={(e) => update('endTime', e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    {/* Capacity & Deadline */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label className="relay-field-label">Registration Deadline <span style={{ color: "var(--primary)" }}>*</span></label>
                        <input 
                          className="relay-input" 
                          type="datetime-local" 
                          value={form.registrationDeadline} 
                          onChange={(e) => update('registrationDeadline', e.target.value)} 
                          required 
                        />
                        <span style={{ color: "var(--mute)", fontSize: "11px", marginTop: "3px", display: "block" }}>
                          Must be before event start time
                        </span>
                      </div>

                      <div>
                        <label className="relay-field-label">Capacity (Max Participants) <span style={{ color: "var(--primary)" }}>*</span></label>
                        <input
                          className="relay-input"
                          type="number"
                          min="1"
                          value={form.capacity}
                          onChange={(e) => update('capacity', Number(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    {/* Mode & Checkboxes */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", alignItems: "center" }}>
                      <div>
                        <label className="relay-field-label">Registration Mode</label>
                        <select className="relay-input" value={form.registrationMode} onChange={(e) => update('registrationMode', e.target.value)}>
                          <option value="OPEN">Open (Instant Confirmation)</option>
                          <option value="APPROVAL_REQUIRED">Approval Required (Admin review)</option>
                          <option value="INVITE_ONLY">Invite Only</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                          <input type="checkbox" checked={form.isVirtual || false} onChange={(e) => update('isVirtual', e.target.checked)} style={{ accentColor: "var(--primary)" }} /> 
                          Virtual Event
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                          <input type="checkbox" checked={form.waitlistEnabled || false} onChange={(e) => update('waitlistEnabled', e.target.checked)} style={{ accentColor: "var(--primary)" }} /> 
                          Enable Waitlist
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="relay-field-label">Event Description</label>
                      <textarea
                        className="relay-input"
                        value={form.description || ""}
                        onChange={(e) => update('description', e.target.value)}
                        placeholder="Provide details about objectives, guest speakers, prerequisites, and instructions..."
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Right Column: Live Poster & Card Preview */}
                  <div style={{ position: "sticky", top: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)" }}>
                        Live Card Preview
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--mute)" }}>
                        How it looks to attendees
                      </span>
                    </div>

                    <div style={{ maxWidth: "340px", margin: "0 auto" }}>
                      <EventCard
                        event={{
                          id: selectedId || 9999,
                          title: form.title || "Your Event Title Here",
                          category: form.category || "WORKSHOP",
                          venueName: form.venueName || "Campus Venue",
                          isVirtual: form.isVirtual,
                          virtualLink: form.virtualLink,
                          startTime: form.startTime || new Date().toISOString(),
                          capacity: form.capacity || 50,
                          status: form.status || "DRAFT",
                          posterUrl: customPoster,
                          organizer: form.organizerClub || user?.name || "Campus Club",
                        }}
                        variant="rich"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 28, paddingTop: 18, borderTop: "1px solid var(--border)", alignItems: "center" }}>
                  <button type="submit" className="cc-btn-primary" disabled={saving}>
                    {saving ? "Saving..." : selected ? "Save Changes" : "Create & Save Event"}
                  </button>

                  {selected && (
                    <button
                      type="button"
                      className="relay-btn"
                      disabled={saving || selected.status === "PUBLISHED"}
                      onClick={() => transition(relayApi.publishEvent)}
                      style={{ background: "var(--teal)" }}
                    >
                      Publish Event
                    </button>
                  )}

                  {selected && (
                    <button
                      type="button"
                      className="relay-btn-danger"
                      disabled={saving || selected.status === "CANCELLED"}
                      onClick={() => {
                        const reason = window.prompt("Reason for cancellation?");
                        if (reason) transition(relayApi.cancelEvent, reason);
                      }}
                    >
                      Cancel Event
                    </button>
                  )}

                  {selected && (
                    <button
                      type="button"
                      className="relay-btn-danger"
                      disabled={saving}
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                          transition(relayApi.deleteEvent);
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}

                  <button type="button" className="relay-btn-ghost" onClick={reset}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {selected && activeTab === "REGISTRATIONS" && <div style={{ marginTop: "10px" }}><AdminRegistrations event={selected} /></div>}
            {selected && activeTab === "TIMELINE" && <div style={{ marginTop: "10px" }}><AdminTimeline event={selected} /></div>}
          </div>
        )}

        {/* ── Event Directory & Management ───────────────────────── */}
        {!selectedId && !isCreating && (
          <div className="relay-card">
            {/* Directory Header & View Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="relay-feed-title" style={{ margin: 0, fontSize: "16px" }}>Campus Events Directory</div>
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

              {/* View Toggle (Grid / List) */}
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

            {/* Filter Toolbar */}
            <div className="cc-directory-toolbar">
              {/* Row 1: Search & Core Filters */}
              <div className="cc-filter-row">
                <div style={{ position: "relative", flexGrow: 1, minWidth: "220px" }}>
                  <Search size={14} style={{ position: "absolute", left: "12px", top: "11px", color: "var(--mute)" }} />
                  <input 
                    type="text" 
                    placeholder="Search by title, venue, club..." 
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

              {/* Row 2: Secondary Filters & Sort */}
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

                {availableClubs.length > 0 && (
                  <select 
                    value={clubFilter} 
                    onChange={(e) => setClubFilter(e.target.value)}
                    style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12.5px", outline: "none", background: "var(--surface)" }}
                  >
                    <option value="ALL">All Clubs / Organizers</option>
                    {availableClubs.map(c => (
                      <option key={c} value={c}>{c}</option>
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
                                      ID: #{event.id} • {event.organizerClub || event.createdByName || "Campus Organizer"}
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
                                      onClick={() => { setOpenMenuId(null); edit(event); }}
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

                          {/* Expanded sub-rows showing every identical database record with its unique ID */}
                          {isExpanded && group.items.slice(1).map(dup => (
                            <tr key={dup.id} className="cc-duplicate-subrow" style={{ borderBottom: "1px solid var(--border-light)" }}>
                              <td style={{ padding: "8px 10px 8px 32px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>↳ Session ID #{dup.id}:</span>
                                  <span style={{ color: "var(--mute)", fontSize: "11px" }}>
                                    Created {new Date(dup.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: "8px 10px", color: "var(--mute)", fontSize: "11.5px" }}>{dup.category}</td>
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
                                        onClick={() => { setOpenMenuId(null); edit(dup); }}
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

            {/* Grid View Cards */}
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
                            padding: "2px 8px", borderRadius: "10px", fontSize: "10.5px", fontWeight: 700,
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
                        <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--text)", marginBottom: "4px" }}>
                          {event.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--mute)", marginBottom: "8px" }}>
                          ID #{event.id} • {event.organizerClub || event.createdByName || "Campus Organizer"}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--mute)", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
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
                                      onClick={() => edit(i)}
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
                                  onClick={() => { setOpenMenuId(null); edit(event); }}
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
        )}
      </div>
    </div>
  );
}
