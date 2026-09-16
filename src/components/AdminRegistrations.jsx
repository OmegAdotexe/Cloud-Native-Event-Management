import React, { useState, useEffect } from "react";
import * as relayApi from "../api/relayApi.js";

export default function AdminRegistrations({ event }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [inviteIds, setInviteIds] = useState("");

  const fetchRegistrations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await relayApi.getEventRegistrations(event.id, statusFilter || undefined, page, 10);
      setRegistrations(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [event.id, page, statusFilter]);

  const handleAction = async (action, registrationId, reason = null) => {
    setActionLoading(true);
    try {
      if (reason !== null) {
        await action(event.id, registrationId, reason);
      } else {
        await action(event.id, registrationId);
      }
      await fetchRegistrations();
    } catch (err) {
      alert(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (id) => handleAction(relayApi.approveRegistration, id);
  const handleReject = (id) => {
    const reason = window.prompt("Reason for rejection (optional, max 500 chars):");
    if (reason !== null) {
      handleAction(relayApi.rejectRegistration, id, reason);
    }
  };

  const handleCancel = (id) => {
    const reason = window.prompt("Reason for cancellation (optional, max 500 chars):");
    if (reason !== null) {
      handleAction(relayApi.cancelRegistration, id, reason);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const ids = inviteIds.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (ids.length === 0) return;
    setActionLoading(true);
    try {
      await relayApi.inviteParticipants(event.id, ids);
      setInviteIds("");
      alert("Participants invited successfully!");
      if (statusFilter === "" || statusFilter === "PENDING") {
        await fetchRegistrations();
      }
    } catch (err) {
      alert(err.message || "Failed to send invites.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "24px" }}>
      <div className="relay-feed-title">Registrations Management</div>
      
      {event.registrationMode === 'INVITE_ONLY' && (
        <form onSubmit={handleInvite} style={{ marginBottom: "16px", padding: "12px", background: "var(--surface)", borderRadius: "8px" }}>
          <label className="relay-field-label">Invite Participants (Comma-separated IDs)</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <input 
              className="relay-input" 
              type="text" 
              placeholder="e.g. 101, 102, 105" 
              value={inviteIds}
              onChange={(e) => setInviteIds(e.target.value)}
            />
            <button className="relay-btn" disabled={actionLoading || !inviteIds} type="submit">Invite</button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <select 
          className="relay-input" 
          style={{ width: "200px" }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="WAITLISTED">WAITLISTED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px" }}>
          <button className="relay-btn" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
          <button className="relay-btn" disabled={page >= totalPages - 1 || loading} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>

      {loading ? (
        <div className="relay-empty">Loading registrations...</div>
      ) : error ? (
        <div className="relay-empty" style={{ color: "#ef4444" }}>{error}</div>
      ) : registrations.length === 0 ? (
        <div className="relay-empty">No registrations found.</div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
          {registrations.map((reg, index) => (
            <div key={reg.id} style={{ 
              padding: "12px", 
              borderTop: index > 0 ? "1px solid var(--border)" : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{reg.participantName} <span style={{ color: "var(--mute)", fontWeight: 400 }}>#{reg.participantId}</span></div>
                <div style={{ fontSize: "12px", color: "var(--mute)", marginTop: "4px" }}>
                  Status: <span style={{ 
                    fontWeight: 600,
                    color: reg.status === 'CONFIRMED' ? "#10b981" : reg.status === 'WAITLISTED' ? "#f59e0b" : reg.status === 'PENDING' ? "#6366f1" : "#ef4444"
                  }}>{reg.status}</span>
                  <br />
                  Registered: {new Date(reg.registeredAt).toLocaleString()}
                </div>
              </div>
              
              {event.registrationMode === 'APPROVAL_REQUIRED' && reg.status === 'PENDING' && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    className="relay-btn" 
                    disabled={actionLoading}
                    onClick={() => handleApprove(reg.id)}
                    style={{ padding: "4px 8px", fontSize: "12px", backgroundColor: "#10b981" }}
                  >Approve</button>
                  <button 
                    className="relay-btn" 
                    disabled={actionLoading}
                    onClick={() => handleReject(reg.id)}
                    style={{ padding: "4px 8px", fontSize: "12px", backgroundColor: "#ef4444" }}
                  >Reject</button>
                </div>
              )}
              
              {(reg.status === 'CONFIRMED' || reg.status === 'WAITLISTED') && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    className="relay-btn" 
                    disabled={actionLoading}
                    onClick={() => handleCancel(reg.id)}
                    style={{ padding: "4px 8px", fontSize: "12px", backgroundColor: "#f59e0b" }}
                  >Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
