import React from "react";
import { X, Calendar, MapPin, User, CheckCircle2, Printer, QrCode } from "lucide-react";

export default function TicketModal({ registration, onClose }) {
  if (!registration) return null;

  const ticketNumber = `CC-2026-E${registration.eventId}-R${registration.id}`;
  const qrData = encodeURIComponent(`https://campusconnect.dev/verify/${ticketNumber}`);
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`;

  const handlePrint = (e) => {
    e.stopPropagation();
    window.print();
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
        padding: "16px"
      }}
    >
      <div 
        className="relay-ticket-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1A8A6A 0%, #2AAB8A 100%)",
          color: "#ffffff",
          padding: "24px 24px 20px 24px",
          position: "relative"
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
          <div style={{ fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", opacity: 0.85, fontWeight: 700 }}>
            Official Event Admission Pass
          </div>
          <h2 style={{ margin: "8px 0 4px 0", fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>
            {registration.eventTitle}
          </h2>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>
            CampusConnect &bull; Verified Registration
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--mute)", textTransform: "uppercase", fontWeight: 600 }}>Attendee</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginTop: "2px" }}>
                {registration.participantName || "Participant"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--mute)", textTransform: "uppercase", fontWeight: 600 }}>Status</div>
              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "4px", 
                marginTop: "2px",
                fontSize: "12px", 
                fontWeight: 700, 
                color: "#1A8A6A", 
                background: "#E6F7F2",
                padding: "2px 8px",
                borderRadius: "12px"
              }}>
                <CheckCircle2 size={13} /> {registration.status}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text)" }}>
              <Calendar size={15} style={{ color: "#1A8A6A" }} />
              <span>{new Date(registration.eventStartTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text)" }}>
              <MapPin size={15} style={{ color: "#1A8A6A" }} />
              <span>{registration.eventIsVirtual ? "Virtual Event" : registration.eventVenueName}</span>
            </div>
          </div>

          {/* Ticket Barcode / QR Code Section */}
          <div style={{
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center"
          }}>
            <img 
              src={qrSvgUrl} 
              alt="Admission QR Code" 
              style={{ width: "130px", height: "130px", margin: "0 auto", display: "block", borderRadius: "8px" }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{ display: "none", alignItems: "center", justifyContent: "center", height: "130px", flexDirection: "column", gap: "8px", color: "#64748b" }}>
              <QrCode size={48} />
              <span style={{ fontSize: "12px" }}>QR Preview Active</span>
            </div>
            <div style={{ marginTop: "10px", fontFamily: "monospace", fontSize: "13px", fontWeight: 700, letterSpacing: "1px", color: "#334155" }}>
              {ticketNumber}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Present this digital pass at the entrance
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button
              onClick={handlePrint}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "#1A8A6A",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
