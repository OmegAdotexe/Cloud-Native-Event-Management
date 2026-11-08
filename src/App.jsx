import React, { useCallback, useEffect, useState, useRef } from "react";
import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext.jsx";
import * as relayApi from "./api/relayApi.js";
import { 
  Search, Bell, ChevronDown, Sun, Moon, Menu, User as UserIcon, 
  Edit3, KeyRound, LogOut, ShieldCheck, CalendarClock, Users as UsersIcon 
} from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import ProfileModal from "./components/ProfileModal.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ParticipantPage from "./pages/ParticipantPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import MyRegistrationsPage from "./pages/MyRegistrationsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import SuperAdminPage from "./pages/SuperAdminPage.jsx";
import SuperAdminEventsPage from "./pages/SuperAdminEventsPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminManagementPage from "./pages/AdminManagementPage.jsx";
import ParticipantEventsPage from "./pages/ParticipantEventsPage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import EventAnalyticsPage from "./pages/EventAnalyticsPage.jsx";

function TopHeader({ onOpenMobileMenu }) {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState("DETAILS");
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      relayApi.getUnreadNotificationCount()
        .then(res => setUnreadCount(res.count))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const ROLE_LABELS = {
    SUPER_ADMIN: "Super Admin",
    EVENT_ADMIN: "Event Admin",
    PARTICIPANT: "Participant",
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/events?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate("/events");
    }
  };

  const handleOpenModal = (tab) => {
    setProfileModalTab(tab);
    setProfileModalOpen(true);
    setDropdownOpen(false);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <>
      <div className="relay-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="relay-btn-ghost cc-hamburger-btn"
            onClick={onOpenMobileMenu}
            title="Open navigation menu"
            style={{ padding: "8px", borderRadius: "10px" }}
          >
            <Menu size={20} />
          </button>

          <form onSubmit={handleSearchSubmit} className="relay-search" style={{ margin: 0, flex: 1, maxWidth: "460px" }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search campus events, venues, or clubs..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </form>
        </div>

        <div className="relay-header-actions">
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="relay-btn-ghost"
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            style={{ padding: "8px 10px", borderRadius: "10px", display: "flex", alignItems: "center" }}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Notification Bell */}
          <div className="relay-header-bell" onClick={() => navigate("/notifications")}>
            <Bell size={19} />
            {unreadCount > 0 && <div className="relay-header-badge" />}
          </div>

          {/* User Card with Interactive Dropdown Menu */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <div 
              className="relay-header-user" 
              onClick={() => setDropdownOpen(prev => !prev)}
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              <div className="relay-header-avatar">{initials}</div>
              <div className="relay-header-user-text">
                <div className="relay-header-name">{user?.name || "User"}</div>
                <div className="relay-header-role">{ROLE_LABELS[role] || "Participant"}</div>
              </div>
              <ChevronDown 
                size={14} 
                style={{ 
                  color: "var(--mute)", 
                  transform: dropdownOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease"
                }} 
              />
            </div>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="cc-profile-dropdown-menu" style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "240px",
                background: "var(--surface)",
                borderRadius: "14px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
                border: "1px solid var(--border)",
                padding: "8px",
                zIndex: 1100,
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                animation: "fadeIn 0.15s ease-out",
              }}>
                {/* Header in Dropdown */}
                <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid var(--border-light)", marginBottom: "4px" }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text)" }}>{user?.name || "User"}</div>
                  <div style={{ fontSize: "11.5px", color: "var(--mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.email}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "var(--primary-light)", color: "var(--primary)" }}>
                      {ROLE_LABELS[role] || "Participant"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  type="button"
                  className="cc-dropdown-item"
                  onClick={() => handleOpenModal("DETAILS")}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px",
                    background: "transparent", border: "none", borderRadius: "8px", fontSize: "13px",
                    color: "var(--text)", cursor: "pointer", textAlign: "left"
                  }}
                >
                  <UserIcon size={15} style={{ color: "var(--primary)" }} />
                  Account Details
                </button>

                <button
                  type="button"
                  className="cc-dropdown-item"
                  onClick={() => handleOpenModal("EDIT")}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px",
                    background: "transparent", border: "none", borderRadius: "8px", fontSize: "13px",
                    color: "var(--text)", cursor: "pointer", textAlign: "left"
                  }}
                >
                  <Edit3 size={15} style={{ color: "var(--teal)" }} />
                  Edit Profile
                </button>

                <button
                  type="button"
                  className="cc-dropdown-item"
                  onClick={() => handleOpenModal("PASSWORD")}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px",
                    background: "transparent", border: "none", borderRadius: "8px", fontSize: "13px",
                    color: "var(--text)", cursor: "pointer", textAlign: "left"
                  }}
                >
                  <KeyRound size={15} style={{ color: "var(--amber)" }} />
                  Change Password
                </button>

                <div style={{ height: "1px", background: "var(--border-light)", margin: "4px 0" }} />

                <button
                  type="button"
                  className="cc-dropdown-item"
                  onClick={handleLogout}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px",
                    background: "transparent", border: "none", borderRadius: "8px", fontSize: "13px",
                    color: "var(--coral)", cursor: "pointer", textAlign: "left"
                  }}
                >
                  <LogOut size={15} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialTab={profileModalTab}
      />
    </>
  );
}

function MainApp() {
  const { role } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("cc_sidebar_collapsed") === "true";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("cc_sidebar_collapsed", String(next));
      return next;
    });
  };

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setEvents(await relayApi.getEvents());
    } catch (err) {
      setError(err.message || "Unable to load events.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Periodic background refresh (30s) when tab is visible for fresh registration/capacity metrics
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadEvents();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  const shared = { events, isLoading, error, onRefresh: loadEvents };
  return (
    <div className={`relay-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="relay-main">
        <TopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <Routes>
          <Route path="/" element={<>
            {role === "SUPER_ADMIN" && <SuperAdminPage {...shared} />}
            {role === "EVENT_ADMIN" && <AdminDashboardPage {...shared} />}
            {role === "PARTICIPANT" && <ParticipantPage {...shared} />}
          </>} />
          <Route path="/events" element={<>
            {role === "SUPER_ADMIN" && <SuperAdminEventsPage {...shared} />}
            {role === "EVENT_ADMIN" && <AdminPage {...shared} />}
            {role === "PARTICIPANT" && <ParticipantEventsPage {...shared} />}
          </>} />
          {(role === "EVENT_ADMIN" || role === "SUPER_ADMIN") && (
            <Route path="/admin/events/:eventId/analytics" element={<EventAnalyticsPage />} />
          )}
          {role === "SUPER_ADMIN" && (
            <Route path="/admin-management" element={<AdminManagementPage />} />
          )}
          {role === "PARTICIPANT" && <Route path="/my-registrations" element={<MyRegistrationsPage />} />}
          <Route path="/event/:eventId" element={<EventDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="relay-root" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="cc-brand-icon" style={{ width: "48px", height: "48px", margin: "0 auto 16px" }}>
            <Search size={22} />
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Restoring CampusConnect session...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          token ? (
            <MainApp />
          ) : (
            <LandingPage />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
