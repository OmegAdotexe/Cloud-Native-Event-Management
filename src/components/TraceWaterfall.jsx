import React from "react";
import { Activity } from "lucide-react";

/**
 * TraceWaterfall — displays pipeline spans as a horizontal bar chart.
 *
 * @param {{
 *   spans: Array<{ name: string, ms: number }>
 * }} props
 */
export default function TraceWaterfall({ spans }) {
  return (
    <div className="relay-card">
      <div className="relay-feed-title">
        <Activity size={13} color="var(--teal)" /> RabbitMQ message flow — simulated
      </div>
      {spans.length === 0 && (
        <div className="relay-empty">Spans appear here once a change fires.</div>
      )}
      {spans.map((s, i) => (
        <div className="relay-trace-row" key={i}>
          <div className="relay-trace-label">{s.name}</div>
          <div className="relay-trace-track">
            <div
              className="relay-trace-bar"
              style={{
                width: `${Math.min(100, s.ms)}%`,
                background: i % 2 ? "var(--teal)" : "var(--amber)",
              }}
            />
          </div>
          <div className="relay-trace-ms relay-mono">{s.ms}ms</div>
        </div>
      ))}
    </div>
  );
}
