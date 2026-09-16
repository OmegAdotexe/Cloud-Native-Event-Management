import React, { useEffect, useState } from "react";
import * as relayApi from "../api/relayApi.js";

export default function TimelineDisplay({ event }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTimeline();
  }, [event.id]);

  const loadTimeline = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await relayApi.getTimeline(event.id);
      
      // Merge virtual timeline items representing event core dates
      const merged = [...data];
      
      // Auto-inject start time if not natively defined as an item
      if (!merged.find(i => i.type === 'EVENT_START')) {
        merged.push({ id: 'virt_start', title: 'Event Starts', type: 'EVENT_START', startTime: event.startTime });
      }
      // Auto-inject registration deadline if defined and not natively in timeline
      if (event.registrationDeadline && !merged.find(i => i.type === 'REGISTRATION_DEADLINE')) {
        merged.push({ id: 'virt_reg_dead', title: 'Registration Deadline', type: 'REGISTRATION_DEADLINE', startTime: event.registrationDeadline });
      }
      
      merged.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      setItems(merged);
    } catch (err) {
      setError("Failed to load timeline schedule");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ marginTop: 24, fontSize: "13px", color: "var(--mute)" }}>Loading schedule...</div>;
  if (error) return <div style={{ marginTop: 24, fontSize: "13px", color: "var(--coral)" }}>{error}</div>;

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>Schedule & Timeline</h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", paddingLeft: 12 }}>
        <div style={{ position: "absolute", left: 15, top: 10, bottom: 10, width: 2, background: "var(--border)" }} />
        
        {items.map(item => {
          const isPast = new Date(item.startTime).getTime() < Date.now();
          
          return (
            <div key={item.id} style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{
                position: "absolute", left: -4, top: 4, width: 10, height: 10, 
                borderRadius: "50%", 
                background: isPast ? "var(--teal)" : "var(--border)", 
                border: "2px solid var(--surface)"
              }} />
              
              <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "13.5px" }}>
                {item.title}
              </div>
              
              <div style={{ fontSize: "12px", color: isPast ? "var(--teal)" : "var(--mute)", marginTop: 4 }}>
                {new Date(item.startTime).toLocaleString()}
                {item.endTime && ` - ${new Date(item.endTime).toLocaleString()}`}
              </div>
              
              {item.description && (
                <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: 4 }}>
                  {item.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
