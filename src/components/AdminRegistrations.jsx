import React, { useState, useEffect } from "react";
import * as relayApi from "../api/relayApi.js";
import TicketModal from "./TicketModal.jsx";
import TicketVerifierModal from "./TicketVerifierModal.jsx";
import { QrCode, Search, ShieldCheck } from "lucide-react";

export default function AdminRegistrations({ event }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [inviteIds, setInviteIds] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketModalReg, setTicketModalReg] = useState(null);
  const [showVerifierModal, setShowVerifierModal] = useState(false);

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

  function getStatusColor(status) {
    switch (status) {
      case 'CONFIRMED': return "#1A8A6A";
      case 'WAITLISTED': return "#C77E1F";
      case 'PENDING': return "#7C5CFC";
      default: return "#C44035";
    }
  }

  return (
    <div style={{ marginTop: "24px" }}>
      <div className="relay-feed-title">Registrations Management</div>
      
      {event.registrationMode === 'INVITE_ONLY' && (
        <form onSubmit={handleInvite} style={{ marginBottom: "16px", padding: "14px", background: "var(--bg)", borderRadius: "10px", border: "1px solid var(--border)" }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--mute)" }} />
            <input 
              type="text" 
              className="relay-input" 
              style={{ width: "220px", paddingLeft: "32px" }}
              placeholder="Filter by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="relay-input" 
            style={{ width: "170px" }}
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
          <button 
            className="relay-btn-ghost relay-btn-sm" 
            disabled={actionLoading}
            onClick={async () => {
              setActionLoading(true);
              try {
                await relayApi.exportRegistrationsCsv(event.id);
              } catch(e) {
                alert("Failed to export CSV");
              } finally {
                setActionLoading(false);
              }
            }}
          >
            Download CSV
          </button>
          <button
            className="relay-btn relay-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "var(--teal)" }}
            onClick={() => setShowVerifierModal(true)}
            title="Scan or enter ticket code to verify attendee entry"
          >
            <ShieldCheck size={14} />
            Verify Pass
          </button>
        </div>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
          <button className="relay-btn-ghost relay-btn-sm" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
          <button className="relay-btn-ghost relay-btn-sm" disabled={page >= totalPages - 1 || loading} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>

      {loading ? (
        <div className="relay-empty">Loading registrations...</div>
      ) : error ? (
        <div className="relay-empty" style={{ color: "var(--coral)" }}>{error}</div>
      ) : registrations.length === 0 ? (
        <div className="relay-empty">No registrations found.</div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "var(--surface)" }}>
          {registrations
            .filter((reg) => {
              if (!searchTerm.trim()) return true;
              const term = searchTerm.toLowerCase();
              return (
                reg.participantName?.toLowerCase().includes(term) ||
                String(reg.participantId).includes(term) ||
                String(reg.id).includes(term)
              );
            })
            .map((reg, index) => (
            <div key={reg.id} style={{ 
              padding: "14px 16px", 
              borderTop: index > 0 ? "1px solid var(--border-light)" : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "background 0.15s",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{reg.participantName} <span style={{ color: "var(--mute)", fontWeight: 400, fontSize: "12px" }}>#{reg.participantId}</span></div>
                <div style={{ fontSize: "12px", color: "var(--mute)", marginTop: "4px" }}>
                  Status: <span style={{ 
                    fontWeight: 600,
                    color: getStatusColor(reg.status),
                  }}>{reg.status}</span>
                  <span style={{ marginLeft: "12px" }}>Registered: {new Date(reg.registeredAt).toLocaleString()}</span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  className="relay-btn-ghost relay-btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px" }}
                  onClick={() => setTicketModalReg(reg)}
                  title="View digital pass & QR code"
                >
                  <QrCode size={14} />
                  Pass
                </button>

                {event.registrationMode === 'APPROVAL_REQUIRED' && reg.status === 'PENDING' && (
                  <>
                    <button 
                      className="relay-btn relay-btn-sm" 
                      disabled={actionLoading}
                      onClick={() => handleApprove(reg.id)}
                      style={{ background: "var(--teal)" }}
                    >Approve</button>
                    <button 
                      className="relay-btn-danger relay-btn-sm" 
                      disabled={actionLoading}
                      onClick={() => handleReject(reg.id)}
                    >Reject</button>
                  </>
                )}
                
                {(reg.status === 'CONFIRMED' || reg.status === 'WAITLISTED') && (
                  <button 
                    className="relay-btn relay-btn-sm" 
                    disabled={actionLoading}
                    onClick={() => handleCancel(reg.id)}
                    style={{ background: "var(--amber)" }}
                  >Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {ticketModalReg && (
        <TicketModal 
          registration={ticketModalReg} 
          onClose={() => setTicketModalReg(null)} 
        />
      )}

      {showVerifierModal && (
        <TicketVerifierModal
          event={event}
          onClose={() => setShowVerifierModal(false)}
        />
      )}
    </div>
  );
}
