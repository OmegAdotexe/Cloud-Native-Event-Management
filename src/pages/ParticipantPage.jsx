import React, { useState, useEffect } from "react";
import {
  CalendarClock, MapPin, Calendar, Users, Clock, Bell,
  ArrowUpRight, ChevronRight, Code2, Music, Trophy, BookOpen, Star,
  CheckCircle2, AlertCircle, Info, XCircle, BellRing, Sparkles, QrCode
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import EventCard from "../components/EventCard.jsx";
import TicketModal from "../components/TicketModal.jsx";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

const CATEGORY_CONFIG = {
  WORKSHOP: { icon: <Code2 size={16} />, bg: "var(--blue-light)", color: "var(--blue)", label: "Workshop" },
  SEMINAR: { icon: <BookOpen size={16} />, bg: "var(--primary-light)", color: "var(--primary)", label: "Seminar" },
  CULTURAL: { icon: <Music size={16} />, bg: "var(--coral-light)", color: "var(--coral)", label: "Cultural" },
  SPORTS: { icon: <Trophy size={16} />, bg: "var(--teal-light)", color: "var(--teal)", label: "Sports" },
  OTHER: { icon: <Star size={16} />, bg: "var(--amber-light)", color: "var(--amber)", label: "Other" },
};

function formatEventDate(dateString) {
  if (!dateString) return "TBD";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatEventTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function ParticipantPage({ events = [], isLoading, error }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState("UPCOMING"); // "UPCOMING" or "HISTORY"

  useEffect(() => {
    relayApi.getMyRegistrations()
      .then(data => setRegistrations(data || []))
      .catch(() => setRegistrations([]));

    relayApi.getNotifications(0, 5)
      .then(res => setNotifications(res?.content || []))
      .catch(() => setNotifications([]));
  }, []);

  const now = new Date();
  const nowMs = now.getTime();

  // Registered events
  const registeredEvents = events.filter(e => 
    registrations.some(r => String(r.eventId) === String(e.id) && r.status === "CONFIRMED")
  );

  const upcomingRegistered = registeredEvents.filter(e => new Date(e.endTime || e.startTime).getTime() >= nowMs);
  const pastRegistered = registeredEvents.filter(e => new Date(e.endTime || e.startTime).getTime() < nowMs);

  // Recommended upcoming events (not registered yet)
  const recommendedEvents = events
    .filter(e => !registrations.some(r => String(r.eventId) === String(e.id)) && e.status === "PUBLISHED" && new Date(e.startTime).getTime() >= nowMs)
    .slice(0, 3);

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      <div className="relay-body">
        {/* ── Welcome Banner ─────────────────────────────────────── */}
        <div className="relay-welcome" style={{ alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "26px" }}>
              <span>Welcome back, {user?.name?.split(" ")[0] || "Student"}!</span>
              <Sparkles size={20} color="var(--primary)" />
            </h1>
            <p>Track your passes, explore upcoming society workshops, and never miss a campus moment.</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="relay-welcome-right">
              <div className="date">{dateStr}</div>
              <div>Campus Hub is Active</div>
            </div>
            <button
              type="button"
              className="cc-btn-primary"
              onClick={() => navigate("/events")}
              style={{ padding: "9px 18px", fontSize: "13px" }}
            >
              Browse All Events
            </button>
          </div>
        </div>

        {/* ── KPI Stat Cards ─────────────────────────────────────── */}
        <div className="relay-stat-grid" style={{ marginBottom: "28px" }}>
          <div className="relay-stat-card">
            <div className="relay-stat-icon purple"><Calendar size={20} /></div>
            <div>
              <div className="relay-stat-num">{events.length}</div>
              <div className="relay-stat-label">Available Events</div>
            </div>
          </div>

          <div className="relay-stat-card">
            <div className="relay-stat-icon teal"><CheckCircle2 size={20} /></div>
            <div>
              <div className="relay-stat-num">{registrations.filter(r => r.status === "CONFIRMED").length}</div>
              <div className="relay-stat-label">Active Event Passes</div>
            </div>
          </div>

          <div className="relay-stat-card">
            <div className="relay-stat-icon blue"><Clock size={20} /></div>
            <div>
              <div className="relay-stat-num">{upcomingRegistered.length}</div>
              <div className="relay-stat-label">Upcoming This Week</div>
            </div>
          </div>

          <div className="relay-stat-card">
            <div className="relay-stat-icon amber"><Bell size={20} /></div>
            <div>
              <div className="relay-stat-num">{notifications.filter(n => !n.isRead).length}</div>
              <div className="relay-stat-label">Unread Notifications</div>
            </div>
          </div>
        </div>

        {/* ── Main Dashboard Layout ──────────────────────────────── */}
        <div className="relay-dashboard">
          
          {/* Main Content Column */}
          <div className="relay-dashboard-main">
            
            {/* My Registrations & Passes Section */}
            <div className="relay-card">
              <div className="relay-section-header">
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("UPCOMING")}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: activeTab === "UPCOMING" ? 700 : 500,
                      color: activeTab === "UPCOMING" ? "var(--primary)" : "var(--mute)",
                      borderBottom: activeTab === "UPCOMING" ? "2px solid var(--primary)" : "none",
                      paddingBottom: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <CheckCircle2 size={16} /> My Confirmed Passes ({upcomingRegistered.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("HISTORY")}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: activeTab === "HISTORY" ? 700 : 500,
                      color: activeTab === "HISTORY" ? "var(--primary)" : "var(--mute)",
                      borderBottom: activeTab === "HISTORY" ? "2px solid var(--primary)" : "none",
                      paddingBottom: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Clock size={16} /> Attended History ({pastRegistered.length})
                  </button>
                </div>

                <div
                  className="relay-section-link"
                  onClick={() => navigate("/my-registrations")}
                  style={{ cursor: "pointer" }}
                >
                  View All <ChevronRight size={14} className="relay-chevron" />
                </div>
              </div>

              {activeTab === "UPCOMING" ? (
                upcomingRegistered.length === 0 ? (
                  <div className="relay-empty" style={{ padding: "36px 0" }}>
                    <CalendarClock size={32} style={{ color: "var(--mute)", margin: "0 auto 10px" }} />
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>No upcoming registrations</div>
                    <p style={{ color: "var(--mute)", fontSize: "12.5px", marginTop: "4px" }}>
                      You haven't registered for any upcoming events yet. Check out recommended events below!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {upcomingRegistered.map(event => {
                      const reg = registrations.find(r => String(r.eventId) === String(event.id));
                      const cover = getEventCoverImage(event);
                      return (
                        <div
                          key={event.id}
                          className="relay-event-row"
                          onClick={() => navigate(`/event/${event.id}`)}
                          style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border-light)" }}
                        >
                          <img
                            src={cover}
                            alt={event.title}
                            onError={handleImageError}
                            style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
                          />
                          <div className="relay-event-info">
                            <div className="relay-event-title">{event.title}</div>
                            <div className="relay-event-details">
                              <span><CalendarClock size={12} /> {formatEventDate(event.startTime)}</span>
                              <span><Clock size={12} /> {formatEventTime(event.startTime)}</span>
                              <span><MapPin size={12} /> {event.isVirtual ? "Virtual" : event.venueName}</span>
                            </div>
                          </div>
                          <div className="relay-event-actions">
                            <button
                              type="button"
                              className="relay-btn-ghost relay-btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket({
                                  ...reg,
                                  eventTitle: event.title,
                                  eventVenue: event.isVirtual ? "Virtual" : event.venueName,
                                  eventStartTime: event.startTime,
                                  participantName: user?.name,
                                  participantEmail: user?.email,
                                });
                              }}
                              style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                              <QrCode size={14} /> View Pass
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* History Tab */
                pastRegistered.length === 0 ? (
                  <div className="relay-empty" style={{ padding: "36px 0" }}>
                    <p>No past event history recorded yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {pastRegistered.map(event => (
                      <div key={event.id} className="relay-event-row" onClick={() => navigate(`/event/${event.id}`)}>
                        <div className="relay-event-info">
                          <div className="relay-event-title">{event.title}</div>
                          <div className="relay-event-details">
                            <span><CalendarClock size={12} /> {formatEventDate(event.startTime)}</span>
                            <span><MapPin size={12} /> {event.isVirtual ? "Virtual" : event.venueName}</span>
                          </div>
                        </div>
                        <span className="relay-status-pill" style={{ background: "var(--bg)", color: "var(--mute)" }}>
                          Completed
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Recommended For You Section */}
            {recommendedEvents.length > 0 && (
              <div className="relay-card">
                <div className="relay-section-header">
                  <div className="relay-section-title">
                    <Sparkles size={16} color="var(--primary)" /> Recommended Events
                  </div>
                  <div className="relay-section-link" onClick={() => navigate("/events")}>
                    Browse More <ChevronRight size={14} className="relay-chevron" />
                  </div>
                </div>

                <div className="cc-events-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                  {recommendedEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="rich"
                      onClick={() => navigate(`/event/${event.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column: Notifications & Quick Access */}
          <div className="relay-dashboard-side">
            <div className="relay-card">
              <div className="relay-section-header">
                <div className="relay-section-title">
                  <Bell size={16} /> Campus Alerts
                </div>
                <div className="relay-section-link" onClick={() => navigate("/notifications")}>
                  All <ChevronRight size={14} className="relay-chevron" />
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="relay-empty" style={{ padding: "20px 0" }}>
                  <Bell size={24} style={{ color: "var(--mute)", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: "12px" }}>No recent alerts.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {notifications.slice(0, 4).map(notif => (
                    <div key={notif.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", paddingBottom: "10px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: notif.isRead ? "transparent" : "var(--primary)",
                        marginTop: "6px", flexShrink: 0
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text)" }}>
                          {notif.title || "Notification"}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4, marginTop: "2px" }}>
                          {notif.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Campus Links */}
            <div className="relay-card">
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "10px" }}>
                Student Resources
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                <li style={{ color: "var(--primary)", cursor: "pointer" }} onClick={() => navigate("/events")}>
                  • Event Discovery Directory
                </li>
                <li style={{ color: "var(--primary)", cursor: "pointer" }} onClick={() => navigate("/my-registrations")}>
                  • Download Attendance Pass
                </li>
                <li style={{ color: "var(--primary)", cursor: "pointer" }} onClick={() => navigate("/notifications")}>
                  • Manage Email Alert Preferences
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <TicketModal
          registration={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
}
