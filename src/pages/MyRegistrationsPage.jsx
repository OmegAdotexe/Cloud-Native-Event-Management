import React, { useState, useEffect } from "react";
import { CalendarClock, MapPin, ChevronRight, QrCode, AlertCircle, Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import TicketModal from "../components/TicketModal.jsx";
import { getEventCoverImage, handleImageError } from "../data/eventAssets.js";

function getStatusStyle(status) {
  switch (status) {
    case 'CONFIRMED': return { bg: "var(--teal-light)", color: "var(--teal)" };
    case 'WAITLISTED': return { bg: "var(--amber-light)", color: "var(--amber)" };
    case 'PENDING': return { bg: "var(--primary-light)", color: "var(--primary)" };
    case 'CANCELLED': return { bg: "var(--coral-light)", color: "var(--coral)" };
    case 'REJECTED': return { bg: "var(--coral-light)", color: "var(--coral)" };
    default: return { bg: "var(--bg)", color: "var(--mute)" };
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

  const handleCancel = async (e, eventId, registrationId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;
    
    setActionLoading(true);
    try {
      await relayApi.cancelRegistration(eventId, registrationId);
      await fetchRegistrations();
    } catch (err) {
      alert(err.message || "Failed to cancel registration");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="relay-topbar">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>My Event Passes & Registrations</span>
            <span style={{ fontSize: "12px", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 10px", borderRadius: "12px", fontWeight: 600 }}>
              {registrations.length} {registrations.length === 1 ? "Registration" : "Registrations"}
            </span>
          </h1>
          <p>Access your digital entrance QR tickets and manage campus event participation.</p>
        </div>
      </div>
      <div className="relay-body">
        <div style={{ maxWidth: "880px" }}>
          {isLoading && (
            <div className="relay-empty" style={{ padding: "40px 0" }}>Loading registrations...</div>
          )}
          {error && (
            <div className="relay-card" style={{ borderColor: "var(--coral)", background: "var(--coral-light)", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--coral)" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            </div>
          )}
          {!isLoading && !error && registrations.length === 0 && (
            <div className="relay-card" style={{ textAlign: "center", padding: "48px 20px" }}>
              <Calendar size={36} style={{ color: "var(--mute)", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
                No active registrations
              </h3>
              <p style={{ color: "var(--mute)", fontSize: "13px", maxWidth: "360px", margin: "0 auto 16px" }}>
                You have not registered for any events yet. Check out the campus event directory to reserve your pass.
              </p>
              <button
                type="button"
                className="cc-btn-primary"
                onClick={() => navigate("/events")}
              >
                Explore Campus Events
              </button>
            </div>
          )}
          
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {registrations.map((reg) => {
              const statusStyle = getStatusStyle(reg.status);
              const matchedEvent = allEvents.find(e => String(e.id) === String(reg.eventId));
              const coverUrl = getEventCoverImage(matchedEvent || { id: reg.eventId, title: reg.eventTitle });

              return (
                <div 
                  key={reg.id} 
                  className="relay-card" 
                  style={{ cursor: "pointer", transition: "all 0.2s", padding: "18px 20px" }}
                  onClick={() => navigate(`/event/${reg.eventId}`)}
                >
                  <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <img
                      src={coverUrl}
                      alt={reg.eventTitle}
                      onError={handleImageError}
                      style={{ width: "70px", height: "70px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                            {reg.eventTitle}
                          </div>
                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <MapPin size={13} style={{ color: "var(--primary)" }} />
                              {reg.eventIsVirtual ? `Virtual Event` : (reg.eventVenueName || "Main Campus Hall")}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <CalendarClock size={13} style={{ color: "var(--primary)" }} />
                              {new Date(reg.eventStartTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>

                        <div style={{ 
                          display: "inline-block", 
                          padding: "4px 12px", 
                          borderRadius: "20px", 
                          fontSize: "11.5px", 
                          fontWeight: 700,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          whiteSpace: "nowrap"
                        }}>
                          {reg.status}
                        </div>
                      </div>

                      <div style={{ marginTop: "10px", fontSize: "11.5px", color: "var(--mute)" }}>
                        Registered on {new Date(reg.registeredAt).toLocaleDateString()}
                      </div>

                      {reg.reason && (reg.status === 'CANCELLED' || reg.status === 'REJECTED') && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "var(--coral)", fontStyle: "italic" }}>
                          Reason: {reg.reason}
                        </div>
                      )}

                      {/* Action buttons */}
                      {['PENDING', 'CONFIRMED', 'WAITLISTED'].includes(reg.status) && (
                        <div style={{ marginTop: 14, borderTop: "1px solid var(--border-light)", paddingTop: 12, display: "flex", gap: "10px", alignItems: "center" }}>
                          {reg.status === 'CONFIRMED' && (
                            <button 
                              type="button"
                              className="cc-btn-primary"
                              style={{ padding: "7px 14px", fontSize: "12.5px", background: "var(--teal)" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket(reg);
                              }}
                            >
                              <QrCode size={14} /> View Digital Pass
                            </button>
                          )}
                          <button 
                            type="button"
                            className="relay-btn-danger relay-btn-sm" 
                            disabled={actionLoading} 
                            onClick={(e) => handleCancel(e, reg.eventId, reg.id)}
                          >
                            Cancel Registration
                          </button>
                        </div>
                      )}
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
