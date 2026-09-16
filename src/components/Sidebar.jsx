import React, { useState, useEffect } from "react";
import {
  Radio,
  ShieldCheck,
  CalendarClock,
  Users,
  LayoutDashboard,
  LogOut,
  Bell,
  Calendar,
  Clock,
  Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";

const ROLE_DISPLAY = {
  SUPER_ADMIN: { label: "Super Admin", icon: ShieldCheck },
  EVENT_ADMIN: { label: "Event Admin", icon: CalendarClock },
  PARTICIPANT: { label: "Participant", icon: Users },
};

/**
 * Sidebar — logo, user info, navigation, and logout.
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
          <Radio size={16} color="#fff" />
        </div>
        <div>
          <div className="relay-logo-text relay-display">Relay</div>
          <div className="relay-logo-sub">Campus Events Platform</div>
        </div>
      </div>

      {/* Main navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div
          className={`relay-nav-item ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate("/")}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </div>

        <div
          className={`relay-nav-item ${location.pathname === '/events' ? 'active' : ''}`}
          onClick={() => navigate("/events")}
        >
          <Calendar size={16} />
          Events
        </div>

        {role === "PARTICIPANT" && (
          <div
            className={`relay-nav-item ${location.pathname === '/my-registrations' ? 'active' : ''}`}
            onClick={() => navigate("/my-registrations")}
          >
            <CalendarClock size={16} />
            My Registrations
          </div>
        )}

        <div
          className={`relay-nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}
          onClick={() => navigate("/notifications")}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Bell size={16} />
            Notifications
          </div>
          {unreadCount > 0 && (
            <div style={{
              background: "#E55A4F",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "bold",
              padding: "2px 7px",
              borderRadius: "10px",
              minWidth: "18px",
              textAlign: "center",
            }}>
              {unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* Spacer pushes bottom items down */}
      <div style={{ flex: 1 }} />

      {/* Bottom section */}
      <div className="relay-nav-separator" />

      <div className="relay-nav-item" onClick={() => {}} style={{ opacity: 0.6, cursor: "default" }}>
        <Settings size={16} />
        Settings
      </div>

      <button
        className="relay-nav-item"
        onClick={handleLogout}
        style={{ background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit", fontSize: "13px" }}
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
}
