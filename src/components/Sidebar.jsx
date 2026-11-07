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
  Globe,
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
 * Sidebar — CampusConnect logo, user role info, navigation, and logout.
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
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const display = ROLE_DISPLAY[role] || ROLE_DISPLAY.PARTICIPANT;

  return (
    <div className="relay-side">
      {/* Brand Logo */}
      <div className="relay-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
        <div className="relay-logo-mark">
          <Radio size={17} color="#fff" />
        </div>
        <div>
          <div className="relay-logo-text" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CampusConnect</div>
          <div className="relay-logo-sub">Cloud Event Platform</div>
        </div>
      </div>

      {/* Main navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
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
          Events Directory
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
              background: "var(--coral)",
              color: "#fff",
              fontSize: "10.5px",
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

        <div
          className={`relay-nav-item ${location.pathname === '/landing' ? 'active' : ''}`}
          onClick={() => navigate("/landing")}
        >
          <Globe size={16} />
          Explore Portal
        </div>
      </div>

      {/* Spacer pushes bottom items down */}
      <div style={{ flex: 1 }} />

      {/* Bottom section */}
      <div className="relay-nav-separator" />

      {/* User Card Pill */}
      <div style={{
        padding: "10px 12px",
        borderRadius: "10px",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        marginBottom: "6px"
      }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.name || "User"}
        </div>
        <div style={{ fontSize: "11px", color: "var(--accent)", marginTop: "2px" }}>
          {display.label}
        </div>
      </div>

      <button
        type="button"
        className="relay-nav-item"
        onClick={handleLogout}
        style={{ background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit", fontSize: "13px" }}
      >
        <LogOut size={16} />
        Log Out
      </button>
    </div>
  );
}
