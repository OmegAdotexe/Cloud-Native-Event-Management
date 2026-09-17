import React, { useState, useEffect } from "react";
import { CheckCheck, BellRing, Info, CalendarClock, XCircle } from "lucide-react";
import * as relayApi from "../api/relayApi.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const ICONS = {
  REGISTRATION_CONFIRMED: { icon: <CheckCheck size={16} />, bg: "#E6F7F2", color: "#2AAB8A" },
  REGISTRATION_WAITLISTED: { icon: <CalendarClock size={16} />, bg: "#FFF4E6", color: "#E8943A" },
  REGISTRATION_REJECTED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  REGISTRATION_CANCELLED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  REGISTRATION_PENDING: { icon: <Info size={16} />, bg: "#FFF4E6", color: "#E8943A" },
  EVENT_PUBLISHED: { icon: <BellRing size={16} />, bg: "#F0ECFE", color: "#7C5CFC" },
  EVENT_CANCELLED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  EVENT_VENUE_CHANGED: { icon: <Info size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  EVENT_TIME_CHANGED: { icon: <Info size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  EVENT_UPDATED: { icon: <Info size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  TIMELINE_UPDATED: { icon: <CalendarClock size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
};

const DEFAULT_ICON = { icon: <BellRing size={16} />, bg: "#F0EDE8", color: "#8B90A5" };

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
          <button className="relay-btn-ghost" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="relay-body">
        <div style={{ maxWidth: "840px" }}>
          
          {isLoading && <div className="relay-empty">Loading notifications...</div>}
          {error && <div className="relay-empty" style={{ color: "var(--coral)" }}>{error}</div>}
          {!isLoading && !error && notifications.length === 0 && <div className="relay-empty">You're all caught up! No notifications.</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notifications.map((notif) => {
              const iconConfig = ICONS[notif.type] || DEFAULT_ICON;
              return (
                <div 
                  key={notif.id} 
                  className="relay-card" 
                  style={{ 
                    opacity: notif.isRead ? 0.65 : 1, 
                    display: "flex", 
                    gap: "14px",
                    alignItems: "flex-start",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => {
                    if (notif.eventId) {
                      navigate(`/event/${notif.eventId}`);
                    } else if (notif.type.startsWith("REGISTRATION_")) {
                      navigate("/my-registrations");
                    } else {
                      navigate("/");
                    }
                  }}
                >
                  <div style={{ 
                    width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
                    background: iconConfig.bg, color: iconConfig.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: "2px",
                  }}>
                    {iconConfig.icon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "13.5px" }}>{notif.title}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--mute)", whiteSpace: "nowrap", marginLeft: "12px" }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.5" }}>
                      {notif.message}
                    </div>
                    
                    {!notif.isRead && (
                      <div style={{ marginTop: "10px" }}>
                        <button 
                          className="relay-btn-ghost relay-btn-sm"
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
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
