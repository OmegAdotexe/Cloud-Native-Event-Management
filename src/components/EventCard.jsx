import React from "react";
import { CalendarClock, MapPin, Users, Tag, AlertCircle, ChevronRight, CheckCircle2, Clock, Globe } from "lucide-react";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

const CATEGORY_STYLES = {
  WORKSHOP: { bg: "rgba(59, 130, 246, 0.9)", color: "#FFFFFF", label: "Workshop" },
  SEMINAR: { bg: "rgba(108, 59, 238, 0.9)", color: "#FFFFFF", label: "Seminar" },
  CULTURAL: { bg: "rgba(239, 68, 68, 0.9)", color: "#FFFFFF", label: "Cultural" },
  SPORTS: { bg: "rgba(16, 185, 129, 0.9)", color: "#FFFFFF", label: "Sports" },
  OTHER: { bg: "rgba(107, 114, 128, 0.9)", color: "#FFFFFF", label: "Campus" },
};

export default function EventCard({
  event,
  isActive = false,
  onClick,
  onRegister,
  registration,
  variant = "rich", // "rich" or "compact"
  actionLoading = false,
}) {
  if (!event) return null;

  const coverUrl = getEventCoverImage(event);
  const catStyle = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.OTHER;

  const startDate = event.startTime ? new Date(event.startTime) : null;
  const formattedDate = startDate
    ? startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "TBD";
  const formattedTime = startDate
    ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : "";

  const isRegistered = registration && registration.status === "CONFIRMED";
  const isWaitlisted = registration && registration.status === "WAITLISTED";

  // If compact variant (used in admin sidebar list)
  if (variant === "compact") {
    return (
      <button
        type="button"
        className={`relay-event-card ${isActive ? "active" : ""}`}
        onClick={onClick}
        style={{ width: "100%", textAlign: "left", fontFamily: "inherit" }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <img
            src={coverUrl}
            alt={event.title}
            onError={handleImageError}
            style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="relay-event-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {event.title}
            </div>
            <div className="relay-event-meta" style={{ marginTop: "4px" }}>
              <span className="relay-meta-item">
                <MapPin size={11} /> {event.isVirtual ? "Virtual" : event.venueName}
              </span>
              <span className="relay-meta-item">
                <CalendarClock size={11} /> {formattedDate}
              </span>
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: "6px", alignItems: "center" }}>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  background: event.status === "PUBLISHED" ? "var(--teal-light)" : event.status === "CANCELLED" ? "var(--coral-light)" : "var(--primary-light)",
                  color: event.status === "PUBLISHED" ? "var(--teal)" : event.status === "CANCELLED" ? "var(--coral)" : "var(--primary)",
                }}
              >
                {event.status}
              </span>
              {event.waitlistEnabled && <span style={{ fontSize: "10.5px", color: "var(--mute)" }}>Waitlist</span>}
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Full Rich Event Card (Discovery & Landing)
  const organizerClub = event.createdByName ? `${event.createdByName}'s Club` : (event.organizer || "Campus Student Council");

  return (
    <div className="cc-event-card-rich" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      {/* Cover Image Container */}
      <div className="cc-card-cover-container">
        <img
          src={coverUrl}
          alt={event.title}
          className="cc-card-cover-img"
          onError={handleImageError}
          loading="lazy"
        />
        {/* Category Badge */}
        <div className="cc-card-badge-category" style={{ background: catStyle.bg }}>
          {catStyle.label}
        </div>

        {/* Status Badge */}
        <div
          className="cc-card-badge-status"
          style={{
            background: isRegistered
              ? "rgba(16, 185, 129, 0.95)"
              : event.status === "PUBLISHED"
              ? "rgba(108, 59, 238, 0.95)"
              : event.status === "CANCELLED"
              ? "rgba(239, 68, 68, 0.95)"
              : "rgba(107, 114, 128, 0.95)",
            color: "#FFFFFF",
          }}
        >
          {isRegistered ? "Registered" : isWaitlisted ? "Waitlisted" : event.status}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="cc-card-body">
        <div className="cc-card-club">{organizerClub}</div>
        <h3 className="cc-card-title">{event.title}</h3>

        <div className="cc-card-meta-list">
          <div className="cc-card-meta-row">
            <CalendarClock size={15} />
            <span>{formattedDate} • {formattedTime}</span>
          </div>

          <div className="cc-card-meta-row">
            {event.isVirtual ? <Globe size={15} /> : <MapPin size={15} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {event.isVirtual ? (event.virtualLink ? "Online Event" : "Virtual") : (event.venueName || "Campus Auditorium")}
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="cc-card-footer">
          <div className="cc-card-capacity-pill">
            <Users size={14} />
            <span>Capacity {event.capacity}</span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {onRegister && event.status === "PUBLISHED" && !isRegistered && (
              <button
                type="button"
                className="relay-btn relay-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegister(event.id);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? "Registering..." : "Register Now"}
              </button>
            )}

            {isRegistered && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--teal)", fontWeight: 600 }}>
                <CheckCircle2 size={15} /> Confirmed
              </span>
            )}

            {onClick && !onRegister && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>
                Details <ChevronRight size={14} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
