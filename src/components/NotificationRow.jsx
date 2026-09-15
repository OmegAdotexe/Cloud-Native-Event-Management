import React from "react";
import StatusPill from "./StatusPill.jsx";
import ChannelIcon from "./ChannelIcon.jsx";

/**
 * NotificationRow — one row in a notification list.
 *
 * @param {{ notification: object }} props
 */
export default function NotificationRow({ notification: n }) {
  return (
    <div className="relay-notif-row">
      <div className="relay-notif-icon">
        <ChannelIcon channel={n.channel} size={13} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{n.eventName}</span>
          <StatusPill status={n.status} />
        </div>
        <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 3 }}>
          {n.type === "VenueChanged" ? "Venue changed" : "Schedule changed"} · {n.detail}
        </div>
        <div className="relay-feed-ts relay-mono" style={{ marginTop: 3 }}>
          {n.ts} via {n.channel}
        </div>
      </div>
    </div>
  );
}
