import React, { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import * as relayApi from "./api/relayApi.js";
import { Search, Bell, ChevronDown } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ParticipantPage from "./pages/ParticipantPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import MyRegistrationsPage from "./pages/MyRegistrationsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import SuperAdminPage from "./pages/SuperAdminPage.jsx";
import ParticipantEventsPage from "./pages/ParticipantEventsPage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import EventAnalyticsPage from "./pages/EventAnalyticsPage.jsx";

function ProtectedRoute({ children }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="relay-root" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>Restoring session...</div>;
  return token ? children : <Navigate to="/login" replace />;
}

function TopHeader() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      relayApi.getUnreadNotificationCount()
        .then(res => setUnreadCount(res.count))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const ROLE_LABELS = {
    SUPER_ADMIN: "Super Admin",
    EVENT_ADMIN: "Event Admin",
    PARTICIPANT: "Participant",
  };

  return (
    <div className="relay-header">
      <div className="relay-search">
        <Search size={16} />
        <input type="text" placeholder="Search events, people, or anything..." />
      </div>
      <div className="relay-header-actions">
        <div className="relay-header-bell" onClick={() => navigate("/notifications")}>
          <Bell size={19} />
          {unreadCount > 0 && <div className="relay-header-badge" />}
        </div>
        <div className="relay-header-user">
          <div className="relay-header-avatar">{initials}</div>
          <div>
            <div className="relay-header-name">{user?.name || "User"}</div>
            <div className="relay-header-role">{ROLE_LABELS[role] || "Participant"}</div>
          </div>
          <ChevronDown size={14} style={{ color: "var(--mute)" }} />
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { role } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  const shared = { events, isLoading, error, onRefresh: loadEvents };
  return <div className="relay-root">
    <Sidebar />
    <div className="relay-main">
      <TopHeader />
      <Routes>
        <Route path="/" element={<>
          {(role === "EVENT_ADMIN" || role === "SUPER_ADMIN") && <SuperAdminPage {...shared} />}
          {role === "PARTICIPANT" && <ParticipantPage {...shared} />}
        </>} />
        <Route path="/events" element={<>
          {(role === "EVENT_ADMIN" || role === "SUPER_ADMIN") && <AdminPage {...shared} />}
          {role === "PARTICIPANT" && <ParticipantEventsPage {...shared} />}
        </>} />
        {(role === "EVENT_ADMIN" || role === "SUPER_ADMIN") && (
          <Route path="/admin/events/:eventId/analytics" element={<EventAnalyticsPage />} />
        )}
        {role === "PARTICIPANT" && <Route path="/my-registrations" element={<MyRegistrationsPage />} />}
        <Route path="/event/:eventId" element={<EventDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </div>
  </div>;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/*" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
  </Routes>;
}
