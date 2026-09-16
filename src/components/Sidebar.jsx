import React, { useState, useEffect } from "react";
import {
  Radio,
  ShieldCheck,
  CalendarClock,
  Users,
  LayoutDashboard,
  LogOut,
  Bell
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";

const ROLE_DISPLAY = {
  SUPER_ADMIN: { label: "Super Admin", icon: ShieldCheck },
  EVENT_ADMIN: { label: "Event Admin", icon: CalendarClock },
  PARTICIPANT: { label: "Participant", icon: Users },
};

const NAV_LABEL = {
  SUPER_ADMIN: "Operations overview",
  EVENT_ADMIN: "Events",
  PARTICIPANT: "My events",
};

/**
 * Sidebar — logo, user info, logout, and bottom nav.
 * Reads role from AuthContext.
 */
export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      relayApi.getUnreadNotificationCount()
        .then(res => setUnreadCount(res.count))
        .catch(err => console.error("Failed to load notifications", err));
    }
  }, [user, location.pathname]); // Refresh count on navigation

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const display = ROLE_DISPLAY[role] || ROLE_DISPLAY.PARTICIPANT;
  const Icon = display.icon;

  return (
    <div className="relay-side">
      {/* Logo */}
      <div className="relay-logo">
        <div className="relay-logo-mark">
          <Radio size={14} color="#1A1206" />
        </div>
        <div>
          <div className="relay-logo-text relay-display">Relay</div>
          <div className="relay-logo-sub">campus event ops</div>
        </div>
      </div>

      {/* User Info */}
      <div className="relay-roles" style={{ marginTop: "12px" }}>
        <div className="relay-role-label">signed in as</div>
        <div className="relay-role-btn active" style={{ cursor: "default" }}>
          <span className="relay-role-dot" />
          <Icon size={14} />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
            <span style={{ fontWeight: 600, color: "var(--paper)" }}>{user?.name || "User"}</span>
            <span style={{ fontSize: "10.5px", color: "var(--mute)" }}>{display.label}</span>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="relay-nav">
        <div className={`relay-nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <LayoutDashboard size={13} />
          {NAV_LABEL[role] || "Dashboard"}
        </div>
        {role === "PARTICIPANT" && (
          <div className={`relay-nav-item ${location.pathname === '/my-registrations' ? 'active' : ''}`} onClick={() => navigate("/my-registrations")} style={{ cursor: "pointer" }}>
            <CalendarClock size={13} />
            My Registrations
          </div>
        )}
        <div className={`relay-nav-item ${location.pathname === '/notifications' ? 'active' : ''}`} onClick={() => navigate("/notifications")} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Bell size={13} />
            Notifications
          </div>
          {unreadCount > 0 && (
            <div style={{ background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px" }}>
              {unreadCount}
            </div>
          )}
        </div>
        <button
          className="relay-nav-item"
          onClick={handleLogout}
          style={{ background: "transparent", border: "none", cursor: "pointer", width: "100%", marginTop: "8px" }}
        >
          <LogOut size={13} />
          Log out
        </button>
      </div>
    </div>
  );
}
