import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { 
  Calendar, CheckCircle2, Users, Clock, Edit, FileText, Search, Plus,
  BarChart2, Eye, MapPin, Globe, Sparkles, AlertCircle, ShieldCheck
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
  const [selectedId, setSelectedId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [customPoster, setCustomPoster] = useState(null);
  const [customGallery, setCustomGallery] = useState([]);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("DETAILS");
  
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
  }, [events]);

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

        {/* ── My Events Management Table ─────────────────────────── */}
        {!selectedId && !isCreating && (
          <div className="relay-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="relay-feed-title" style={{ margin: 0, fontSize: "16px" }}>Campus Events</div>
                <span style={{ fontSize: "12px", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                  {filteredEvents.length} Total
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--mute)" }} />
                  <input 
                    type="text" 
                    placeholder="Search events..." 
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
            {!isLoading && !error && filteredEvents.length === 0 && (
              <div className="relay-empty" style={{ padding: "40px 0" }}>
                <Calendar size={32} style={{ color: "var(--mute)", margin: "0 auto 10px" }} />
                <p>No events found matching your filter criteria.</p>
              </div>
            )}

            {!isLoading && !error && filteredEvents.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--mute)" }}>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Event</th>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Category</th>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Date & Venue</th>
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
                                style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: "var(--text)" }}>{event.title}</div>
                                <div style={{ fontSize: "11.5px", color: "var(--mute)" }}>
                                  Deadline: {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : "Open"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 10px", color: "var(--text-secondary)", fontSize: "12px" }}>
                            {event.category}
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
                          <td style={{ padding: "12px 10px", color: "var(--text-secondary)", fontSize: "12px" }}>
                            <div>{new Date(event.startTime).toLocaleDateString()}</div>
                            <div style={{ color: "var(--mute)", fontSize: "11px" }}>
                              {event.isVirtual ? "Virtual" : event.venueName}
                            </div>
                          </td>
                          <td style={{ padding: "12px 10px", color: "var(--text-secondary)", fontSize: "12px" }}>
                            {event.capacity} seats
                          </td>
                          <td style={{ padding: "12px 10px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                              <button
                                type="button"
                                className="relay-btn-ghost relay-btn-sm"
                                onClick={() => navigate(`/event/${event.id}`)}
                                title="View public event page"
                              >
                                <Eye size={13} /> View
                              </button>
                              <button
                                type="button"
                                className="relay-btn-ghost relay-btn-sm"
                                onClick={() => edit(event)}
                                title="Edit event settings"
                              >
                                <Edit size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                className="relay-btn-ghost relay-btn-sm"
                                onClick={() => navigate(`/admin/events/${event.id}/analytics`)}
                                title="View event metrics"
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
        )}
      </div>
    </>
  );
}
