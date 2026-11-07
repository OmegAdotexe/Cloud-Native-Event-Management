import React, { useState, useEffect, useCallback } from "react";
import * as relayApi from "../api/relayApi.js";
import {
  Users, UserCheck, Clock, XCircle, AlertCircle, Search,
  CheckCircle2, RotateCcw, ShieldCheck, ChevronRight, Eye,
  Slash, Ban, Calendar, Building, Phone, Mail, FileText, ArrowRight, X
} from "lucide-react";

export default function AdminManagementPage() {
  const [activeTab, setActiveTab] = useState("PENDING"); // PENDING | APPROVED | ALL
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0, revoked: 0 });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [selectedApp, setSelectedApp] = useState(null);
  const [audits, setAudits] = useState([]);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectAppId, setRejectAppId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeAppId, setRevokeAppId] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await relayApi.getAdminApplicationStats();
      setStats(data);
    } catch (e) {
      console.warn("Failed to load application stats", e);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const statusFilter = activeTab === "ALL" ? null : activeTab === "PENDING" ? "PENDING_APPROVAL" : "APPROVED";
      const res = await relayApi.getAdminApplications(statusFilter, search, page, 10);
      setApplications(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to load admin applications.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => {
    loadStats();
    loadApplications();
  }, [loadStats, loadApplications]);

  const handleApprove = async (id) => {
    setActionLoading(true);
    setError("");
    try {
      await relayApi.approveAdminApplication(id);
      setSuccessMsg("Event Admin application successfully approved! Privileges have been granted.");
      setTimeout(() => setSuccessMsg(""), 4000);
      if (selectedApp?.id === id) {
        setSelectedApp(null);
      }
      loadStats();
      loadApplications();
    } catch (err) {
      setError(err.message || "Failed to approve application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (id) => {
    setRejectAppId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for declining the application.");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      await relayApi.rejectAdminApplication(rejectAppId, rejectReason.trim());
      setSuccessMsg("Application has been declined and applicant notified with the reason.");
      setTimeout(() => setSuccessMsg(""), 4000);
      setRejectModalOpen(false);
      if (selectedApp?.id === rejectAppId) {
        setSelectedApp(null);
      }
      loadStats();
      loadApplications();
    } catch (err) {
      setError(err.message || "Failed to reject application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRevoke = (id) => {
    setRevokeAppId(id);
    setRevokeReason("");
    setRevokeModalOpen(true);
  };

  const handleConfirmRevoke = async () => {
    setActionLoading(true);
    setError("");
    try {
      await relayApi.revokeAdminPrivileges(revokeAppId, revokeReason.trim() || "Revoked by Super Admin");
      setSuccessMsg("Event Admin privileges have been revoked.");
      setTimeout(() => setSuccessMsg(""), 4000);
      setRevokeModalOpen(false);
      if (selectedApp?.id === revokeAppId) {
        setSelectedApp(null);
      }
      loadStats();
      loadApplications();
    } catch (err) {
      setError(err.message || "Failed to revoke privileges.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetails = async (app) => {
    setSelectedApp(app);
    try {
      const auditList = await relayApi.getAdminApplicationAudits(app.id);
      setAudits(auditList || []);
    } catch (e) {
      setAudits([]);
    }
  };

  return (
    <div>
      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <div className="relay-topbar">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Admin Management & Approvals</span>
            {stats.pending > 0 && (
              <span style={{ fontSize: "11.5px", background: "var(--amber-light)", color: "var(--amber)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                {stats.pending} Pending Review{stats.pending > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p>Review event organizer signups, grant or revoke Event Admin privileges, and inspect organizational verification audit trails.</p>
        </div>
      </div>

      <div className="relay-body">
        {error && <div className="relay-error" style={{ marginBottom: "16px" }}>{error}</div>}
        {successMsg && (
          <div className="relay-card" style={{ marginBottom: "16px", background: "var(--teal-light)", border: "1px solid var(--teal)", color: "var(--teal)", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {/* ── Summary KPI Cards ─────────────────────────────────────────── */}
        <div className="relay-stat-grid" style={{ marginBottom: "28px" }}>
          <div className="relay-stat-card" style={{ cursor: "pointer" }} onClick={() => { setActiveTab("ALL"); setPage(0); }}>
            <div className="relay-stat-icon purple"><Users size={20} /></div>
            <div>
              <div className="relay-stat-num">{stats.total}</div>
              <div className="relay-stat-label">Total Applications</div>
            </div>
          </div>

          <div className="relay-stat-card" style={{ cursor: "pointer", border: activeTab === "PENDING" ? "2px solid var(--amber)" : undefined }} onClick={() => { setActiveTab("PENDING"); setPage(0); }}>
            <div className="relay-stat-icon amber"><Clock size={20} /></div>
            <div>
              <div className="relay-stat-num">{stats.pending}</div>
              <div className="relay-stat-label">Pending Reviews</div>
            </div>
          </div>

          <div className="relay-stat-card" style={{ cursor: "pointer", border: activeTab === "APPROVED" ? "2px solid var(--teal)" : undefined }} onClick={() => { setActiveTab("APPROVED"); setPage(0); }}>
            <div className="relay-stat-icon teal"><ShieldCheck size={20} /></div>
            <div>
              <div className="relay-stat-num">{stats.approved}</div>
              <div className="relay-stat-label">Approved Event Admins</div>
            </div>
          </div>

          <div className="relay-stat-card">
            <div className="relay-stat-icon blue"><XCircle size={20} /></div>
            <div>
              <div className="relay-stat-num">{stats.rejected + stats.revoked}</div>
              <div className="relay-stat-label">Declined / Revoked</div>
            </div>
          </div>
        </div>

        {/* ── Main Tabbed Card ─────────────────────────────────────────── */}
        <div className="relay-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "6px", background: "var(--bg)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <button
                type="button"
                className={`relay-btn-ghost ${activeTab === "PENDING" ? "active" : ""}`}
                onClick={() => { setActiveTab("PENDING"); setPage(0); }}
                style={{
                  padding: "7px 14px", fontSize: "13px", fontWeight: 600,
                  background: activeTab === "PENDING" ? "var(--surface)" : "transparent",
                  color: activeTab === "PENDING" ? "var(--primary)" : "var(--mute)",
                  boxShadow: activeTab === "PENDING" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Pending Approvals ({stats.pending})
              </button>

              <button
                type="button"
                className={`relay-btn-ghost ${activeTab === "APPROVED" ? "active" : ""}`}
                onClick={() => { setActiveTab("APPROVED"); setPage(0); }}
                style={{
                  padding: "7px 14px", fontSize: "13px", fontWeight: 600,
                  background: activeTab === "APPROVED" ? "var(--surface)" : "transparent",
                  color: activeTab === "APPROVED" ? "var(--primary)" : "var(--mute)",
                  boxShadow: activeTab === "APPROVED" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Approved Admins ({stats.approved})
              </button>

              <button
                type="button"
                className={`relay-btn-ghost ${activeTab === "ALL" ? "active" : ""}`}
                onClick={() => { setActiveTab("ALL"); setPage(0); }}
                style={{
                  padding: "7px 14px", fontSize: "13px", fontWeight: 600,
                  background: activeTab === "ALL" ? "var(--surface)" : "transparent",
                  color: activeTab === "ALL" ? "var(--primary)" : "var(--mute)",
                  boxShadow: activeTab === "ALL" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}
              >
                All Applications ({stats.total})
              </button>
            </div>

            {/* Search */}
            <div style={{ position: "relative", minWidth: "260px" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "11px", color: "var(--mute)" }} />
              <input
                type="text"
                placeholder="Search by name, email, department..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: "9px", border: "1px solid var(--border)", fontSize: "13px", background: "var(--bg)", outline: "none" }}
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="relay-empty" style={{ padding: "40px 0" }}>Loading admin applications...</div>
          ) : applications.length === 0 ? (
            <div className="relay-empty" style={{ padding: "40px 0" }}>
              {activeTab === "PENDING"
                ? "No pending Event Admin applications at this time."
                : "No applications found matching current criteria."}
            </div>
          ) : (
            <div className="relay-table-wrap">
              <table className="relay-table">
                <thead>
                  <tr>
                    <th>Applicant Details</th>
                    <th>Department / Club</th>
                    <th>Contact</th>
                    <th>Role in Org</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "13.5px" }}>
                          {app.fullName}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--mute)" }}>
                          {app.email}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
                          {app.department}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                          {app.phoneNumber}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", background: "var(--border-light)", color: "var(--text-secondary)", padding: "2px 8px", borderRadius: "6px" }}>
                          {app.organizationRole || "Coordinator"}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: "12px", color: "var(--text)" }}>
                          {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div style={{ fontSize: "10.5px", color: "var(--mute)" }}>
                          {new Date(app.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      <td>
                        <span className={`relay-pill ${
                          app.status === "APPROVED" ? "green" :
                          app.status === "PENDING_APPROVAL" ? "amber" :
                          app.status === "REJECTED" ? "coral" : "blue"
                        }`} style={{ fontSize: "11px", padding: "3px 8px" }}>
                          {app.status === "PENDING_APPROVAL" ? "Pending" : app.status}
                        </span>
                        {app.status === "APPROVED" && app.managedEventsCount > 0 && (
                          <div style={{ fontSize: "11px", color: "var(--mute)", marginTop: "2px" }}>
                            {app.managedEventsCount} event{app.managedEventsCount > 1 ? "s" : ""}
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            type="button"
                            className="relay-btn-ghost relay-btn-sm"
                            onClick={() => handleOpenDetails(app)}
                            title="View Application Details"
                            style={{ fontSize: "11.5px", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <Eye size={13} /> View
                          </button>

                          {app.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                type="button"
                                className="relay-btn relay-btn-sm"
                                style={{ background: "var(--teal)", color: "#fff", fontSize: "11.5px", padding: "4px 10px" }}
                                onClick={() => handleApprove(app.id)}
                                disabled={actionLoading}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="relay-btn-danger relay-btn-sm"
                                style={{ fontSize: "11.5px", padding: "4px 8px" }}
                                onClick={() => handleOpenReject(app.id)}
                                disabled={actionLoading}
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {app.status === "APPROVED" && (
                            <button
                              type="button"
                              className="relay-btn-ghost relay-btn-sm"
                              style={{ color: "var(--coral)", fontSize: "11.5px", padding: "4px 8px" }}
                              onClick={() => handleOpenRevoke(app.id)}
                              title="Revoke Event Admin Privileges"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
              <button
                type="button"
                className="relay-btn-ghost relay-btn-sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <span style={{ fontSize: "12px", alignSelf: "center", color: "var(--mute)" }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                className="relay-btn-ghost relay-btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Applicant Details Modal ────────────────────────────────────── */}
      {selectedApp && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(10, 8, 22, 0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px"
        }}>
          <div className="relay-card" style={{ maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button
              type="button"
              onClick={() => setSelectedApp(null)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", cursor: "pointer", color: "var(--mute)" }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>
                  Event Admin Application #{selectedApp.id}
                </h3>
                <span className={`relay-pill ${
                  selectedApp.status === "APPROVED" ? "green" :
                  selectedApp.status === "PENDING_APPROVAL" ? "amber" : "coral"
                }`} style={{ fontSize: "10.5px", padding: "1px 6px" }}>
                  {selectedApp.status}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", background: "var(--bg)", padding: "14px", borderRadius: "10px", fontSize: "12.5px" }}>
              <div>
                <div style={{ color: "var(--mute)", marginBottom: "2px" }}>Full Name</div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{selectedApp.fullName}</div>
              </div>
              <div>
                <div style={{ color: "var(--mute)", marginBottom: "2px" }}>Verified Email</div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{selectedApp.email}</div>
              </div>
              <div>
                <div style={{ color: "var(--mute)", marginBottom: "2px" }}>Department / Society</div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{selectedApp.department}</div>
              </div>
              <div>
                <div style={{ color: "var(--mute)", marginBottom: "2px" }}>Phone Number</div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{selectedApp.phoneNumber}</div>
              </div>
              <div>
                <div style={{ color: "var(--mute)", marginBottom: "2px" }}>Organization Role</div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{selectedApp.organizationRole || "Not specified"}</div>
              </div>
              <div>
                <div style={{ color: "var(--mute)", marginBottom: "2px" }}>Submitted Date</div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>{new Date(selectedApp.createdAt).toLocaleString()}</div>
              </div>
            </div>

            {selectedApp.statement && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
                  Statement of Purpose & Event Hosting Scope
                </div>
                <div style={{ padding: "12px", background: "var(--bg)", borderRadius: "8px", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {selectedApp.statement}
                </div>
              </div>
            )}

            {selectedApp.rejectionReason && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", background: "var(--coral-light)", borderRadius: "8px", border: "1px solid var(--coral)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--coral)" }}>Decision Notes / Reason:</div>
                <div style={{ fontSize: "12px", color: "var(--coral)", marginTop: "2px" }}>{selectedApp.rejectionReason}</div>
              </div>
            )}

            {/* Audit History */}
            {audits.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
                  Decision Audit Trail
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {audits.map((a) => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "var(--bg)", borderRadius: "6px", fontSize: "11.5px" }}>
                      <span style={{ fontWeight: 600, color: "var(--primary)" }}>[{a.action}]</span>
                      <span style={{ color: "var(--text-secondary)", flex: 1, margin: "0 10px" }}>{a.notes || "Action performed"}</span>
                      <span style={{ color: "var(--mute)" }}>{new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
              <button
                type="button"
                className="relay-btn-ghost"
                onClick={() => setSelectedApp(null)}
              >
                Close
              </button>

              {selectedApp.status === "PENDING_APPROVAL" && (
                <>
                  <button
                    type="button"
                    className="relay-btn-danger"
                    onClick={() => handleOpenReject(selectedApp.id)}
                  >
                    Decline Application
                  </button>
                  <button
                    type="button"
                    className="cc-btn-primary"
                    onClick={() => handleApprove(selectedApp.id)}
                  >
                    Approve Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Decline / Reject Reason Modal ─────────────────────────────── */}
      {rejectModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(10, 8, 22, 0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, padding: "20px"
        }}>
          <div className="relay-card" style={{ maxWidth: "460px", width: "100%" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              Decline Event Admin Application
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--mute)", margin: "0 0 14px" }}>
              Please provide a clear justification. The applicant will receive an in-app notification explaining why their request was not approved.
            </p>

            <textarea
              rows={4}
              placeholder="e.g., Incomplete organizational credentials, duplicate club lead, or department verification pending..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "var(--bg)", marginBottom: "16px" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="relay-btn-ghost"
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="relay-btn-danger"
                onClick={handleConfirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? "Declining..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Privileges Confirmation Modal ───────────────────────── */}
      {revokeModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(10, 8, 22, 0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, padding: "20px"
        }}>
          <div className="relay-card" style={{ maxWidth: "460px", width: "100%" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "16px", fontWeight: 700, color: "var(--coral)" }}>
              Revoke Event Admin Privileges
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 14px" }}>
              Are you sure? This user will be demoted to standard <strong>Participant</strong> and will immediately lose ability to publish or edit campus events.
            </p>

            <input
              type="text"
              placeholder="Revocation reason (optional)"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "var(--bg)", marginBottom: "16px" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="relay-btn-ghost"
                onClick={() => setRevokeModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="relay-btn-danger"
                onClick={handleConfirmRevoke}
                disabled={actionLoading}
              >
                {actionLoading ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
