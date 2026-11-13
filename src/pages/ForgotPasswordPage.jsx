import React, { useState } from "react";
import { Link } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { Radio, ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setDevResetUrl("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    // Basic email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. name@campus.edu).");
      return;
    }

    setLoading(true);
    try {
      const res = await relayApi.requestPasswordReset(trimmedEmail);
      setSubmittedEmail(trimmedEmail);
      if (res && res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
      setIsSuccess(true);
    } catch (err) {
      // In accordance with security best practices, we suppress existence errors
      // and display the same success confirmation unless a network error explicitly occurred.
      setErrorMessage(err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relay-auth-page">
      <div className="relay-auth-card" style={{ maxWidth: "460px" }}>
        {/* Brand Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="cc-brand-icon">
              <Radio size={18} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "19px", color: "var(--text)" }}>
              CampusConnect
            </span>
          </div>

          <Link to="/login" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--mute)", textDecoration: "none" }}>
            <ArrowLeft size={13} /> Back to Login
          </Link>
        </div>

        {/* Card Header */}
        <div style={{ marginBottom: "22px", textAlign: "left" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "var(--primary-light, rgba(37, 99, 235, 0.1))",
            color: "var(--primary)",
            marginBottom: "12px"
          }}>
            <KeyRound size={22} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text)" }}>
            Forgot Your Password?
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--mute)", margin: 0, lineHeight: 1.5 }}>
            Enter your registered university email address and we'll send you a secure link to reset your password.
          </p>
        </div>

        {errorMessage && (
          <div className="relay-auth-error" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "20px",
            textAlign: "left",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ color: "#10B981" }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
                Reset Link Dispatched
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--mute)", lineHeight: 1.6, margin: "0 0 16px 0" }}>
              If an account is associated with <strong>{submittedEmail}</strong>, a password reset link has been sent. Please check your inbox (and spam folder). The link will expire in <strong>15 minutes</strong>.
            </p>

            {devResetUrl && (
              <div style={{
                marginBottom: "16px",
                padding: "12px 14px",
                background: "var(--primary-light, rgba(37, 99, 235, 0.08))",
                border: "1px dashed var(--primary)",
                borderRadius: "10px",
                fontSize: "12px"
              }}>
                <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: "4px" }}>
                  ⚡ Quick Reset Link (Local Testing Mode)
                </div>
                <div style={{ color: "var(--text)", marginBottom: "8px", lineHeight: "1.4" }}>
                  Since you're running locally, you can click below to test the reset flow immediately without checking MailHog or terminal logs:
                </div>
                <a
                  href={devResetUrl}
                  className="cc-btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    textDecoration: "none"
                  }}
                >
                  Open Reset Password Page &rarr;
                </a>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                to="/login"
                className="cc-btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "11px", borderRadius: "10px", textDecoration: "none" }}
              >
                Return to Login
              </Link>
              <button
                type="button"
                className="relay-btn-ghost"
                onClick={() => { setIsSuccess(false); setEmail(""); }}
                style={{ width: "100%", justifyContent: "center", padding: "9px", fontSize: "13px" }}
              >
                Send to another email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label className="relay-field-label">Registered Email Address</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  className="relay-auth-input"
                  style={{ paddingLeft: "38px" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  required
                  autoFocus
                />
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--mute)",
                    pointerEvents: "none"
                  }}
                />
              </div>

              {/* Quick Demo Autofill Chips */}
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", color: "var(--mute)" }}>Demo account:</span>
                {[
                  { label: "Participant", val: "participant@example.com" },
                  { label: "Admin", val: "admin@example.com" },
                  { label: "Super Admin", val: "superadmin@example.com" }
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    className="relay-btn-ghost relay-btn-sm"
                    style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "6px", background: "var(--bg)" }}
                    onClick={() => setEmail(item.val)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="cc-btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "10px" }}
              disabled={loading}
            >
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </button>

            <div style={{ marginTop: "18px", textAlign: "center" }}>
              <Link
                to="/login"
                style={{
                  fontSize: "13px",
                  color: "var(--mute)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 500
                }}
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
