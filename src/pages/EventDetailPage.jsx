import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CalendarClock, MapPin, Clock, Users, ArrowLeft,
  Code2, Music, Trophy, BookOpen, Star, Globe, Link2,
  AlertCircle, CheckCircle2, XCircle, Info, Calendar
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as relayApi from "../api/relayApi.js";
import TimelineDisplay from "../components/TimelineDisplay.jsx";

const CATEGORY_CONFIG = {
  WORKSHOP: { icon: <Code2 size={20} />, bg: "#EBF0FE", color: "#4A7BF7", label: "Workshop" },
  SEMINAR: { icon: <BookOpen size={20} />, bg: "#F0ECFE", color: "#7C5CFC", label: "Seminar" },
  CULTURAL: { icon: <Music size={20} />, bg: "#FDE8E7", color: "#E55A4F", label: "Cultural" },
  SPORTS: { icon: <Trophy size={20} />, bg: "#E6F7F2", color: "#2AAB8A", label: "Sports" },
  OTHER: { icon: <Star size={20} />, bg: "#F0EDE8", color: "#8B90A5", label: "Other" },
};

function getStatusStyle(status) {
  switch (status) {
    case 'CONFIRMED': return { bg: "#E6F7F2", color: "#1A8A6A", label: "Confirmed" };
    case 'WAITLISTED': return { bg: "#FFF4E6", color: "#C77E1F", label: "Waitlisted" };
    case 'PENDING': return { bg: "#F0ECFE", color: "#7C5CFC", label: "Pending Approval" };
    case 'CANCELLED': return { bg: "#FDE8E7", color: "#C44035", label: "Cancelled" };
    case 'REJECTED': return { bg: "#FDE8E7", color: "#C44035", label: "Rejected" };
    default: return { bg: "#F0EDE8", color: "#8B90A5", label: status };
  }
}

function getEventStatusStyle(status) {
  switch (status) {
    case 'PUBLISHED': return { bg: "#E6F7F2", color: "#1A8A6A", label: "Published" };
    case 'DRAFT': return { bg: "#F0EDE8", color: "#8B90A5", label: "Draft" };
    case 'CANCELLED': return { bg: "#FDE8E7", color: "#C44035", label: "Cancelled" };
    case 'COMPLETED': return { bg: "#EBF0FE", color: "#4A7BF7", label: "Completed" };
    default: return { bg: "#F0EDE8", color: "#8B90A5", label: status };
  }
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  });
}

function formatTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "—";
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [eventData, regsData] = await Promise.all([
        relayApi.getEventById(eventId),
        relayApi.getMyRegistrations(),
      ]);
      setEvent(eventData);
      const myReg = regsData.find(r => String(r.eventId) === String(eventId));
      setRegistration(myReg || null);
    } catch (err) {
      setError(err.message || "Failed to load event details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      await relayApi.registerForEvent(event.id);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to register");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;
    setActionLoading(true);
    try {
      await relayApi.cancelRegistration(event.id, registration.id);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to cancel registration");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relay-body">
        <div className="relay-empty" style={{ marginTop: 40 }}>Loading event details...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="relay-body">
        <div style={{ marginTop: 20 }}>
          <button className="relay-btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <div className="relay-empty" style={{ marginTop: 20, color: "var(--coral)" }}>
          {error || "Event not found."}
        </div>
      </div>
    );
  }

  const category = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.OTHER;
  const eventStatus = getEventStatusStyle(event.status);
  const isPastDeadline = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const isPastEvent = new Date(event.endTime) < new Date();
  const canRegister = !registration && !isPastDeadline && !isPastEvent && event.status === "PUBLISHED";
  const canCancel = registration && ['PENDING', 'CONFIRMED', 'WAITLISTED'].includes(registration.status) && event.status === 'PUBLISHED';

  return (
    <>
      {/* Back navigation */}
      <div className="relay-body">
        <div style={{ marginBottom: 20 }}>
          <button
            className="relay-btn-ghost"
            onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* Event Header Card */}
        <div className="relay-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Category Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: category.bg, color: category.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              {category.icon}
            </div>

            {/* Title and Meta */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.3 }}>
                    {event.title}
                  </h2>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                      background: category.bg, color: category.color
                    }}>
                      {category.label}
                    </span>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                      background: eventStatus.bg, color: eventStatus.color
                    }}>
                      {eventStatus.label}
                    </span>
                    {event.registrationMode !== "OPEN" && (
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                        background: "#F0ECFE", color: "#7C5CFC"
                      }}>
                        {event.registrationMode.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Registration Action */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {registration && (
                    <span style={{
                      padding: "6px 16px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                      background: getStatusStyle(registration.status).bg,
                      color: getStatusStyle(registration.status).color,
                    }}>
                      {getStatusStyle(registration.status).label}
                    </span>
                  )}
                  {canRegister && (
                    <button className="relay-btn" disabled={actionLoading} onClick={handleRegister}>
                      {actionLoading ? "Registering..." : "Register Now"}
                    </button>
                  )}
                  {canCancel && (
                    <button className="relay-btn-danger" disabled={actionLoading} onClick={handleCancel}>
                      {actionLoading ? "Cancelling..." : "Cancel Registration"}
                    </button>
                  )}
                </div>
              </div>

              {/* Organized by */}
              <div style={{ fontSize: 12.5, color: "var(--mute)", marginTop: 10 }}>
                Organized by <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{event.createdByName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

          {/* Left Column: Description + Timeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Description */}
            {event.description && (
              <div className="relay-card">
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>About this Event</div>
                <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {event.description}
                </div>
              </div>
            )}

            {/* Cancellation / Rejection Reason */}
            {registration && (registration.status === 'REJECTED' || registration.status === 'CANCELLED') && registration.reason && (
              <div className="relay-card" style={{ borderLeft: "4px solid var(--coral)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <XCircle size={16} color="var(--coral)" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--coral)" }}>
                    Reason for {registration.status.toLowerCase()}
                  </span>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {registration.reason}
                </div>
              </div>
            )}

            {/* Event Cancelled Reason */}
            {!registration && event.status === 'CANCELLED' && event.cancelledReason && (
              <div className="relay-card" style={{ borderLeft: "4px solid var(--coral)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <XCircle size={16} color="var(--coral)" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--coral)" }}>
                    This event has been cancelled
                  </span>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {event.cancelledReason}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="relay-card">
              <TimelineDisplay event={event} />
            </div>
          </div>

          {/* Right Column: Details Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Event Details Card */}
            <div className="relay-card">
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Event Details</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Date */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Calendar size={16} style={{ color: "var(--mute)", marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, color: "var(--mute)", fontWeight: 500 }}>Date</div>
                    <div style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 500 }}>{formatDate(event.startTime)}</div>
                  </div>
                </div>

                {/* Time */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Clock size={16} style={{ color: "var(--mute)", marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, color: "var(--mute)", fontWeight: 500 }}>Time</div>
                    <div style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 500 }}>
                      {formatTime(event.startTime)} — {formatTime(event.endTime)}
                    </div>
                  </div>
                </div>

                {/* Venue */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {event.isVirtual ? <Globe size={16} style={{ color: "var(--mute)", marginTop: 2, flexShrink: 0 }} />
                    : <MapPin size={16} style={{ color: "var(--mute)", marginTop: 2, flexShrink: 0 }} />}
                  <div>
                    <div style={{ fontSize: 12, color: "var(--mute)", fontWeight: 500 }}>
                      {event.isVirtual ? "Virtual Event" : "Venue"}
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 500 }}>
                      {event.isVirtual ? (event.virtualLink || "Link will be shared") : event.venueName}
                    </div>
                    {event.isVirtual && event.virtualLink && (
                      <a href={event.virtualLink} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <Link2 size={12} /> Join Link
                      </a>
                    )}
                  </div>
                </div>

                {/* Capacity */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Users size={16} style={{ color: "var(--mute)", marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, color: "var(--mute)", fontWeight: 500 }}>Capacity</div>
                    <div style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 500 }}>{event.capacity} participants</div>
                  </div>
                </div>

                {/* Registration Deadline */}
                {event.registrationDeadline && (
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <AlertCircle size={16} style={{ color: isPastDeadline ? "var(--coral)" : "var(--mute)", marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, color: "var(--mute)", fontWeight: 500 }}>Registration Deadline</div>
                      <div style={{ fontSize: 13.5, color: isPastDeadline ? "var(--coral)" : "var(--text)", fontWeight: 500 }}>
                        {formatDateTime(event.registrationDeadline)}
                      </div>
                      {isPastDeadline && (
                        <div style={{ fontSize: 11.5, color: "var(--coral)", marginTop: 2, fontWeight: 500 }}>
                          Registration closed
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Info Card */}
            {registration && (
              <div className="relay-card">
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Your Registration</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12.5, color: "var(--mute)" }}>Status</span>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                      background: getStatusStyle(registration.status).bg,
                      color: getStatusStyle(registration.status).color,
                    }}>
                      {getStatusStyle(registration.status).label}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12.5, color: "var(--mute)" }}>Registered</span>
                    <span style={{ fontSize: 12.5, color: "var(--text)" }}>
                      {formatDate(registration.registeredAt)}
                    </span>
                  </div>

                  {registration.respondedAt && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12.5, color: "var(--mute)" }}>Responded</span>
                      <span style={{ fontSize: 12.5, color: "var(--text)" }}>
                        {formatDate(registration.respondedAt)}
                      </span>
                    </div>
                  )}

                  {registration.cancelledAt && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12.5, color: "var(--mute)" }}>Cancelled</span>
                      <span style={{ fontSize: 12.5, color: "var(--coral)" }}>
                        {formatDate(registration.cancelledAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
