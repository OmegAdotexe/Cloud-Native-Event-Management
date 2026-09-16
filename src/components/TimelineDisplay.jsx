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

  if (loading) return <div style={{ marginTop: 24, fontSize: "0.9rem", color: "#888" }}>Loading schedule...</div>;
  if (error) return <div style={{ marginTop: 24, fontSize: "0.9rem", color: "#ff4444" }}>{error}</div>;

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>Schedule & Timeline</h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", paddingLeft: 12 }}>
        <div style={{ position: "absolute", left: 15, top: 10, bottom: 10, width: 2, background: "#333" }} />
        
        {items.map(item => {
          const isPast = new Date(item.startTime).getTime() < Date.now();
          
          return (
            <div key={item.id} style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{
                position: "absolute", left: -4, top: 4, width: 10, height: 10, 
                borderRadius: "50%", background: isPast ? "#00e676" : "#444", border: "2px solid #111"
              }} />
              
              <div style={{ fontWeight: "600", color: isPast ? "#ddd" : "#fff" }}>
                {item.title}
              </div>
              
              <div style={{ fontSize: "0.85rem", color: "#00e676", marginTop: 4 }}>
                {new Date(item.startTime).toLocaleString()}
                {item.endTime && ` - ${new Date(item.endTime).toLocaleString()}`}
              </div>
              
              {item.description && (
                <div style={{ fontSize: "0.9rem", color: "#888", marginTop: 4 }}>
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
