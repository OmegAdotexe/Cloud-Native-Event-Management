import React from "react";
import { CheckCircle2, RefreshCw, XCircle, Clock } from "lucide-react";

const STATUS_MAP = {
  Sent:     { color: "var(--teal)",  bg: "rgba(79,184,166,0.15)",  icon: CheckCircle2 },
  Retrying: { color: "var(--amber)", bg: "rgba(242,169,60,0.15)",  icon: RefreshCw },
  Failed:   { color: "var(--coral)", bg: "rgba(226,96,79,0.15)",   icon: XCircle },
  Queued:   { color: "var(--mute)",  bg: "rgba(138,147,172,0.15)", icon: Clock },
};

/**
 * StatusPill — coloured badge showing a notification delivery status.
 * @param {{ status: "Sent"|"Retrying"|"Failed"|"Queued" }} props
 */
export default function StatusPill({ status }) {
  const m = STATUS_MAP[status] ?? STATUS_MAP.Queued;
  const Icon = m.icon;
  return (
    <span className="relay-pill" style={{ color: m.color, background: m.bg }}>
      <Icon size={11} /> {status}
    </span>
  );
}
