import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import { initialEvents } from "./data/mockData.js";
import { nextId, nowStamp, triggerChange } from "./utils/notifications.js";
import Sidebar from "./components/Sidebar.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ParticipantPage from "./pages/ParticipantPage.jsx";
import SuperAdminPage from "./pages/SuperAdminPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

// ---------------------------------------------------------------------------
// Protected Route Wrapper
// ---------------------------------------------------------------------------
function ProtectedRoute({ children }) {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="relay-root relay-scroll" style={{ height: "720px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="relay-meta-item">Restoring session...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ---------------------------------------------------------------------------
// Main Authenticated Layout
// ---------------------------------------------------------------------------
function MainApp() {
  const { role } = useAuth();

  // ── Event state ──────────────────────────────────────────────────────────
  const [events, setEvents]           = useState(initialEvents);
  const [selectedId, setSelectedId]   = useState(initialEvents[0].id);
  const [draftVenue, setDraftVenue]   = useState(initialEvents[0].venue);
  const [draftSchedule, setDraftSchedule] = useState(initialEvents[0].schedule);

  // ── Pipeline state ───────────────────────────────────────────────────────
  const [feed, setFeed]               = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [trace, setTrace]             = useState([]);
  const [running, setRunning]         = useState(false);

  const timeoutsRef = useRef([]);

  // Derived
  const selected = events.find((e) => e.id === selectedId);

  // Sync draft fields when the selected event changes
  useEffect(() => {
    if (selected) {
      setDraftVenue(selected.venue);
      setDraftSchedule(selected.schedule);
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up pending timeouts on unmount
  useEffect(
    () => () => timeoutsRef.current.forEach(clearTimeout),
    []
  );

  // ── Feed helper ──────────────────────────────────────────────────────────
  function pushFeed(text, level = "info") {
    setFeed((f) =>
      [{ id: nextId(), text, level, ts: nowStamp() }, ...f].slice(0, 40)
    );
  }

  // ── Pipeline trigger (delegates to utils/notifications.js) ──────────────
  function handleTriggerChange(field) {
    triggerChange({
      field,
      selected,
      draftVenue,
      draftSchedule,
      running,
      setRunning,
      setTrace,
      setEvents,
      setNotifications,
      pushFeed,
      timeoutsRef,
    });
  }

  return (
    <div className="relay-root relay-scroll" style={{ height: "720px" }}>
      <Sidebar />

      <div className="relay-main">
        {role === "EVENT_ADMIN" && (
          <AdminPage
            events={events}
            selected={selected}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            draftVenue={draftVenue}
            draftSchedule={draftSchedule}
            setDraftVenue={setDraftVenue}
            setDraftSchedule={setDraftSchedule}
            onTriggerChange={handleTriggerChange}
            running={running}
            feed={feed}
            trace={trace}
          />
        )}

        {role === "PARTICIPANT" && (
          <ParticipantPage
            events={events}
            notifications={notifications}
          />
        )}

        {role === "SUPER_ADMIN" && (
          <SuperAdminPage
            events={events}
            notifications={notifications}
            feed={feed}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App Router
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
