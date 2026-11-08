import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as relayApi from "../api/relayApi.js";
import TicketModal from "./TicketModal.jsx";
import TicketVerifierModal from "./TicketVerifierModal.jsx";
import { 
  QrCode, Search, ShieldCheck, Download, Users, CheckCircle2, 
  Clock, XCircle, AlertTriangle, UserCheck, X, Filter, Mail, Building
} from "lucide-react";

export default function AdminRegistrations({ event }) {
  const { user: currentUser } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
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
  
  // Rejection modal state
  const [rejectingReg, setRejectingReg] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const fetchRegistrations = async () => {
    setLoading(true);
    setError("");
    try {
      const [regData, statsData] = await Promise.all([
        relayApi.getEventRegistrations(event.id, statusFilter || undefined, searchTerm || undefined, page, 15),
        relayApi.getEventRegistrationStats(event.id).catch(() => null)
      ]);
      setRegistrations(regData.content || []);
      setTotalPages(regData.totalPages || 1);
      if (statsData) setStats(statsData);
    } catch (err) {
      setError(err.message || "Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [event.id, page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchRegistrations();
  };

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

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      setRejectionError("A rejection explanation is mandatory.");
      return;
    }
    setRejectionError("");
    await handleAction(relayApi.rejectRegistration, rejectingReg.id, rejectionReason.trim());
    setRejectingReg(null);
    setRejectionReason("");
  };

  const handleCancel = (id) => {
    const reason = window.prompt("Reason for administrative cancellation (optional):");
    if (reason !== null) {
      handleAction(relayApi.cancelRegistration, id, reason.trim() || undefined);
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
      alert("Invitations sent successfully!");
      await fetchRegistrations();
    } catch (err) {
      alert(err.message || "Failed to send invites.");
    } finally {
      setActionLoading(false);
    }
  };

  function getStatusStyle(status) {
    switch (status) {
      case 'CONFIRMED': return { bg: "var(--teal-light)", color: "var(--teal)" };
      case 'WAITLISTED': return { bg: "var(--amber-light)", color: "var(--amber)" };
      case 'PENDING': return { bg: "var(--primary-light)", color: "var(--primary)" };
      case 'CANCELLED': return { bg: "var(--coral-light)", color: "var(--coral)" };
      case 'REJECTED': return { bg: "var(--coral-light)", color: "var(--coral)" };
      default: return { bg: "var(--bg)", color: "var(--mute)" };
    }
  }

  return (
    <div style={{ marginTop: "24px" }}>
      
      {/* KPI Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <div className="relay-stat-card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--mute)", textTransform: "uppercase", fontWeight: 700 }}>Total Applicants</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginTop: "4px" }}>{stats.total}</div>
          </div>
          <div className="relay-stat-card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--teal)", textTransform: "uppercase", fontWeight: 700 }}>Confirmed</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--teal)", marginTop: "4px" }}>{stats.confirmed} <span style={{ fontSize: "12px", color: "var(--mute)", fontWeight: 500 }}>/ {stats.capacity}</span></div>
          </div>
          <div className="relay-stat-card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--primary)", textTransform: "uppercase", fontWeight: 700 }}>Pending Review</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>{stats.pending}</div>
          </div>
          <div className="relay-stat-card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--coral)", textTransform: "uppercase", fontWeight: 700 }}>Declined</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--coral)", marginTop: "4px" }}>{stats.rejected}</div>
          </div>
          <div className="relay-stat-card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>Remaining Slots</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: stats.remainingCapacity === 0 ? "var(--coral)" : "var(--text)", marginTop: "4px" }}>{stats.remainingCapacity}</div>
          </div>
        </div>
      )}

      {/* Invite form for INVITE_ONLY */}
      {event.registrationMode === 'INVITE_ONLY' && (
        <form onSubmit={handleInvite} style={{ marginBottom: "16px", padding: "16px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Exclusive Invite Roster</div>
          <p style={{ fontSize: "12px", color: "var(--mute)", marginBottom: "10px" }}>Enter registered student user IDs to authorize private access for this session.</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input 
              className="relay-input" 
              type="text" 
              placeholder="e.g. 101, 102, 105" 
              value={inviteIds}
              onChange={(e) => setInviteIds(e.target.value)}
              style={{ fontSize: "12.5px" }}
            />
            <button className="relay-btn" disabled={actionLoading || !inviteIds} type="submit" style={{ whiteSpace: "nowrap" }}>
              Send Invites
            </button>
          </div>
        </form>
      )}

      {/* Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", minWidth: "200px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--mute)" }} />
            <input 
              type="text" 
              className="relay-input" 
              style={{ paddingLeft: "30px", fontSize: "12.5px" }}
              placeholder="Search participant name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="relay-input" 
            style={{ width: "160px", fontSize: "12.5px" }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="REJECTED">Declined</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button type="submit" className="relay-btn-ghost relay-btn-sm" style={{ padding: "7px 12px" }}>
            Search
          </button>
        </form>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button 
            type="button"
            className="relay-btn-ghost relay-btn-sm" 
            disabled={actionLoading}
            onClick={async () => {
              setActionLoading(true);
              try {
                await relayApi.exportRegistrationsCsv(event.id);
              } catch(e) {
                alert("Failed to export CSV: " + (e.message || ""));
              } finally {
                setActionLoading(false);
              }
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <Download size={13} /> Export CSV
          </button>
          
          <button
            type="button"
            className="relay-btn relay-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "var(--teal)" }}
            onClick={() => setShowVerifierModal(true)}
            title="Scan or enter ticket code to verify attendee entry"
          >
            <ShieldCheck size={14} /> Verify Pass
          </button>
        </div>
      </div>

      {/* Table/List of Registrations */}
      {loading ? (
        <div className="relay-empty" style={{ padding: "40px 0" }}>Loading session participants...</div>
      ) : error ? (
        <div className="relay-empty" style={{ color: "var(--coral)" }}>{error}</div>
      ) : registrations.length === 0 ? (
        <div className="relay-empty" style={{ padding: "40px 0" }}>No registrations match this criteria.</div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "var(--surface)" }}>
          {registrations.map((reg, index) => {
            const st = getStatusStyle(reg.status);
            return (
              <div 
                key={reg.id} 
                style={{ 
                  padding: "16px 18px", 
                  borderTop: index > 0 ? "1px solid var(--border-light)" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{reg.participantName}</span>
                    {reg.participantRole && (
                      <span style={{
                        fontSize: "10.5px",
                        padding: "1px 7px",
                        borderRadius: "10px",
                        fontWeight: 700,
                        background: reg.participantRole === "EVENT_ADMIN" ? "var(--primary-light)" : "var(--border)",
                        color: reg.participantRole === "EVENT_ADMIN" ? "var(--primary)" : "var(--mute)"
                      }}>
                        {reg.participantRole}
                      </span>
                    )}
                    <span style={{ 
                      padding: "2px 8px", 
                      borderRadius: "12px", 
                      fontSize: "11px", 
                      fontWeight: 700,
                      background: st.bg,
                      color: st.color
                    }}>
                      {reg.status}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "var(--mute)" }}>Reg #{reg.id}</span>
                  </div>

                  <div style={{ display: "flex", gap: "14px", marginTop: "4px", fontSize: "12px", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                    {reg.participantEmail && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Mail size={12} style={{ color: "var(--mute)" }} /> {reg.participantEmail}
                      </span>
                    )}
                    {reg.participantDepartment && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Building size={12} style={{ color: "var(--mute)" }} /> {reg.participantDepartment}
                      </span>
                    )}
                    <span>Registered: {new Date(reg.registeredAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {reg.reason && (
                    <div style={{ marginTop: "6px", fontSize: "11.5px", color: "var(--coral)", fontStyle: "italic" }}>
                      Reason: {reg.reason}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="relay-btn-ghost relay-btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                    onClick={() => setTicketModalReg(reg)}
                    title="View pass QR code"
                  >
                    <QrCode size={13} /> Pass
                  </button>

                  {reg.status === 'PENDING' && (
                    <>
                      {(reg.selfRegistration || reg.canApprove === false || (currentUser && reg.participantId === currentUser.id)) ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "var(--coral)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          border: "1px solid rgba(239, 68, 68, 0.25)"
                        }}>
                          ⚠️ Cannot Self-Approve
                        </span>
                      ) : (
                        <>
                          <button 
                            type="button"
                            className="relay-btn relay-btn-sm" 
                            disabled={actionLoading}
                            onClick={() => handleApprove(reg.id)}
                            style={{ background: "var(--teal)" }}
                          >
                            Approve
                          </button>
                          <button 
                            type="button"
                            className="relay-btn-danger relay-btn-sm" 
                            disabled={actionLoading}
                            onClick={() => {
                              setRejectingReg(reg);
                              setRejectionReason("");
                              setRejectionError("");
                            }}
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </>
                  )}
                  
                  {(reg.status === 'CONFIRMED' || reg.status === 'WAITLISTED') && (
                    <button 
                      type="button"
                      className="relay-btn-ghost relay-btn-sm" 
                      style={{ color: "var(--coral)", borderColor: "rgba(229,90,79,0.3)" }}
                      disabled={actionLoading}
                      onClick={() => handleCancel(reg.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "12px", color: "var(--mute)" }}>
        <span>Showing page {page + 1} of {Math.max(1, totalPages)}</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            type="button"
            className="relay-btn-ghost relay-btn-sm" 
            disabled={page === 0 || loading} 
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </button>
          <button 
            type="button"
            className="relay-btn-ghost relay-btn-sm" 
            disabled={page >= totalPages - 1 || loading} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Ticket Pass Modal */}
      {ticketModalReg && (
        <TicketModal 
          registration={ticketModalReg} 
          onClose={() => setTicketModalReg(null)} 
        />
      )}

      {/* Ticket Verifier Modal */}
      {showVerifierModal && (
        <TicketVerifierModal
          event={event}
          onClose={() => setShowVerifierModal(false)}
        />
      )}

      {/* Rejection Modal with Mandatory Reason */}
      {rejectingReg && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,14,23,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px"
        }}>
          <div style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)", width: "100%", maxWidth: "460px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--text)" }}>Decline Registration Request</div>
              <button onClick={() => setRejectingReg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mute)" }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
              You are declining registration request for <strong>{rejectingReg.participantName}</strong>. Please provide a clear explanation so the participant understands why their application was not approved.
            </p>

            {rejectionError && (
              <div style={{ padding: "8px 12px", borderRadius: "8px", background: "var(--coral-light)", color: "var(--coral)", fontSize: "12px", marginBottom: "12px" }}>
                {rejectionError}
              </div>
            )}

            <label className="relay-field-label" style={{ fontSize: "12px" }}>Reason for Rejection *</label>
            <textarea
              className="relay-input"
              rows={3}
              style={{ width: "100%", marginTop: "4px", resize: "vertical", fontSize: "13px" }}
              placeholder="e.g. Session capacity reserved for 4th-year students, or prerequisite criteria not met..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button className="relay-btn-ghost" type="button" onClick={() => setRejectingReg(null)}>Cancel</button>
              <button 
                className="relay-btn-danger" 
                type="button"
                disabled={actionLoading}
                onClick={confirmReject}
              >
                {actionLoading ? "Processing..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
