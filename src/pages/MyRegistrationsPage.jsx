import React, { useState, useEffect } from "react";
import { CalendarClock, MapPin } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as relayApi from "../api/relayApi.js";

export default function MyRegistrationsPage() {
  const { user } = useAuth();
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

  const handleCancel = async (eventId, registrationId) => {
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
      <div className="relay-grid" style={{ gridTemplateColumns: "1fr", maxWidth: "800px" }}>
        <div>
          {isLoading && <div className="relay-empty">Loading registrations...</div>}
          {error && <div className="relay-empty">{error}</div>}
          {!isLoading && !error && registrations.length === 0 && <div className="relay-empty">You haven't registered for any events yet.</div>}
          
          {registrations.map((reg) => (
            <div key={reg.id} className="relay-card" style={{ marginTop: 8, padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="relay-event-name" style={{ fontSize: "16px", marginBottom: "4px" }}>
                    {reg.eventTitle}
                  </div>
                  <div className="relay-event-meta">
                    <span className="relay-meta-item">
                      <MapPin size={11} /> {reg.eventIsVirtual ? `Virtual${reg.eventVirtualLink ? ': ' + reg.eventVirtualLink : ''}` : reg.eventVenueName}
                    </span>
                    <span className="relay-meta-item">
                      <CalendarClock size={11} /> {new Date(reg.eventStartTime).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--mute)" }}>
                    Registered on: {new Date(reg.registeredAt).toLocaleString()}
                    <br />
                    Event Status: {reg.eventStatus}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    display: "inline-block", 
                    padding: "4px 8px", 
                    borderRadius: "4px", 
                    fontSize: "12px", 
                    fontWeight: "600",
                    backgroundColor: reg.status === 'CONFIRMED' ? "#10b98122" : reg.status === 'WAITLISTED' ? "#f59e0b22" : reg.status === 'PENDING' ? "#6366f122" : "#ef444422",
                    color: reg.status === 'CONFIRMED' ? "#10b981" : reg.status === 'WAITLISTED' ? "#f59e0b" : reg.status === 'PENDING' ? "#6366f1" : "#ef4444"
                  }}>
                    {reg.status}
                  </div>
                </div>
              </div>
              
              {['PENDING', 'CONFIRMED', 'WAITLISTED'].includes(reg.status) && reg.eventStatus === 'PUBLISHED' && (
                <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <button 
                    className="relay-btn" 
                    disabled={actionLoading} 
                    onClick={() => handleCancel(reg.eventId, reg.id)}
                    style={{ backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444" }}
                  >
                    Cancel Registration
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </>;
}
