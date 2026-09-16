import React, { useState, useEffect } from "react";
import { CalendarClock, MapPin, Calendar, Users, Clock, ChevronRight, Code2, Music, Trophy, BookOpen, Star } from "lucide-react";
import * as relayApi from "../api/relayApi.js";
import { useNavigate } from "react-router-dom";

const CATEGORY_CONFIG = {
  WORKSHOP: { icon: <Code2 size={18} />, bg: "#EBF0FE", label: "Workshop" },
  SEMINAR: { icon: <BookOpen size={18} />, bg: "#F0ECFE", label: "Seminar" },
  CULTURAL: { icon: <Music size={18} />, bg: "#FDE8E7", label: "Cultural" },
  SPORTS: { icon: <Trophy size={18} />, bg: "#E6F7F2", label: "Sports" },
  OTHER: { icon: <Star size={18} />, bg: "#F0EDE8", label: "Other" },
};

function getEventStatusInfo(event, registration) {
  if (registration) {
    if (registration.status === 'CONFIRMED') return { label: "Registered", class: "registered" };
    if (registration.status === 'WAITLISTED') return { label: "Waitlisted", class: "waitlisted" };
    if (registration.status === 'PENDING') return { label: "Pending", class: "pending" };
    if (registration.status === 'CANCELLED') return { label: "Cancelled", class: "cancelled" };
    if (registration.status === 'REJECTED') return { label: "Rejected", class: "rejected" };
  }

  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const now = new Date();

  if (deadline && deadline < now) return { label: "Closed", class: "cancelled" };

  if (deadline) {
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 5) return { label: `Ends in ${diffDays} day${diffDays > 1 ? 's' : ''}`, class: "ends-soon" };
    return { label: "Registration Open", class: "registration-open" };
  }

  return { label: "Open", class: "open" };
}

function formatEventDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatEventTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function ParticipantEventsPage({ events, isLoading, error }) {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const data = await relayApi.getMyRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleRegister = async (eventId) => {
    setActionLoading(true);
    try {
      await relayApi.registerForEvent(eventId);
      await fetchRegistrations();
    } catch (err) {
      alert(err.message || "Failed to register");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (eventId, registrationId) => {
    setActionLoading(true);
    try {
      await relayApi.cancelRegistration(eventId, registrationId);
      await fetchRegistrations();
    } catch (err) {
      alert(err.message || "Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  };

  // Sort events so upcoming is first
  const sortedEvents = [...events].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return (
    <>
      <div className="relay-topbar">
        <div>
          <h1>All Events</h1>
          <p>Browse and register for upcoming campus events.</p>
        </div>
      </div>
      <div className="relay-body">
        <div style={{ maxWidth: "840px" }}>
          <div className="relay-card">
            {isLoading && <div className="relay-empty">Loading events...</div>}
            {error && <div className="relay-empty" style={{ color: "var(--coral)" }}>{error}</div>}
            {!isLoading && !error && events.length === 0 && <div className="relay-empty">No events available right now.</div>}

            {sortedEvents.map((event) => {
              const reg = registrations.find(r => r.eventId === event.id);
              const statusInfo = getEventStatusInfo(event, reg);
              const category = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.OTHER;
              const isPastDeadline = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();

              return (
                <div key={event.id} className="relay-event-row" style={{ padding: "16px" }}>
                  <div className="relay-event-icon" style={{ background: category.bg, width: 48, height: 48 }}>
                    {category.icon}
                  </div>
                  <div className="relay-event-info">
                    <div className="relay-event-title" style={{ fontSize: "15px" }}>{event.title}</div>
                    <div className="relay-event-details" style={{ marginTop: "6px" }}>
                      <span><CalendarClock size={12} /> {formatEventDate(event.startTime)}</span>
                      <span><Clock size={12} /> {formatEventTime(event.startTime)}</span>
                      <span><MapPin size={12} /> {event.isVirtual ? "Virtual" : event.venueName}</span>
                      <span><Users size={12} /> {event.capacity} Capacity</span>
                    </div>
                  </div>
                  <div className="relay-event-actions">
                    <span className={`relay-status-pill ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                    {!reg && !isPastDeadline && (
                      <button
                        className="relay-btn-sm relay-btn"
                        disabled={actionLoading}
                        onClick={() => handleRegister(event.id)}
                      >
                        Register
                      </button>
                    )}
                    {reg && !['CANCELLED', 'REJECTED'].includes(reg.status) && (
                      <button
                        className="relay-btn-danger relay-btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleCancel(event.id, reg.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
