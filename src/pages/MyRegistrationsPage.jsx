import React, { useState, useEffect } from "react";
import { CalendarClock, MapPin, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";

function getStatusStyle(status) {
  switch (status) {
    case 'CONFIRMED': return { bg: "#E6F7F2", color: "#1A8A6A" };
    case 'WAITLISTED': return { bg: "#FFF4E6", color: "#C77E1F" };
    case 'PENDING': return { bg: "#F0ECFE", color: "#7C5CFC" };
    case 'CANCELLED': return { bg: "#FDE8E7", color: "#C44035" };
    case 'REJECTED': return { bg: "#FDE8E7", color: "#C44035" };
    default: return { bg: "#F0EDE8", color: "#8B90A5" };
  }
}

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await relayApi.getMyRegistrations();
      setRegistrations(data);
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

  return <>
    <div className="relay-topbar">
      <div>
        <h1>My Registrations</h1>
        <p>Track the status of your event registrations.</p>
      </div>
    </div>
    <div className="relay-body">
      <div style={{ maxWidth: "840px" }}>
        {isLoading && <div className="relay-empty">Loading registrations...</div>}
        {error && <div className="relay-empty" style={{ color: "var(--coral)" }}>{error}</div>}
        {!isLoading && !error && registrations.length === 0 && <div className="relay-empty">You haven't registered for any events yet.</div>}
        
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {registrations.map((reg) => {
            const statusStyle = getStatusStyle(reg.status);
            return (
              <div 
                key={reg.id} 
                className="relay-card" 
                style={{ cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => navigate(`/event/${reg.eventId}`)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                      {reg.eventTitle}
                    </div>
                    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                      <span className="relay-meta-item">
                        <MapPin size={12} /> {reg.eventIsVirtual ? `Virtual${reg.eventVirtualLink ? ': ' + reg.eventVirtualLink : ''}` : reg.eventVenueName}
                      </span>
                      <span className="relay-meta-item">
                        <CalendarClock size={12} /> {new Date(reg.eventStartTime).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--mute)" }}>
                      Registered on: {new Date(reg.registeredAt).toLocaleString()}
                      <span style={{ marginLeft: "16px" }}>Event Status: {reg.eventStatus}</span>
                    </div>
                    {reg.reason && (reg.status === 'CANCELLED' || reg.status === 'REJECTED') && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--coral)", fontStyle: "italic" }}>
                        Reason: {reg.reason}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ 
                      display: "inline-block", 
                      padding: "4px 12px", 
                      borderRadius: "20px", 
                      fontSize: "12px", 
                      fontWeight: "600",
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      {reg.status}
                    </div>
                    <ChevronRight size={16} color="var(--mute)" />
                  </div>
                </div>

                {['PENDING', 'CONFIRMED', 'WAITLISTED'].includes(reg.status) && reg.eventStatus === 'PUBLISHED' && (
                  <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <button 
                      className="relay-btn-danger" 
                      disabled={actionLoading} 
                      onClick={(e) => handleCancel(e, reg.eventId, reg.id)}
                    >
                      Cancel Registration
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </>;
}
