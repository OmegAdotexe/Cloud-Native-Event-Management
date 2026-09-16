import React, { useState, useEffect } from "react";
import {
  CalendarClock, MapPin, Calendar, Users, Clock, Bell,
  ArrowUpRight, ChevronRight, Code2, Music, Trophy, BookOpen, Star,
  CheckCircle2, AlertCircle, Info, XCircle, BellRing
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";

const CATEGORY_CONFIG = {
  WORKSHOP: { icon: <Code2 size={18} />, bg: "#EBF0FE", label: "Workshop" },
  SEMINAR: { icon: <BookOpen size={18} />, bg: "#F0ECFE", label: "Seminar" },
  CULTURAL: { icon: <Music size={18} />, bg: "#FDE8E7", label: "Cultural" },
  SPORTS: { icon: <Trophy size={18} />, bg: "#E6F7F2", label: "Sports" },
  OTHER: { icon: <Star size={18} />, bg: "#F0EDE8", label: "Other" },
};

const NOTIF_ICONS = {
  REGISTRATION_CONFIRMED: { icon: <CheckCircle2 size={16} />, bg: "#E6F7F2", color: "#2AAB8A" },
  REGISTRATION_WAITLISTED: { icon: <CalendarClock size={16} />, bg: "#FFF4E6", color: "#E8943A" },
  REGISTRATION_REJECTED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  REGISTRATION_CANCELLED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  REGISTRATION_PENDING: { icon: <Info size={16} />, bg: "#FFF4E6", color: "#E8943A" },
  EVENT_PUBLISHED: { icon: <BellRing size={16} />, bg: "#F0ECFE", color: "#7C5CFC" },
  EVENT_CANCELLED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  EVENT_VENUE_CHANGED: { icon: <AlertCircle size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  EVENT_TIME_CHANGED: { icon: <Info size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  EVENT_UPDATED: { icon: <Info size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  TIMELINE_UPDATED: { icon: <CalendarClock size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
};

function getStatusPillClass(status) {
  return status?.toLowerCase().replace(/_/g, '-') || 'pending';
}

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

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatEventDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatEventTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function ParticipantPage({ events, isLoading, error }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const data = await relayApi.getMyRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const pageData = await relayApi.getNotifications(0, 5);
      setNotifications(pageData.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchNotifications();
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

  // Computed stats
  const totalEvents = events.length;
  const myRegs = registrations.length;
  const upcomingEvents = events.filter(e => new Date(e.startTime) > new Date()).length;
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  // Upcoming events (future events, max 5)
  const upcoming = events
    .filter(e => new Date(e.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 5);

  // Current date display
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return <>
    <div className="relay-body">
      {/* Welcome Banner */}
      <div className="relay-welcome">
        <div>
          <h1>Welcome back, {user?.name?.split(" ")[0] || "there"} <span style={{ cursor: "pointer" }}>›</span></h1>
          <p>Discover events, manage your registrations, and stay updated.</p>
        </div>
        <div className="relay-welcome-right">
          <div className="date">{dateStr}</div>
          <div>Good to see you again!</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relay-stat-grid">
        <div className="relay-stat-card">
          <div className="relay-stat-icon amber"><Calendar size={20} /></div>
          <div>
            <div className="relay-stat-num">{totalEvents}</div>
            <div className="relay-stat-label">Total Events</div>
          </div>
        </div>
        <div className="relay-stat-card">
          <div className="relay-stat-icon blue"><Users size={20} /></div>
          <div>
            <div className="relay-stat-num">{myRegs}</div>
            <div className="relay-stat-label">My Registrations</div>
          </div>
        </div>
        <div className="relay-stat-card">
          <div className="relay-stat-icon green"><Clock size={20} /></div>
          <div>
            <div className="relay-stat-num">{upcomingEvents}</div>
            <div className="relay-stat-label">Upcoming Events</div>
          </div>
        </div>
        <div className="relay-stat-card">
          <div className="relay-stat-icon coral"><Bell size={20} /></div>
          <div>
            <div className="relay-stat-num">{unreadNotifs + notifications.length}</div>
            <div className="relay-stat-label">Unread Notifications</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="relay-dashboard">
        <div className="relay-dashboard-main">
          {/* Upcoming Events */}
          <div className="relay-card">
            <div className="relay-section-header">
              <div className="relay-section-title">
                <Calendar size={16} /> Upcoming Events
              </div>
              <div className="relay-section-link" onClick={() => {}}>
                View All <ChevronRight size={14} className="relay-chevron" />
              </div>
            </div>

            {isLoading && <div className="relay-empty">Loading events...</div>}
            {error && <div className="relay-empty">{error}</div>}
            {!isLoading && !error && upcoming.length === 0 && <div className="relay-empty">No upcoming events.</div>}

            {upcoming.map((event) => {
              const reg = registrations.find(r => r.eventId === event.id);
              const statusInfo = getEventStatusInfo(event, reg);
              const category = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.OTHER;
              const isPastDeadline = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();

              return (
                <div key={event.id} className="relay-event-row">
                  <div className="relay-event-icon" style={{ background: category.bg }}>
                    {category.icon}
                  </div>
                  <div className="relay-event-info">
                    <div className="relay-event-title">{event.title}</div>
                    <div className="relay-event-details">
                      <span><CalendarClock size={12} /> {formatEventDate(event.startTime)}</span>
                      <span><Clock size={12} /> {formatEventTime(event.startTime)}</span>
                      <span><MapPin size={12} /> {event.isVirtual ? "Virtual" : event.venueName}</span>
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
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                      >
                        Register
                      </button>
                    )}
                    {reg && !['CANCELLED', 'REJECTED'].includes(reg.status) && (
                      <button
                        className="relay-btn-danger relay-btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleCancel(event.id, reg.id)}
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                      >
                        Cancel
                      </button>
                    )}
                    <ChevronRight size={16} style={{ color: "var(--mute)" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* My Registrations Table */}
          <div className="relay-card">
            <div className="relay-section-header">
              <div className="relay-section-title">
                <Users size={16} /> My Registrations
              </div>
              <div className="relay-section-link" onClick={() => navigate("/my-registrations")}>
                View All <ChevronRight size={14} className="relay-chevron" />
              </div>
            </div>

            {registrations.length === 0 ? (
              <div className="relay-empty">No registrations yet.</div>
            ) : (
              <table className="relay-reg-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.slice(0, 5).map(reg => {
                    const category = CATEGORY_CONFIG[reg.eventCategory] || CATEGORY_CONFIG.OTHER;
                    return (
                      <tr key={reg.id}>
                        <td>
                          <div className="relay-reg-event-cell">
                            <div className="relay-reg-icon" style={{ background: category.bg }}>
                              {category.icon ? React.cloneElement(category.icon, { size: 13 }) : <Star size={13} />}
                            </div>
                            <span style={{ fontWeight: 500 }}>{reg.eventTitle}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--mute)", fontSize: "12.5px" }}>
                          {formatEventDate(reg.eventStartTime || reg.registeredAt)}
                        </td>
                        <td>
                          <span className={`relay-status-pill ${getStatusPillClass(reg.status)}`}>
                            {reg.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="relay-btn-view"
                            onClick={() => navigate("/my-registrations")}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right sidebar: Notifications + CTA */}
        <div className="relay-dashboard-side">
          {/* Recent Notifications */}
          <div className="relay-card">
            <div className="relay-section-header">
              <div className="relay-section-title">
                <Bell size={16} /> Recent Notifications
              </div>
              <div className="relay-section-link" onClick={() => navigate("/notifications")}>
                View All <ChevronRight size={14} className="relay-chevron" />
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="relay-empty">No notifications yet.</div>
            ) : (
              notifications.slice(0, 5).map(notif => {
                const iconConfig = NOTIF_ICONS[notif.type] || NOTIF_ICONS.EVENT_UPDATED || { icon: <BellRing size={16} />, bg: "#F0EDE8", color: "#8B90A5" };
                return (
                  <div key={notif.id} className="relay-notif-item" style={{ cursor: "pointer" }} onClick={() => navigate("/notifications")}>
                    <div className="relay-notif-icon-circle" style={{ background: iconConfig.bg, color: iconConfig.color }}>
                      {iconConfig.icon}
                    </div>
                    <div className="relay-notif-content">
                      <div className="relay-notif-title">{notif.title}</div>
                      <div className="relay-notif-message">{notif.message}</div>
                    </div>
                    <div className="relay-notif-time">{timeAgo(notif.createdAt)}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Browse Events CTA */}
          <div className="relay-cta-card">
            <div className="relay-cta-icon">
              <Calendar size={22} />
            </div>
            <div className="relay-cta-title">Find Your Next Event</div>
            <div className="relay-cta-desc">
              Explore a wide range of technical, cultural, and sports events.
            </div>
            <button className="relay-btn" onClick={() => {}}>
              Browse Events <ArrowUpRight size={14} />
            </button>
            <div style={{ marginTop: "10px" }}>
              <span className="relay-section-link" style={{ fontSize: "12px" }}>
                View Event Calendar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>;
}
