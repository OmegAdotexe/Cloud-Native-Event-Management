import React, { useState, useEffect } from "react";
import {
  CalendarClock, MapPin, Calendar, Users, Clock, ChevronRight,
  Code2, Music, Trophy, BookOpen, Star, Search, Filter,
  LayoutGrid, List, Sparkles, AlertCircle, X, CheckCircle2
} from "lucide-react";
import * as relayApi from "../api/relayApi.js";
import { useNavigate } from "react-router-dom";
import EventCard from "../components/EventCard.jsx";

const CATEGORIES = [
  { id: "ALL", label: "All Categories", icon: Sparkles },
  { id: "WORKSHOP", label: "Technical & Workshops", icon: Code2 },
  { id: "CULTURAL", label: "Cultural & Arts", icon: Music },
  { id: "SPORTS", label: "Sports & Athletics", icon: Trophy },
  { id: "SEMINAR", label: "Keynotes & Seminars", icon: BookOpen },
  { id: "OTHER", label: "Other Competitions", icon: Star },
];

export default function ParticipantEventsPage({ events = [], isLoading, error }) {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("UPCOMING"); // "ALL", "UPCOMING", "ONGOING", "PAST"
  const [sortBy, setSortBy] = useState("DATE_ASC"); // "DATE_ASC", "DATE_DESC", "CAPACITY_DESC", "TITLE_ASC"
  const [viewMode, setViewMode] = useState("GRID"); // "GRID" or "LIST"
  const [toastMessage, setToastMessage] = useState(null);

  const fetchRegistrations = async () => {
    try {
      const data = await relayApi.getMyRegistrations();
      setRegistrations(data || []);
    } catch (err) {
      console.error("Failed to load registrations:", err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleRegister = async (eventId) => {
    setActionLoading(true);
    try {
      await relayApi.registerForEvent(eventId);
      await fetchRegistrations();
      setToastMessage({ type: "success", text: "Successfully registered! Pass generated." });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      setToastMessage({ type: "error", text: err.message || "Failed to register for this event." });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter events by Search, Category, and Timeframe
  const now = new Date();
  const filteredEvents = events.filter((event) => {
    // 1. Category Filter
    if (selectedCategory !== "ALL" && event.category !== selectedCategory) {
      return false;
    }

    // 2. Search Query (Title, Venue, Description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (event.title || "").toLowerCase().includes(q);
      const matchVenue = (event.venueName || "").toLowerCase().includes(q);
      const matchDesc = (event.description || "").toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchDesc) return false;
    }

    // 3. Time Filter
    const start = event.startTime ? new Date(event.startTime) : null;
    const end = event.endTime ? new Date(event.endTime) : start;

    if (timeFilter === "UPCOMING" && start && start < now && end && end < now) {
      return false;
    }
    if (timeFilter === "ONGOING") {
      if (!start || !end || now < start || now > end) return false;
    }
    if (timeFilter === "PAST") {
      if (!end || end >= now) return false;
    }

    return true;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === "DATE_ASC") {
      return new Date(a.startTime || 0) - new Date(b.startTime || 0);
    }
    if (sortBy === "DATE_DESC") {
      return new Date(b.startTime || 0) - new Date(a.startTime || 0);
    }
    if (sortBy === "CAPACITY_DESC") {
      return (b.capacity || 0) - (a.capacity || 0);
    }
    if (sortBy === "TITLE_ASC") {
      return (a.title || "").localeCompare(b.title || "");
    }
    return 0;
  });

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="relay-topbar" style={{ paddingBottom: "16px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Explore Campus Events</span>
            <span style={{ fontSize: "12px", background: "var(--primary-light)", color: "var(--primary)", padding: "2px 10px", borderRadius: "12px", fontWeight: 600 }}>
              {sortedEvents.length} {sortedEvents.length === 1 ? "Event" : "Events"}
            </span>
          </h1>
          <p>Discover tech hackathons, cultural festivals, athletic matches, and academic symposiums.</p>
        </div>
      </div>

      <div className="relay-body" style={{ paddingTop: "0" }}>
        {/* Toast Alert */}
        {toastMessage && (
          <div style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1000,
            background: toastMessage.type === "success" ? "var(--teal)" : "var(--coral)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: 500,
          }}>
            {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* ── Search, Filters, View Controls Bar ──────────────────── */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "18px 20px",
          marginBottom: "24px",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {/* Row 1: Search & Controls */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div className="relay-search" style={{ flex: "1 1 320px", background: "var(--bg)", border: "1px solid var(--border)" }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search events by title, venue, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--mute)", display: "flex" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Timeframe Filter Tabs */}
              <div style={{ display: "flex", background: "var(--bg)", padding: "3px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                {[
                  { id: "UPCOMING", label: "Upcoming" },
                  { id: "ONGOING", label: "Ongoing" },
                  { id: "PAST", label: "Past" },
                  { id: "ALL", label: "All" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeFilter(t.id)}
                    style={{
                      background: timeFilter === t.id ? "var(--surface)" : "transparent",
                      color: timeFilter === t.id ? "var(--primary)" : "var(--text-secondary)",
                      fontWeight: timeFilter === t.id ? 600 : 500,
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "7px",
                      fontSize: "12px",
                      cursor: "pointer",
                      boxShadow: timeFilter === t.id ? "var(--shadow-sm)" : "none",
                      transition: "all .15s ease",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="relay-input"
                style={{ width: "auto", fontSize: "12px", padding: "6px 12px", borderRadius: "9px" }}
              >
                <option value="DATE_ASC">Soonest First</option>
                <option value="DATE_DESC">Latest First</option>
                <option value="CAPACITY_DESC">Largest Capacity</option>
                <option value="TITLE_ASC">Alphabetical (A-Z)</option>
              </select>

              {/* View Toggle */}
              <div style={{ display: "flex", background: "var(--bg)", padding: "3px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  style={{
                    background: viewMode === "GRID" ? "var(--surface)" : "transparent",
                    color: viewMode === "GRID" ? "var(--primary)" : "var(--mute)",
                    border: "none",
                    padding: "6px 8px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("LIST")}
                  style={{
                    background: viewMode === "LIST" ? "var(--surface)" : "transparent",
                    color: viewMode === "LIST" ? "var(--primary)" : "var(--mute)",
                    border: "none",
                    padding: "6px 8px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="List View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Category Filter Pills */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }} className="relay-scroll">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: isSelected ? 600 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: isSelected ? "var(--primary)" : "var(--bg)",
                    color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                    border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                    transition: "all .2s ease",
                  }}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Events Results Grid / List ─────────────────────────── */}
        {isLoading ? (
          <div className="relay-empty" style={{ padding: "60px 0" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
              Loading campus events...
            </div>
            <p style={{ color: "var(--mute)", fontSize: "13px" }}>Fetching latest schedules and registration statuses.</p>
          </div>
        ) : error ? (
          <div className="relay-card" style={{ borderColor: "var(--coral)", background: "var(--coral-light)", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--coral)", fontWeight: 600 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="relay-card" style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <Search size={26} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
              No matching events found
            </h3>
            <p style={{ color: "var(--mute)", fontSize: "13px", maxWidth: "380px", margin: "0 auto 18px" }}>
              Try adjusting your category selection, changing your search terms, or switching timeframe filters.
            </p>
            <button
              type="button"
              className="relay-btn-secondary relay-btn-sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setTimeFilter("ALL");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "GRID" ? (
          <div className="cc-events-grid">
            {sortedEvents.map((event) => {
              const reg = registrations.find((r) => String(r.eventId) === String(event.id));
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  registration={reg}
                  variant="rich"
                  onClick={() => navigate(`/event/${event.id}`)}
                  onRegister={handleRegister}
                  actionLoading={actionLoading}
                />
              );
            })}
          </div>
        ) : (
          /* List View Mode */
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sortedEvents.map((event) => {
              const reg = registrations.find((r) => String(r.eventId) === String(event.id));
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  registration={reg}
                  variant="compact"
                  onClick={() => navigate(`/event/${event.id}`)}
                  onRegister={handleRegister}
                  actionLoading={actionLoading}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
