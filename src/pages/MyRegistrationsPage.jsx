import React, { useState, useEffect, useMemo } from "react";
import { 
  CalendarClock, MapPin, QrCode, AlertCircle, Calendar, 
  Search, CheckCircle2, Clock, XCircle, AlertTriangle, ChevronRight, ArrowUpRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import TicketModal from "../components/TicketModal.jsx";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

function getStatusStyle(status) {
  switch (status) {
    case 'CONFIRMED': return { bg: "var(--teal-light)", color: "var(--teal)", border: "rgba(42,171,138,0.25)" };
    case 'WAITLISTED': return { bg: "var(--amber-light)", color: "var(--amber)", border: "rgba(232,148,58,0.25)" };
    case 'PENDING': return { bg: "var(--primary-light)", color: "var(--primary)", border: "rgba(108,59,238,0.25)" };
    case 'CANCELLED': return { bg: "var(--coral-light)", color: "var(--coral)", border: "rgba(229,90,79,0.25)" };
    case 'REJECTED': return { bg: "var(--coral-light)", color: "var(--coral)", border: "rgba(229,90,79,0.25)" };
    default: return { bg: "var(--bg)", color: "var(--mute)", border: "var(--border)" };
  }
}

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState("CONFIRMED");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRegistrations = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [regsData, eventsData] = await Promise.all([
        relayApi.getMyRegistrations(),
        relayApi.getEvents().catch(() => []),
      ]);
      setRegistrations(regsData || []);
      setAllEvents(eventsData || []);
    } catch (err) {
      setError(err.message || "Unable to load your registrations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async (e, eventId, registrationId, startTime) => {
    e.stopPropagation();
    
    // Check if event has already started
    if (startTime && new Date(startTime) < new Date()) {
      alert("Cannot cancel registration for an event that has already started or concluded.");
      return;
    }

    const reason = window.prompt("Reason for cancellation (optional):");
    if (reason === null) return; // user cancelled prompt
    
    setActionLoading(true);
    try {
      await relayApi.cancelRegistration(eventId, registrationId, reason.trim() || undefined);
      await fetchRegistrations();
    } catch (err) {
      alert(err.message || "Failed to cancel registration");
    } finally {
      setActionLoading(false);
    }
  };

  // Classify registrations by tab
  const tabCounts = useMemo(() => {
    const now = new Date();
    let confirmedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let cancelledCount = 0;
    let completedCount = 0;

    registrations.forEach(r => {
      const isPast = r.eventStartTime && new Date(r.eventStartTime) < now;
      if (r.status === 'CONFIRMED' && !isPast) confirmedCount++;
      else if (r.status === 'CONFIRMED' && isPast) completedCount++;
      else if (r.status === 'PENDING') pendingCount++;
      else if (r.status === 'REJECTED') rejectedCount++;
      else if (r.status === 'CANCELLED') cancelledCount++;
    });

    return {
      CONFIRMED: confirmedCount,
      PENDING: pendingCount,
      COMPLETED: completedCount,
      REJECTED: rejectedCount,
      CANCELLED: cancelledCount,
      ALL: registrations.length,
    };
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    const now = new Date();
    return registrations.filter(reg => {
      const isPast = reg.eventStartTime && new Date(reg.eventStartTime) < now;

      // Filter by active tab
      if (activeTab === 'CONFIRMED') {
        if (reg.status !== 'CONFIRMED' || isPast) return false;
      } else if (activeTab === 'PENDING') {
        if (reg.status !== 'PENDING') return false;
      } else if (activeTab === 'COMPLETED') {
        if (reg.status !== 'CONFIRMED' || !isPast) return false;
      } else if (activeTab === 'REJECTED') {
        if (reg.status !== 'REJECTED') return false;
      } else if (activeTab === 'CANCELLED') {
        if (reg.status !== 'CANCELLED') return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = reg.eventTitle?.toLowerCase().includes(query);
        const venueMatch = reg.eventVenueName?.toLowerCase().includes(query);
        return titleMatch || venueMatch;
      }

      return true;
    });
  }, [registrations, activeTab, searchQuery]);

  return (
    <>
      <div className="relay-topbar">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>My Registrations & Digital Passes</span>
            <span style={{ fontSize: "12px", background: "var(--primary-light)", color: "var(--primary)", padding: "3px 12px", borderRadius: "14px", fontWeight: 700 }}>
              {registrations.length} Total
            </span>
          </h1>
          <p>Manage your university event passes, track application review statuses, and view QR entrance codes.</p>
        </div>
      </div>

      <div className="relay-body">
        <div style={{ maxWidth: "980px" }}>
          
          {/* Controls: Search and Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", marginBottom: "18px", flexWrap: "wrap" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "6px", background: "var(--bg)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", flexWrap: "wrap" }}>
              {[
                { key: 'CONFIRMED', label: 'Upcoming Confirmed', count: tabCounts.CONFIRMED },
                { key: 'PENDING', label: 'Pending Approval', count: tabCounts.PENDING },
                { key: 'COMPLETED', label: 'Completed', count: tabCounts.COMPLETED },
                { key: 'REJECTED', label: 'Declined', count: tabCounts.REJECTED },
                { key: 'CANCELLED', label: 'Cancelled', count: tabCounts.CANCELLED },
                { key: 'ALL', label: 'All Registrations', count: tabCounts.ALL },
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: activeTab === t.key ? 700 : 500,
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === t.key ? "var(--surface)" : "transparent",
                    color: activeTab === t.key ? "var(--primary)" : "var(--text-secondary)",
                    boxShadow: activeTab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>{t.label}</span>
                  <span style={{ 
                    fontSize: "11px", 
                    padding: "1px 6px", 
                    borderRadius: "10px", 
                    background: activeTab === t.key ? "var(--primary-light)" : "var(--border-light)",
                    color: activeTab === t.key ? "var(--primary)" : "var(--mute)"
                  }}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "220px", flex: "1", maxWidth: "300px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--mute)" }} />
              <input
                type="text"
                placeholder="Search registered events..."
                className="relay-input"
                style={{ paddingLeft: "32px", fontSize: "12.5px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Feedback states */}
          {isLoading && (
            <div className="relay-empty" style={{ padding: "48px 0" }}>Loading your event registrations...</div>
          )}
          {error && (
            <div className="relay-card" style={{ borderColor: "var(--coral)", background: "var(--coral-light)", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--coral)" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredRegistrations.length === 0 && (
            <div className="relay-card" style={{ textAlign: "center", padding: "52px 20px" }}>
              <Calendar size={40} style={{ color: "var(--mute)", margin: "0 auto 12px", opacity: 0.7 }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
                No {activeTab.toLowerCase()} registrations found
              </h3>
              <p style={{ color: "var(--mute)", fontSize: "13px", maxWidth: "420px", margin: "0 auto 18px" }}>
                {activeTab === 'CONFIRMED' 
                  ? "You have no upcoming confirmed passes. Browse available campus sessions and reserve your spot."
                  : activeTab === 'PENDING'
                  ? "You currently have no registration applications awaiting event organizer approval."
                  : "No events match this category or search filter."}
              </p>
              <button
                type="button"
                className="cc-btn-primary"
                onClick={() => navigate("/events")}
              >
                Browse Campus Events
              </button>
            </div>
          )}

          {/* Registration Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredRegistrations.map((reg) => {
              const statusStyle = getStatusStyle(reg.status);
              const matchedEvent = allEvents.find(e => String(e.id) === String(reg.eventId));
              const coverUrl = reg.eventCoverImageUrl || getEventCoverImage(matchedEvent || { id: reg.eventId, title: reg.eventTitle });
              const isPast = reg.eventStartTime && new Date(reg.eventStartTime) < new Date();

              return (
                <div 
                  key={reg.id} 
                  className="relay-card" 
                  style={{ 
                    cursor: "pointer", 
                    transition: "transform 0.15s ease, box-shadow 0.15s ease", 
                    padding: "18px 20px" 
                  }}
                  onClick={() => navigate(`/event/${reg.eventId}`)}
                >
                  <div style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
                    <img
                      src={coverUrl}
                      alt={reg.eventTitle}
                      onError={handleImageError}
                      style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border-light)" }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "5px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>{reg.eventTitle}</span>
                            {isPast && (
                              <span style={{ fontSize: "11px", color: "var(--mute)", background: "var(--border-light)", padding: "1px 8px", borderRadius: "8px", fontWeight: 600 }}>
                                Concluded
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <MapPin size={13} style={{ color: "var(--primary)" }} />
                              {reg.eventIsVirtual ? `Virtual Event` : (reg.eventVenueName || "Main Campus Hall")}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <CalendarClock size={13} style={{ color: "var(--primary)" }} />
                              {reg.eventStartTime ? new Date(reg.eventStartTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "TBA"}
                            </span>
                            {reg.eventRegistrationMode && (
                              <span style={{ fontSize: "11px", color: "var(--mute)", background: "var(--bg)", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
                                {reg.eventRegistrationMode.replace("_", " ")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ 
                          display: "inline-block", 
                          padding: "4px 14px", 
                          borderRadius: "20px", 
                          fontSize: "11.5px", 
                          fontWeight: 700,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          whiteSpace: "nowrap"
                        }}>
                          {reg.status}
                        </div>
                      </div>

                      <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--mute)", display: "flex", gap: "14px", flexWrap: "wrap" }}>
                        <span>Registered: {new Date(reg.registeredAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {reg.respondedAt && (
                          <span>Reviewed: {new Date(reg.respondedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        )}
                        {reg.cancelledAt && (
                          <span style={{ color: "var(--coral)" }}>Cancelled: {new Date(reg.cancelledAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        )}
                      </div>

                      {reg.reason && (reg.status === 'CANCELLED' || reg.status === 'REJECTED') && (
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--coral)", background: "var(--coral-light)", padding: "6px 12px", borderRadius: "6px", display: "inline-block" }}>
                          <strong>Reason:</strong> {reg.reason}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ marginTop: "14px", borderTop: "1px solid var(--border-light)", paddingTop: "12px", display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          {reg.status === 'CONFIRMED' && !isPast && (
                            <button 
                              type="button"
                              className="cc-btn-primary"
                              style={{ padding: "7px 14px", fontSize: "12px", background: "var(--teal)" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket(reg);
                              }}
                            >
                              <QrCode size={14} /> View Digital Pass
                            </button>
                          )}
                          
                          {['PENDING', 'CONFIRMED', 'WAITLISTED'].includes(reg.status) && !isPast && (
                            <button 
                              type="button"
                              className="relay-btn-danger relay-btn-sm" 
                              disabled={actionLoading} 
                              onClick={(e) => handleCancel(e, reg.eventId, reg.id, reg.eventStartTime)}
                            >
                              Cancel Pass
                            </button>
                          )}
                        </div>

                        <span style={{ fontSize: "12px", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "3px", fontWeight: 600 }}>
                          Event Details <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
