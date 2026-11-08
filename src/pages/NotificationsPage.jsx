import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckCheck, BellRing, Info, CalendarClock, XCircle, 
  Clock, AlertTriangle, ShieldCheck, UserCheck, ExternalLink, Filter
} from "lucide-react";
import * as relayApi from "../api/relayApi.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const ICONS = {
  REGISTRATION_CONFIRMED: { icon: <CheckCheck size={16} />, bg: "#E6F7F2", color: "#2AAB8A" },
  REGISTRATION_WAITLISTED: { icon: <CalendarClock size={16} />, bg: "#FFF4E6", color: "#E8943A" },
  REGISTRATION_REJECTED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  REGISTRATION_CANCELLED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  REGISTRATION_PENDING: { icon: <Clock size={16} />, bg: "#EDE9FE", color: "#6C3BEE" },
  EVENT_PUBLISHED: { icon: <BellRing size={16} />, bg: "#F0ECFE", color: "#7C5CFC" },
  EVENT_CANCELLED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  EVENT_VENUE_CHANGED: { icon: <Info size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  EVENT_TIME_CHANGED: { icon: <Clock size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  EVENT_UPDATED: { icon: <Info size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  TIMELINE_UPDATED: { icon: <CalendarClock size={16} />, bg: "#EBF0FE", color: "#4A7BF7" },
  EVENT_REMINDER: { icon: <CalendarClock size={16} />, bg: "#FEF3C7", color: "#D97706" },
  EVENT_CAPACITY_REACHED: { icon: <AlertTriangle size={16} />, bg: "#FEF3C7", color: "#D97706" },
  ADMIN_APPLICATION_SUBMITTED: { icon: <ShieldCheck size={16} />, bg: "#EDE9FE", color: "#6C3BEE" },
  ADMIN_APPLICATION_RECEIVED: { icon: <Info size={16} />, bg: "#EDE9FE", color: "#6C3BEE" },
  ADMIN_APPLICATION_APPROVED: { icon: <UserCheck size={16} />, bg: "#E6F7F2", color: "#2AAB8A" },
  ADMIN_APPLICATION_REJECTED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  ADMIN_PRIVILEGES_REVOKED: { icon: <XCircle size={16} />, bg: "#FDE8E7", color: "#E55A4F" },
  ADMIN_PRIVILEGES_SUSPENDED: { icon: <AlertTriangle size={16} />, bg: "#FEF3C7", color: "#D97706" },
};

const DEFAULT_ICON = { icon: <BellRing size={16} />, bg: "#F0EDE8", color: "#8B90A5" };

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const [pageData, countData] = await Promise.all([
        relayApi.getNotifications(activeCategory, page, 30),
        relayApi.getUnreadNotificationCount().catch(() => ({ count: 0 }))
      ]);
      setNotifications(pageData.content || []);
      setTotalPages(pageData.totalPages || 1);
      setUnreadCount(countData?.count || 0);
    } catch (err) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeCategory, page]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await relayApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await relayApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }

    // Role-aware deep navigation
    if (notif.type && notif.type.startsWith("ADMIN_APPLICATION_")) {
      if (user?.role === "SUPER_ADMIN") {
        navigate("/admin-management");
      }
      return;
    }

    if (notif.type === "REGISTRATION_PENDING") {
      if (user?.role === "EVENT_ADMIN" || user?.role === "SUPER_ADMIN") {
        navigate("/events", { state: { editEventId: notif.eventId, tab: "REGISTRATIONS" } });
      } else {
        navigate("/my-registrations");
      }
      return;
    }

    if (notif.eventId) {
      if (user?.role === "EVENT_ADMIN" || user?.role === "SUPER_ADMIN") {
        navigate("/events", { state: { editEventId: notif.eventId, tab: "REGISTRATIONS" } });
      } else {
        navigate(`/event/${notif.eventId}`);
      }
      return;
    }

    if (notif.type && notif.type.startsWith("REGISTRATION_")) {
      navigate("/my-registrations");
    }
  };

  const displayedNotifications = useMemo(() => {
    if (unreadOnly) {
      return notifications.filter(n => !n.isRead);
    }
    return notifications;
  }, [notifications, unreadOnly]);

  return (
    <>
      <div className="relay-topbar">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Notification Centre</span>
            {unreadCount > 0 && (
              <span style={{ 
                fontSize: "12px", 
                background: "var(--primary)", 
                color: "#fff", 
                padding: "2px 10px", 
                borderRadius: "12px", 
                fontWeight: 700 
              }}>
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p>Real-time session updates, registration confirmations, and administrative notices.</p>
        </div>
        {unreadCount > 0 && (
          <button className="relay-btn-ghost" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="relay-body">
        <div style={{ maxWidth: "860px" }}>
          
          {/* Categories and Filters Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "6px", background: "var(--bg)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", flexWrap: "wrap" }}>
              {[
                { key: "ALL", label: "All Updates" },
                { key: "REGISTRATIONS", label: "Registrations" },
                { key: "EVENTS", label: "Event Updates" },
                ...(user?.role === "SUPER_ADMIN" ? [{ key: "ADMIN", label: "Governance" }] : [])
              ].map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => { setActiveCategory(cat.key); setPage(0); }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: activeCategory === cat.key ? 700 : 500,
                    border: "none",
                    cursor: "pointer",
                    background: activeCategory === cat.key ? "var(--surface)" : "transparent",
                    color: activeCategory === cat.key ? "var(--primary)" : "var(--text-secondary)",
                    boxShadow: activeCategory === cat.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--text)", cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                style={{ accentColor: "var(--primary)" }}
              />
              Show Unread Only
            </label>
          </div>

          {isLoading && <div className="relay-empty" style={{ padding: "40px 0" }}>Loading notifications...</div>}
          {error && <div className="relay-empty" style={{ color: "var(--coral)" }}>{error}</div>}
          
          {!isLoading && !error && displayedNotifications.length === 0 && (
            <div className="relay-card" style={{ textAlign: "center", padding: "48px 20px" }}>
              <BellRing size={36} style={{ color: "var(--mute)", margin: "0 auto 12px", opacity: 0.6 }} />
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                {unreadOnly ? "No unread notifications" : "You're all caught up!"}
              </h3>
              <p style={{ color: "var(--mute)", fontSize: "13px" }}>
                {unreadOnly ? "All your notifications in this category have been marked as read." : "New event reminders, passes, and schedule changes will appear here."}
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {displayedNotifications.map((notif) => {
              const iconConfig = ICONS[notif.type] || DEFAULT_ICON;
              return (
                <div 
                  key={notif.id} 
                  className="relay-card" 
                  style={{ 
                    borderLeft: !notif.isRead ? "3px solid var(--primary)" : "1px solid var(--border)",
                    background: !notif.isRead ? "var(--surface)" : "var(--bg)",
                    display: "flex", 
                    gap: "14px",
                    alignItems: "flex-start",
                    cursor: "pointer",
                    padding: "16px 18px",
                    transition: "background 0.15s ease, transform 0.15s ease",
                  }}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div style={{ 
                    width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                    background: iconConfig.bg, color: iconConfig.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: "2px",
                  }}>
                    {iconConfig.icon}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "14px" }}>{notif.title}</span>
                        {!notif.isRead && (
                          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--primary)", display: "inline-block" }}></span>
                        )}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--mute)", whiteSpace: "nowrap" }}>
                        {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.5" }}>
                      {notif.message}
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                      <span style={{ fontSize: "11.5px", color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        View Details <ExternalLink size={11} />
                      </span>

                      {!notif.isRead && (
                        <button 
                          type="button"
                          className="relay-btn-ghost relay-btn-sm"
                          style={{ padding: "3px 10px", fontSize: "11px" }}
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "12px", color: "var(--mute)" }}>
              <span>Page {page + 1} of {totalPages}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  type="button"
                  className="relay-btn-ghost relay-btn-sm" 
                  disabled={page === 0 || isLoading} 
                  onClick={() => setPage(p => p - 1)}
                >
                  Prev
                </button>
                <button 
                  type="button"
                  className="relay-btn-ghost relay-btn-sm" 
                  disabled={page >= totalPages - 1 || isLoading} 
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
