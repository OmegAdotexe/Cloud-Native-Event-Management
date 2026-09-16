import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as relayApi from "../api/relayApi.js";
import EventCard from "../components/EventCard.jsx";
import AdminRegistrations from "../components/AdminRegistrations.jsx";
import AdminTimeline from "../components/AdminTimeline.jsx";

const initialForm = { title: "", description: "", venueName: "", isVirtual: false, virtualLink: "", startTime: "", endTime: "", registrationDeadline: "", capacity: 1, status: "DRAFT", registrationMode: "OPEN", category: "OTHER", waitlistEnabled: false };
const toInputTime = (value) => value ? value.slice(0, 16) : "";

export default function AdminPage({ events, isLoading, error, onRefresh }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const selected = events.find((event) => event.id === selectedId);
  const [activeTab, setActiveTab] = useState("DETAILS");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const edit = (event) => { setSelectedId(event.id); setActionError(""); setForm({ ...event, startTime: toInputTime(event.startTime), endTime: toInputTime(event.endTime), registrationDeadline: toInputTime(event.registrationDeadline) }); setActiveTab("DETAILS"); };
  const reset = () => { setSelectedId(null); setForm(initialForm); setActionError(""); setActiveTab("DETAILS"); };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setActionError("");
    try { selected ? await relayApi.updateEvent(selected.id, form) : await relayApi.createEvent(form); reset(); await onRefresh(); }
    catch (err) { setActionError(err.message || "Unable to save event."); }
    finally { setSaving(false); }
  };
  const transition = async (action, data = null) => { setSaving(true); setActionError(""); try { data !== null ? await action(selected.id, data) : await action(selected.id); await onRefresh(); } catch (err) { setActionError(err.message || "Unable to update event."); } finally { setSaving(false); } };

  return <>
    <div className="relay-topbar"><div><h1>Hi, {user?.name || "there"}</h1><p>{isSuperAdmin ? "Create and manage every event across the platform." : "Create and manage your campus events."}</p></div></div>
    <div className="relay-body"><div className="relay-grid"><div>
      <button className="relay-btn" onClick={reset} style={{ marginBottom: 14 }}>+ Create event</button>
      {isLoading && <div className="relay-empty">Loading events...</div>}{error && <div className="relay-empty">{error}</div>}
      {events.map((event) => <EventCard key={event.id} event={event} isActive={event.id === selectedId} onClick={() => edit(event)} />)}
    </div><div className="relay-card">
      <div className="relay-feed-title">{selected ? `Edit ${selected.title}` : "Create event"}</div>
      {actionError && <div className="relay-auth-error">{actionError}</div>}
      
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
          {[['title','Title','text'], ['venueName','Venue Name','text'], ['startTime','Start time','datetime-local'], ['endTime','End time','datetime-local'], ['registrationDeadline', 'Registration Deadline', 'datetime-local'], ['capacity','Capacity','number']].map(([key,label,type]) => <div key={key} style={{ marginTop: 12 }}><label className="relay-field-label">{label}</label><input className="relay-input" type={type} min={key === 'capacity' ? 1 : undefined} value={form[key]} onChange={(e) => update(key, key === 'capacity' ? Number(e.target.value) : e.target.value)} required /></div>)}
          <div style={{ marginTop: 12 }}><label className="relay-field-label">Virtual Link</label><input className="relay-input" type="text" value={form.virtualLink || ""} onChange={(e) => update('virtualLink', e.target.value)} /></div>
          <div style={{ marginTop: 12 }}><label className="relay-field-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}><input type="checkbox" checked={form.isVirtual || false} onChange={(e) => update('isVirtual', e.target.checked)} style={{ accentColor: "var(--amber)" }} /> Is Virtual</label></div>
          <div style={{ marginTop: 12 }}><label className="relay-field-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}><input type="checkbox" checked={form.waitlistEnabled || false} onChange={(e) => update('waitlistEnabled', e.target.checked)} style={{ accentColor: "var(--amber)" }} /> Enable Waitlist</label></div>
          <div style={{ marginTop: 12 }}>
              <label className="relay-field-label">Registration Mode</label>
              <select className="relay-input" value={form.registrationMode} onChange={(e) => update('registrationMode', e.target.value)}>
                  <option value="OPEN">OPEN</option>
                  <option value="INVITE_ONLY">INVITE_ONLY</option>
                  <option value="APPROVAL_REQUIRED">APPROVAL_REQUIRED</option>
              </select>
          </div>
          <div style={{ marginTop: 12 }}>
              <label className="relay-field-label">Category</label>
              <select className="relay-input" value={form.category} onChange={(e) => update('category', e.target.value)}>
                  <option value="WORKSHOP">WORKSHOP</option>
                  <option value="SEMINAR">SEMINAR</option>
                  <option value="CULTURAL">CULTURAL</option>
                  <option value="SPORTS">SPORTS</option>
                  <option value="OTHER">OTHER</option>
              </select>
          </div>
          <div style={{ marginTop: 12 }}><label className="relay-field-label">Description</label><textarea className="relay-input" value={form.description || ""} onChange={(e) => update('description', e.target.value)} rows={3} /></div>
          <button className="relay-btn" disabled={saving} style={{ marginTop: 16 }}>{saving ? "Saving..." : selected ? "Save changes" : "Create draft"}</button>
        </form>
      )}

      {selected && activeTab === "DETAILS" && <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <button className="relay-btn" disabled={saving || selected.status === "PUBLISHED"} onClick={() => transition(relayApi.publishEvent)} style={{ background: "var(--teal)" }}>Publish</button>
        <button className="relay-btn-danger" disabled={saving || selected.status === "CANCELLED"} onClick={() => { const reason = window.prompt("Reason for cancellation?"); if(reason) transition(relayApi.cancelEvent, reason); }}>Cancel Event</button>
        <button className="relay-btn-danger" disabled={saving} onClick={() => transition(relayApi.deleteEvent)}>Delete</button>
      </div>}

      {selected && activeTab === "REGISTRATIONS" && <div style={{ marginTop: "-24px" }}><AdminRegistrations event={selected} /></div>}
      {selected && activeTab === "TIMELINE" && <div style={{ marginTop: "-24px" }}><AdminTimeline event={selected} /></div>}
    </div></div></div>
  </>;
}
