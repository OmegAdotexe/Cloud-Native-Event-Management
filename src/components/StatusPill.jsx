import React from "react";
import { CheckCircle2, RefreshCw, XCircle, Clock } from "lucide-react";

const STATUS_MAP = {
  Sent:     { color: "#1A8A6A",  bg: "#E6F7F2",  icon: CheckCircle2 },
  Retrying: { color: "#C77E1F", bg: "#FFF4E6",  icon: RefreshCw },
  Failed:   { color: "#C44035", bg: "#FDE8E7",   icon: XCircle },
  Queued:   { color: "#8B90A5",  bg: "#F0EDE8", icon: Clock },
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
