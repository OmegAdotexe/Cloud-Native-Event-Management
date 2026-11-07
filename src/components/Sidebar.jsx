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
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";

const ROLE_DISPLAY = {
  SUPER_ADMIN: { label: "Super Admin", icon: ShieldCheck },
  EVENT_ADMIN: { label: "Event Admin", icon: CalendarClock },
  PARTICIPANT: { label: "Participant", icon: Users },
};

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
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

  const handleNav = (path) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const display = ROLE_DISPLAY[role] || ROLE_DISPLAY.PARTICIPANT;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div 
          className="cc-mobile-overlay" 
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 8, 22, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1099,
          }}
        />
      )}

      <aside className={`relay-side ${isCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div 
          className="relay-logo" 
          style={{ cursor: "pointer", justifyContent: isCollapsed ? "center" : "space-between" }} 
          onClick={() => handleNav("/")}
          title="CampusConnect Platform"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="relay-logo-mark">
              <Radio size={17} color="#fff" />
            </div>
            {!isCollapsed && (
              <div>
                <div className="relay-logo-text" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CampusConnect</div>
                <div className="relay-logo-sub">Cloud Event Platform</div>
              </div>
            )}
          </div>

          {/* Close button inside mobile drawer */}
          <button
            type="button"
            className="cc-mobile-close-btn"
            onClick={onCloseMobile}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--mute)",
              cursor: "pointer",
              padding: "4px",
              display: "none", // Displayed via CSS in mobile media query
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Workspace Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {!isCollapsed && (
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px 4px" }}>
              Workspace
            </div>
          )}

          <div
            className={`relay-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleNav("/")}
            title={isCollapsed ? "Dashboard" : undefined}
            style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
          >
            <LayoutDashboard size={16} />
            {!isCollapsed && <span>Dashboard</span>}
          </div>

          <div
            className={`relay-nav-item ${location.pathname === '/events' ? 'active' : ''}`}
            onClick={() => handleNav("/events")}
            title={isCollapsed ? "Events Directory" : undefined}
            style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
          >
            <Calendar size={16} />
            {!isCollapsed && <span>Events Directory</span>}
          </div>

          {role === "SUPER_ADMIN" && (
            <div
              className={`relay-nav-item ${location.pathname === '/admin-management' ? 'active' : ''}`}
              onClick={() => handleNav("/admin-management")}
              title={isCollapsed ? "Admin Approvals" : undefined}
              style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
            >
              <UserCheck size={16} />
              {!isCollapsed && <span>Admin Approvals</span>}
            </div>
          )}

          {role === "PARTICIPANT" && (
            <div
              className={`relay-nav-item ${location.pathname === '/my-registrations' ? 'active' : ''}`}
              onClick={() => handleNav("/my-registrations")}
              title={isCollapsed ? "My Registrations" : undefined}
              style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
            >
              <CalendarClock size={16} />
              {!isCollapsed && <span>My Registrations</span>}
            </div>
          )}

          <div
            className={`relay-nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}
            onClick={() => handleNav("/notifications")}
            title={isCollapsed ? `Notifications (${unreadCount})` : undefined}
            style={{ 
              display: "flex", 
              justifyContent: isCollapsed ? "center" : "space-between", 
              alignItems: "center" 
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Bell size={16} />
              {!isCollapsed && <span>Notifications</span>}
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
                display: isCollapsed ? "none" : "block",
              }}>
                {unreadCount}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Portal Navigation */}
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
          {!isCollapsed && (
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px 4px" }}>
              Public Portal
            </div>
          )}

          <div
            className={`relay-nav-item secondary-portal-link ${location.pathname === '/landing' ? 'active' : ''}`}
            onClick={() => handleNav("/landing")}
            title={isCollapsed ? "Explore Public Portal" : undefined}
            style={{ 
              justifyContent: isCollapsed ? "center" : "flex-start",
              opacity: 0.85,
            }}
          >
            <Globe size={16} />
            {!isCollapsed && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span>Explore Portal</span>
                <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.1)", color: "var(--accent)" }}>
                  Public
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Spacer pushes bottom items down */}
        <div style={{ flex: 1 }} />

        {/* Bottom Section */}
        <div className="relay-nav-separator" />

        {/* User Card Pill (Hidden when collapsed) */}
        {!isCollapsed && (
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
        )}

        {/* Desktop Sidebar Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            className="relay-nav-item cc-collapse-toggle-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "none",
              cursor: "pointer",
              width: "100%",
              justifyContent: isCollapsed ? "center" : "space-between",
              fontFamily: "inherit",
              fontSize: "12.5px",
              color: "var(--mute)",
              marginBottom: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!isCollapsed && <span>Collapse Sidebar</span>}
            </div>
          </button>
        )}

        <button
          type="button"
          className="relay-nav-item"
          onClick={handleLogout}
          title={isCollapsed ? "Log Out" : undefined}
          style={{ 
            background: "transparent", 
            border: "none", 
            cursor: "pointer", 
            width: "100%", 
            textAlign: "left", 
            fontFamily: "inherit", 
            fontSize: "13px",
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </aside>
    </>
  );
}
