import React, { useEffect, useState } from "react";
import * as relayApi from "../api/relayApi.js";

const toInputTime = (value) => value ? value.slice(0, 16) : "";

export default function AdminTimeline({ event }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  
  const defaultForm = { title: "", description: "", type: "MILESTONE", startTime: "", endTime: "" };
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, [event.id]);

  const loadTimeline = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await relayApi.getTimeline(event.id);
      setItems(data);
    } catch (err) {
      setError(err.message || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => {
    setForm(curr => ({ ...curr, [key]: value }));
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      type: item.type,
      startTime: toInputTime(item.startTime),
      endTime: toInputTime(item.endTime),
    });
    setError("");
  };

  const startCreate = () => {
    setEditingId("new");
    setForm(defaultForm);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(defaultForm);
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId === "new") {
        await relayApi.createTimelineItem(event.id, form);
      } else {
        await relayApi.updateTimelineItem(event.id, editingId, form);
      }
      setEditingId(null);
      setForm(defaultForm);
      await loadTimeline();
    } catch (err) {
      setError(err.message || "Unable to save timeline item");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this timeline item?")) return;
    setSaving(true);
    setError("");
    try {
      await relayApi.deleteTimelineItem(event.id, id);
      await loadTimeline();
    } catch (err) {
      setError(err.message || "Unable to delete timeline item");
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = (
    <>
      <option value="REGISTRATION_OPEN">Registration Open</option>
      <option value="REGISTRATION_DEADLINE">Registration Deadline</option>
      <option value="ROUND">Round</option>
      <option value="REPORTING_TIME">Reporting Time</option>
      <option value="EVENT_START">Event Start</option>
      <option value="EVENT_END">Event End</option>
      <option value="RESULT">Result</option>
      <option value="MILESTONE">Milestone</option>
      <option value="OTHER">Other</option>
    </>
  );

  const formFields = (
    <>
      <input className="relay-input" placeholder="Title" value={form.title} onChange={e => updateField('title', e.target.value)} required />
      <textarea className="relay-input" placeholder="Description" value={form.description} onChange={e => updateField('description', e.target.value)} rows={2} />
      <select className="relay-input" value={form.type} onChange={e => updateField('type', e.target.value)}>{typeOptions}</select>
      <label className="relay-field-label" style={{ marginTop: 4 }}>Start Time</label>
      <input className="relay-input" type="datetime-local" value={form.startTime} onChange={e => updateField('startTime', e.target.value)} required />
      <label className="relay-field-label" style={{ marginTop: 4 }}>End Time (Optional)</label>
      <input className="relay-input" type="datetime-local" value={form.endTime} onChange={e => updateField('endTime', e.target.value)} />
    </>
  );

  return (
    <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
      <h3 style={{ marginBottom: 16, fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>Timeline & Schedule</h3>
      
      {error && <div className="relay-auth-error" style={{ marginBottom: 12 }}>{error}</div>}
      
      {loading ? (
        <div style={{ fontSize: "13px", color: "var(--mute)" }}>Loading timeline...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.length === 0 && editingId !== "new" && (
            <div style={{ fontSize: "13px", color: "var(--mute)" }}>No timeline items yet.</div>
          )}
          
          {items.map(item => (
            <div key={item.id} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" }}>
              {editingId === item.id ? (
                <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {formFields}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="submit" className="relay-btn relay-btn-sm" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                    <button type="button" className="relay-btn-ghost relay-btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "13.5px" }}>
                      {item.title} 
                      <span style={{ fontSize: "11px", background: "var(--bg)", padding: "2px 8px", borderRadius: 12, marginLeft: 8, color: "var(--text-secondary)", fontWeight: 500 }}>{item.type}</span>
                    </div>
                    {item.description && <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: 4 }}>{item.description}</div>}
                    <div style={{ fontSize: "12px", color: "var(--mute)", marginTop: 8 }}>
                      {new Date(item.startTime).toLocaleString()} {item.endTime && ` - ${new Date(item.endTime).toLocaleString()}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="relay-btn-ghost relay-btn-sm" onClick={() => startEdit(item)}>Edit</button>
                    <button className="relay-btn-danger relay-btn-sm" onClick={() => remove(item.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {editingId === "new" ? (
            <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)" }}>
              <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {formFields}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="submit" className="relay-btn relay-btn-sm" disabled={saving}>{saving ? "Saving..." : "Save Item"}</button>
                  <button type="button" className="relay-btn-ghost relay-btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <button className="relay-btn-ghost" style={{ alignSelf: "flex-start", marginTop: 8 }} onClick={startCreate}>+ Add Timeline Item</button>
          )}
        </div>
      )}
    </div>
  );
}
