import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as relayApi from "../api/relayApi.js";
import EventCard from "../components/EventCard.jsx";

const initialForm = { title: "", description: "", venue: "", startTime: "", endTime: "", capacity: 1, status: "DRAFT" };
const toInputTime = (value) => value ? value.slice(0, 16) : "";

export default function AdminPage({ events, isLoading, error, onRefresh }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const selected = events.find((event) => event.id === selectedId);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const edit = (event) => { setSelectedId(event.id); setActionError(""); setForm({ ...event, startTime: toInputTime(event.startTime), endTime: toInputTime(event.endTime) }); };
  const reset = () => { setSelectedId(null); setForm(initialForm); setActionError(""); };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setActionError("");
    try { selected ? await relayApi.updateEvent(selected.id, form) : await relayApi.createEvent(form); reset(); await onRefresh(); }
    catch (err) { setActionError(err.message || "Unable to save event."); }
    finally { setSaving(false); }
  };
  const transition = async (action) => { setSaving(true); setActionError(""); try { await action(selected.id); await onRefresh(); } catch (err) { setActionError(err.message || "Unable to update event."); } finally { setSaving(false); } };

  return <>
    <div className="relay-topbar"><div><h1>Hi, {user?.name || "there"}</h1><p>{isSuperAdmin ? "Create and manage every event across the platform." : "Create and manage your campus events."}</p></div></div>
    <div className="relay-body"><div className="relay-grid"><div>
      <button className="relay-btn" onClick={reset} style={{ marginBottom: 10 }}>Create event</button>
      {isLoading && <div className="relay-empty">Loading events...</div>}{error && <div className="relay-empty">{error}</div>}
      {events.map((event) => <EventCard key={event.id} event={event} isActive={event.id === selectedId} onClick={() => edit(event)} />)}
    </div><div className="relay-card">
      <div className="relay-feed-title">{selected ? `Edit ${selected.title}` : "Create event"}</div>
      {actionError && <div className="relay-empty">{actionError}</div>}
      <form onSubmit={save}>
        {[['title','Title','text'], ['venue','Venue','text'], ['startTime','Start time','datetime-local'], ['endTime','End time','datetime-local'], ['capacity','Capacity','number']].map(([key,label,type]) => <div key={key} style={{ marginTop: 9 }}><label className="relay-field-label">{label}</label><input className="relay-input" type={type} min={key === 'capacity' ? 1 : undefined} value={form[key]} onChange={(e) => update(key, key === 'capacity' ? Number(e.target.value) : e.target.value)} required /></div>)}
        <div style={{ marginTop: 9 }}><label className="relay-field-label">Description</label><textarea className="relay-input" value={form.description || ""} onChange={(e) => update('description', e.target.value)} /></div>
        <button className="relay-btn" disabled={saving} style={{ marginTop: 12 }}>{saving ? "Saving..." : selected ? "Save changes" : "Create draft"}</button>
      </form>
      {selected && <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button className="relay-btn" disabled={saving || selected.status === "PUBLISHED"} onClick={() => transition(relayApi.publishEvent)}>Publish</button><button className="relay-btn" disabled={saving || selected.status === "CANCELLED"} onClick={() => transition(relayApi.cancelEvent)}>Cancel</button><button className="relay-btn" disabled={saving} onClick={() => transition(relayApi.deleteEvent)}>Delete</button></div>}
    </div></div></div>
  </>;
}
