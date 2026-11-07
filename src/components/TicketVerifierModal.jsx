import React, { useState } from "react";
import { X, QrCode, CheckCircle2, AlertCircle, Search, ShieldCheck } from "lucide-react";
import * as relayApi from "../api/relayApi.js";

export default function TicketVerifierModal({ event, onClose }) {
  const [ticketInput, setTicketInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [verifiedAttendees, setVerifiedAttendees] = useState([]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const raw = ticketInput.trim();
    if (!raw) return;

    setLoading(true);
    setResult(null);

    try {
      // Parse ticket format: CC-2026-E{eventId}-R{registrationId} or raw ID or URL
      let regId = null;
      let evtId = null;

      const urlMatch = raw.match(/CC-2026-E(\d+)-R(\d+)/i);
      if (urlMatch) {
        evtId = parseInt(urlMatch[1], 10);
        regId = parseInt(urlMatch[2], 10);
      } else {
        const idMatch = raw.match(/\d+/);
        if (idMatch) {
          regId = parseInt(idMatch[0], 10);
        }
      }

      if (!regId) {
        setResult({
          valid: false,
          error: "Invalid ticket format. Expected format: CC-2026-E{Event}-R{Registration} or numeric ID.",
        });
        setLoading(false);
        return;
      }

      if (evtId && evtId !== event.id) {
        setResult({
          valid: false,
          error: `Ticket is for Event #${evtId}, but this venue is hosting "${event.title}" (#${event.id}).`,
        });
        setLoading(false);
        return;
      }

      // Fetch all registrations to verify
      const data = await relayApi.getEventRegistrations(event.id, undefined, 0, 100);
      const match = (data.content || []).find((r) => r.id === regId);

      if (!match) {
        setResult({
          valid: false,
          error: `Registration #${regId} not found for this event.`,
        });
      } else if (match.status === "CONFIRMED") {
        setResult({
          valid: true,
          attendee: match,
          message: "Ticket is authentic and confirmed for entry!",
        });
        // Add to verified attendees log
        setVerifiedAttendees((prev) => [
          { ...match, verifiedAt: new Date().toLocaleTimeString() },
          ...prev.filter((p) => p.id !== match.id),
        ]);
      } else {
        setResult({
          valid: false,
          attendee: match,
          error: `Admission denied: Attendee status is "${match.status}".`,
        });
      }
    } catch (err) {
      setResult({
        valid: false,
        error: err.message || "Failed to verify registration with server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relay-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        className="relay-ticket-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1A8A6A 0%, #157056 100%)",
            color: "#ffffff",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={24} />
            <div>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.85, fontWeight: 700 }}>
                Venue Gate Control
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                Ticket Admission Verifier
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          <div style={{ fontSize: "13px", color: "var(--mute)", marginBottom: "16px" }}>
            Verify attendee passes for <strong>{event.title}</strong>. Enter the ticket code or scanned QR URL:
          </div>

          <form onSubmit={handleVerify} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <QrCode size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--mute)" }} />
              <input
                type="text"
                className="relay-input"
                style={{ width: "100%", paddingLeft: "36px" }}
                placeholder="e.g. CC-2026-E1-R1 or 1"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                autoFocus
              />
            </div>
            <button
              className="relay-btn"
              type="submit"
              disabled={loading || !ticketInput.trim()}
              style={{ background: "var(--teal)", minWidth: "90px" }}
            >
              {loading ? "Checking..." : "Verify"}
            </button>
          </form>

          {/* Result Box */}
          {result && (
            <div
              style={{
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                border: result.valid ? "1px solid #A3E635" : "1px solid #FCA5A5",
                background: result.valid ? "#F0FDF4" : "#FEF2F2",
                display: "flex",
                gap: "14px",
                alignItems: "flex-start",
              }}
            >
              {result.valid ? (
                <CheckCircle2 size={24} style={{ color: "#16A34A", flexShrink: 0, marginTop: "2px" }} />
              ) : (
                <AlertCircle size={24} style={{ color: "#DC2626", flexShrink: 0, marginTop: "2px" }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: result.valid ? "#15803D" : "#B91C1C" }}>
                  {result.valid ? "VALID TICKET - ENTRY GRANTED" : "VERIFICATION FAILED"}
                </div>
                {result.valid ? (
                  <div style={{ marginTop: "6px", fontSize: "13px", color: "#166534" }}>
                    <div>Attendee: <strong>{result.attendee.participantName}</strong> (ID #{result.attendee.participantId})</div>
                    <div>Registration ID: #{result.attendee.id}</div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#15803D", opacity: 0.9 }}>
                      Registered on: {new Date(result.attendee.registeredAt).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: "6px", fontSize: "13px", color: "#991B1B" }}>
                    {result.error}
                    {result.attendee && (
                      <div style={{ marginTop: "4px", fontSize: "12px" }}>
                        Attendee: {result.attendee.participantName} &bull; Current Status: <strong>{result.attendee.status}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verified Session Log */}
          {verifiedAttendees.length > 0 && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--mute)", marginBottom: "8px" }}>
                Recent Check-ins ({verifiedAttendees.length})
              </div>
              <div style={{ maxHeight: "140px", overflowY: "auto", border: "1px solid var(--border-light)", borderRadius: "8px" }}>
                {verifiedAttendees.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border-light)",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{att.participantName}</span>
                      <span style={{ color: "var(--mute)", marginLeft: "6px" }}>#{att.id}</span>
                    </div>
                    <span style={{ color: "#16A34A", fontWeight: 600 }}>Checked at {att.verifiedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
