import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CalendarClock, MapPin, Clock, Users, ArrowLeft,
  Code2, Music, Trophy, BookOpen, Star, Globe, Link2,
  AlertCircle, CheckCircle2, XCircle, Info, Calendar, QrCode,
  Share2, Sparkles, Shield, ChevronRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as relayApi from "../api/relayApi.js";
import TimelineDisplay from "../components/TimelineDisplay.jsx";
import TicketModal from "../components/TicketModal.jsx";
import EventCard from "../components/EventCard.jsx";
import { getEventCoverImage, getEventGalleryImages, handleImageError } from "../data/eventAssets.js";

const CATEGORY_CONFIG = {
  WORKSHOP: { icon: <Code2 size={18} />, bg: "var(--blue-light)", color: "var(--blue)", label: "Workshop & Tech" },
  SEMINAR: { icon: <BookOpen size={18} />, bg: "var(--primary-light)", color: "var(--primary)", label: "Keynote Seminar" },
  CULTURAL: { icon: <Music size={18} />, bg: "var(--coral-light)", color: "var(--coral)", label: "Cultural Fest" },
  SPORTS: { icon: <Trophy size={18} />, bg: "var(--teal-light)", color: "var(--teal)", label: "Sports & Athletics" },
  OTHER: { icon: <Star size={18} />, bg: "var(--amber-light)", color: "var(--amber)", label: "Campus Event" },
};

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", year: "numeric"
  });
}

function formatTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true
  });
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [registration, setRegistration] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [eventData, regsData, eventsList] = await Promise.all([
        relayApi.getEventById(eventId),
        relayApi.getMyRegistrations(),
        relayApi.getEvents().catch(() => []),
      ]);
      setEvent(eventData);
      setAllEvents(eventsList || []);
      const myReg = (regsData || []).find(r => String(r.eventId) === String(eventId));
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

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="relay-body" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="cc-brand-icon" style={{ width: "48px", height: "48px", margin: "0 auto 16px" }}>
            <Calendar size={24} />
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Loading event details...</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="relay-body" style={{ padding: "40px 28px" }}>
        <button className="relay-btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
          <ArrowLeft size={16} /> Back to Events
        </button>
        <div className="relay-card" style={{ textAlign: "center", padding: "40px" }}>
          <AlertCircle size={36} color="var(--coral)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Event Not Found</h3>
          <p style={{ color: "var(--mute)", fontSize: "13.5px" }}>{error || "The requested campus event may have been removed or unpublished."}</p>
        </div>
      </div>
    );
  }

  const category = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.OTHER;
  const coverUrl = getEventCoverImage(event);
  const galleryImages = getEventGalleryImages(event);
  const isPastDeadline = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const isPastEvent = new Date(event.endTime) < new Date();
  const canRegister = !registration && !isPastDeadline && !isPastEvent && event.status === "PUBLISHED";
  const canCancel = registration && ['PENDING', 'CONFIRMED', 'WAITLISTED'].includes(registration.status) && event.status === 'PUBLISHED';

  // Related events in same category
  const relatedEvents = allEvents
    .filter(e => String(e.id) !== String(event.id) && (e.category === event.category || e.status === "PUBLISHED"))
    .slice(0, 3);

  return (
    <>
      <div className="relay-body" style={{ paddingBottom: "60px" }}>
        {/* Navigation & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <button
            type="button"
            className="relay-btn-ghost"
            onClick={() => navigate(-1)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={15} /> All Events
          </button>

          <button
            type="button"
            className="relay-btn-ghost"
            onClick={handleShare}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
          >
            <Share2 size={14} /> {copiedLink ? "Link Copied!" : "Share Event"}
          </button>
        </div>

        {/* ── Large Hero Cover Banner ─────────────────────────────── */}
        <div style={{
          position: "relative",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
          height: "360px",
          marginBottom: "28px",
          background: "#141226",
        }}>
          <img
            src={coverUrl}
            alt={event.title}
            onError={handleImageError}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
          />
          {/* Gradient Overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(20, 18, 38, 0.95) 0%, rgba(20, 18, 38, 0.4) 60%, transparent 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "32px 36px",
            color: "#fff",
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "rgba(108, 59, 238, 0.9)", color: "#fff",
                padding: "5px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
                backdropFilter: "blur(8px)"
              }}>
                {category.icon} {category.label}
              </span>

              <span style={{
                background: event.status === "PUBLISHED" ? "rgba(16, 185, 129, 0.9)" : "rgba(107, 114, 128, 0.9)",
                color: "#fff", padding: "5px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
                backdropFilter: "blur(8px)"
              }}>
                {event.status}
              </span>

              {event.isVirtual && (
                <span style={{
                  background: "rgba(59, 130, 246, 0.9)", color: "#fff",
                  padding: "5px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
                  backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: "4px"
                }}>
                  <Globe size={13} /> Virtual Event
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#FFFFFF", margin: 0, lineHeight: 1.25, letterSpacing: "-0.02em" }}>
              {event.title}
            </h1>

            <div style={{ display: "flex", gap: "20px", marginTop: "12px", fontSize: "13.5px", color: "rgba(255, 255, 255, 0.8)", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CalendarClock size={16} color="#A78BFA" /> {formatDate(event.startTime)} • {formatTime(event.startTime)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={16} color="#A78BFA" /> {event.isVirtual ? "Online / Web" : (event.venueName || "Campus Hall")}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={16} color="#A78BFA" /> Capacity: {event.capacity} Attendees
              </span>
            </div>
          </div>
        </div>

        {/* ── Two Column Booking Layout ────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: "28px", alignItems: "start" }}>
          
          {/* Left Column: Event Narrative, Timeline, Gallery, Related */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Organizer Banner */}
            <div className="relay-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 24px" }}>
              <div className="cc-brand-icon" style={{ width: "46px", height: "46px" }}>
                <Shield size={22} />
              </div>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--mute)", letterSpacing: "0.06em" }}>
                  Official Campus Organizer
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
                  {event.createdByName || "Campus Student Affairs Council"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Verified University Society & Faculty Liaison
                </div>
              </div>
            </div>

            {/* About Event Description */}
            <div className="relay-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", marginBottom: "14px" }}>
                About This Event
              </h3>
              <div style={{ fontSize: "14.5px", color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {event.description || "Join fellow students, mentors, and industry pioneers for an engaging campus experience. Expand your network, explore interactive demonstrations, and participate in practical sessions."}
              </div>
            </div>

            {/* Event Timeline / Schedule */}
            <div className="relay-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>
                Event Schedule & Milestones
              </h3>
              <TimelineDisplay event={event} />
            </div>

            {/* Photo Gallery */}
            {galleryImages.length > 0 && (
              <div className="relay-card" style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>
                  Event Gallery & Campus Photos
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {galleryImages.map((img, idx) => (
                    <div key={idx} style={{ height: "130px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
                      <img src={img} alt={`Gallery ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Events */}
            {relatedEvents.length > 0 && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "14px" }}>
                  More Events You May Like
                </h3>
                <div className="cc-events-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                  {relatedEvents.map(rel => (
                    <EventCard
                      key={rel.id}
                      event={rel}
                      variant="rich"
                      onClick={() => navigate(`/event/${rel.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Booking / Pass Card */}
          <div style={{ position: "sticky", top: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Main Action Card */}
            <div className="relay-card" style={{ padding: "24px", boxShadow: "var(--shadow-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--mute)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>Admission</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary)" }}>Free Student Pass</div>
                </div>
                <div style={{
                  padding: "4px 10px", borderRadius: "10px", fontSize: "11.5px", fontWeight: 700,
                  background: "var(--primary-light)", color: "var(--primary)"
                }}>
                  {event.registrationMode}
                </div>
              </div>

              {/* Status & Deadline Alert */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px", marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
                  <Clock size={15} style={{ color: "var(--primary)" }} />
                  <span>Registration Deadline</span>
                </div>
                <div style={{ fontSize: "12.5px", color: isPastDeadline ? "var(--coral)" : "var(--text-secondary)" }}>
                  {event.registrationDeadline ? formatDate(event.registrationDeadline) : "Open until event starts"}
                </div>
                {isPastDeadline && (
                  <div style={{ fontSize: "11.5px", color: "var(--coral)", fontWeight: 600, marginTop: "4px" }}>
                    Registration has closed for this event.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {canRegister && (
                  <button
                    type="button"
                    className="cc-btn-primary"
                    disabled={actionLoading}
                    onClick={handleRegister}
                    style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                  >
                    {actionLoading ? "Registering..." : "Register Now"}
                  </button>
                )}

                {registration && registration.status === "CONFIRMED" && (
                  <>
                    <button
                      type="button"
                      className="cc-btn-primary"
                      onClick={() => setShowTicketModal(true)}
                      style={{ width: "100%", padding: "13px", fontSize: "14px", background: "var(--teal)" }}
                    >
                      <QrCode size={16} /> View Digital Entry Pass
                    </button>
                    <div style={{ textAlign: "center", fontSize: "12px", color: "var(--teal)", fontWeight: 600 }}>
                      ✓ Your seat is confirmed!
                    </div>
                  </>
                )}

                {registration && registration.status === "WAITLISTED" && (
                  <div style={{ background: "var(--amber-light)", color: "var(--amber)", padding: "12px", borderRadius: "10px", fontSize: "13px", textAlign: "center", fontWeight: 600 }}>
                    You are on the waitlist. You will be notified when a seat opens.
                  </div>
                )}

                {canCancel && (
                  <button
                    type="button"
                    className="relay-btn-danger"
                    disabled={actionLoading}
                    onClick={handleCancel}
                    style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                  >
                    {actionLoading ? "Cancelling..." : "Cancel Registration"}
                  </button>
                )}

                {!user && (
                  <button
                    type="button"
                    className="cc-btn-primary"
                    onClick={() => navigate("/login")}
                    style={{ width: "100%", padding: "14px", fontSize: "15px" }}
                  >
                    Sign in to Register
                  </button>
                )}
              </div>
            </div>

            {/* Quick Venue / Location Card */}
            <div className="relay-card" style={{ padding: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={16} style={{ color: "var(--primary)" }} />
                <span>Location & Venue</span>
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--text)", fontWeight: 600, marginBottom: "4px" }}>
                {event.isVirtual ? "Online / Virtual Stream" : (event.venueName || "Main Campus Hall")}
              </div>
              {event.isVirtual && event.virtualLink ? (
                <a
                  href={event.virtualLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--primary)", fontWeight: 600, textDecoration: "none", marginTop: "6px" }}
                >
                  <Link2 size={13} /> Access Meeting Room
                </a>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--mute)" }}>
                  Please present your QR digital pass at entry.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showTicketModal && registration && (
        <TicketModal
          registration={{
            ...registration,
            eventTitle: event.title,
            eventVenue: event.isVirtual ? (event.virtualLink || "Virtual") : event.venueName,
            eventStartTime: event.startTime,
            participantName: user?.name,
            participantEmail: user?.email,
          }}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </>
  );
}
