import React, { useState, useEffect } from "react";
import { CheckCheck, BellRing, Info, CalendarClock, XCircle } from "lucide-react";
import * as relayApi from "../api/relayApi.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const ICONS = {
  REGISTRATION_CONFIRMED: <CheckCheck size={16} color="#10b981" />,
  REGISTRATION_WAITLISTED: <CalendarClock size={16} color="#f59e0b" />,
  REGISTRATION_REJECTED: <XCircle size={16} color="#ef4444" />,
  REGISTRATION_CANCELLED: <XCircle size={16} color="#ef4444" />,
  REGISTRATION_PENDING: <Info size={16} color="#f59e0b" />,
  EVENT_PUBLISHED: <BellRing size={16} color="#6366f1" />,
  EVENT_CANCELLED: <XCircle size={16} color="#ef4444" />,
  EVENT_VENUE_CHANGED: <Info size={16} color="#3b82f6" />,
  EVENT_TIME_CHANGED: <Info size={16} color="#3b82f6" />,
  EVENT_UPDATED: <Info size={16} color="#3b82f6" />,
  TIMELINE_UPDATED: <CalendarClock size={16} color="#3b82f6" />
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const pageData = await relayApi.getNotifications(0, 50);
      setNotifications(pageData.content || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await relayApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await relayApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  return (
    <>
      <div className="relay-topbar">
        <div>
          <h1>Notifications</h1>
          <p>Updates on your events and registrations.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button className="relay-btn" style={{ background: "var(--mute)" }} onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="relay-body">
        <div className="relay-grid" style={{ gridTemplateColumns: "1fr", maxWidth: "800px" }}>
          
          {isLoading && <div className="relay-empty">Loading notifications...</div>}
          {error && <div className="relay-empty" style={{ color: "#ef4444" }}>{error}</div>}
          {!isLoading && !error && notifications.length === 0 && <div className="relay-empty">You're all caught up! No notifications.</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className="relay-card" 
                style={{ 
                  opacity: notif.isRead ? 0.6 : 1, 
                  display: "flex", 
                  gap: "16px",
                  alignItems: "flex-start",
                  padding: "16px",
                  cursor: "pointer"
                }}
                onClick={() => {
                  if (notif.type.startsWith("REGISTRATION_")) {
                    navigate("/my-registrations");
                  } else {
                    navigate("/participant");
                  }
                }}
              >
                <div style={{ marginTop: "2px" }}>
                  {ICONS[notif.type] || <BellRing size={16} />}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{notif.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--mute)" }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "13px", color: "var(--text)", marginTop: "4px", lineHeight: "1.5" }}>
                    {notif.message}
                  </div>
                  
                  {!notif.isRead && (
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                      <button 
                        className="relay-btn" 
                        style={{ padding: "4px 10px", fontSize: "11px", background: "transparent", color: "var(--text)", border: "1px solid var(--border)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                      >
                        Mark as read
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
