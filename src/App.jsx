import React, { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import * as relayApi from "./api/relayApi.js";
import Sidebar from "./components/Sidebar.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ParticipantPage from "./pages/ParticipantPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

function ProtectedRoute({ children }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="relay-root" style={{ height: "720px", display: "grid", placeItems: "center" }}>Restoring session...</div>;
  return token ? children : <Navigate to="/login" replace />;
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
  return <div className="relay-root relay-scroll" style={{ height: "720px" }}>
    <Sidebar />
    <div className="relay-main">
      {role === "EVENT_ADMIN" && <AdminPage {...shared} />}
      {role === "PARTICIPANT" && <ParticipantPage {...shared} />}
      {role === "SUPER_ADMIN" && <AdminPage {...shared} />}
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
