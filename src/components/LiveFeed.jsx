import React from "react";
import { Activity } from "lucide-react";

/**
 * LiveFeed — scrollable operations / event log panel.
 *
 * @param {{
 *   entries: Array<{ id: string, text: string, level: string, ts: string }>,
 *   title?: string,
 *   accentColor?: string,
 *   emptyMessage?: string
 * }} props
 */
export default function LiveFeed({
  entries,
  title = "Live operations feed",
  accentColor = "var(--amber)",
  emptyMessage = "No changes yet. Edit a venue or schedule to trigger the pipeline.",
}) {
  return (
    <div className="relay-card" style={{ marginBottom: 14 }}>
      <div className="relay-feed-title">
        <Activity size={13} color={accentColor} /> {title}
      </div>
      <div className="relay-feed-list relay-scroll">
        {entries.length === 0 && (
          <div className="relay-empty">{emptyMessage}</div>
        )}
        {entries.map((f) => (
          <div key={f.id} className="relay-feed-row">
            <span
              className="relay-feed-dot"
              style={{
                background:
                  f.level === "amber" ? "var(--amber)"
                  : f.level === "coral" ? "var(--coral)"
                  : f.level === "teal"  ? "var(--teal)"
                  : "var(--mute)",
              }}
            />
            <div>
              <div className="relay-feed-text">{f.text}</div>
              <div className="relay-feed-ts relay-mono">{f.ts}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
