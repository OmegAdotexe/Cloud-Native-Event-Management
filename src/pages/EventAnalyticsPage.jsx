import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as relayApi from "../api/relayApi.js";
import { ArrowLeft, Users, Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = {
  CONFIRMED: "#2AAB8A",
  WAITLISTED: "#E8943A",
  PENDING: "#7C5CFC",
  CANCELLED: "#E55A4F",
  REJECTED: "#C44035",
};

export default function EventAnalyticsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const analytics = await relayApi.getEventAnalytics(eventId);
      setData(analytics);
    } catch (err) {
      setError(err.message || "Failed to load event analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="relay-body"><div className="relay-empty" style={{marginTop: 40}}>Loading analytics...</div></div>;
  }

  if (error || !data) {
    return (
      <div className="relay-body">
        <button className="relay-btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <div className="relay-empty" style={{marginTop: 20, color: "var(--coral)"}}>{error || "Analytics not found."}</div>
      </div>
    );
  }

  const statusData = [
    { name: "Confirmed", value: data.confirmedRegistrations, color: COLORS.CONFIRMED },
    { name: "Pending", value: data.pendingCount, color: COLORS.PENDING },
    { name: "Waitlisted", value: data.waitlistCount, color: COLORS.WAITLISTED },
    { name: "Cancelled", value: data.cancelledCount, color: COLORS.CANCELLED },
    { name: "Rejected", value: data.rejectedCount, color: COLORS.REJECTED },
  ].filter(item => item.value > 0);

  const trendData = data.registrationTrend || [];

  return (
    <>
      <div className="relay-body">
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="relay-btn-ghost" onClick={() => navigate(-1)} style={{ padding: "8px" }}>
              <ArrowLeft size={16} />
            </button>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Analytics: {data.title}</h2>
          </div>
          <span style={{ 
            padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: data.status === "PUBLISHED" ? "var(--teal-light)" : "var(--bg)", 
            color: data.status === "PUBLISHED" ? "var(--teal)" : "var(--mute)" 
          }}>
            {data.status}
          </span>
        </div>

        {/* Overview Cards */}
        <div className="relay-stat-grid" style={{ marginBottom: 20 }}>
          <div className="relay-stat-card">
            <div className="relay-stat-icon green"><CheckCircle2 size={20} /></div>
            <div>
              <div className="relay-stat-num">{data.confirmedRegistrations}</div>
              <div className="relay-stat-label">Confirmed Seats</div>
            </div>
          </div>
          <div className="relay-stat-card">
            <div className="relay-stat-icon amber"><Clock size={20} /></div>
            <div>
              <div className="relay-stat-num">{data.waitlistCount}</div>
              <div className="relay-stat-label">Waitlisted</div>
            </div>
          </div>
          <div className="relay-stat-card">
            <div className="relay-stat-icon purple"><Users size={20} /></div>
            <div>
              <div className="relay-stat-num">{data.capacity}</div>
              <div className="relay-stat-label">Total Capacity</div>
            </div>
          </div>
          <div className="relay-stat-card">
            <div className="relay-stat-icon blue"><Calendar size={20} /></div>
            <div>
              <div className="relay-stat-num">{data.capacityUtilization.toFixed(1)}%</div>
              <div className="relay-stat-label">Capacity Filled</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
          
          {/* Status Breakdown Chart */}
          <div className="relay-card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Registration Status Breakdown</h3>
            {statusData.length > 0 ? (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="relay-empty" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No registrations yet.
              </div>
            )}
          </div>

          {/* Registration Trend Chart */}
          <div className="relay-card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Registration Trend</h3>
            {trendData.length > 0 ? (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: "var(--mute)"}} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{fontSize: 12, fill: "var(--mute)"}} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    />
                    <Line type="monotone" dataKey="count" name="New Registrations" stroke="var(--blue)" strokeWidth={3} dot={{r: 4, fill: "var(--blue)"}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="relay-empty" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No trend data available.
              </div>
            )}
          </div>

          {/* Registration Funnel summary text */}
          <div className="relay-card" style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Registration Summary</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 30 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>Total Attempts</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {data.confirmedRegistrations + data.pendingCount + data.waitlistCount + data.rejectedCount + data.cancelledCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>Pending Approval</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--purple)" }}>{data.pendingCount}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>Available Seats</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{data.availableSeats}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>Rejected</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--coral)" }}>{data.rejectedCount}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>Cancelled by User</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--coral)" }}>{data.cancelledCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
