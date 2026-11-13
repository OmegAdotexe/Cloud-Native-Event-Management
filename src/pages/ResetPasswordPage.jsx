import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import * as relayApi from "../api/relayApi.js";
import { Radio, ArrowLeft, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Password strength checks
  const hasMinLength = newPassword.length >= 6;
  const hasStrongLength = newPassword.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("No reset token provided. Please request a new password reset link.");
      return;
    }

    if (!hasMinLength) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);
    try {
      await relayApi.resetPassword(token, newPassword, confirmPassword);
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to reset password. The link may have expired or already been used.");
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
            <Lock size={22} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text)" }}>
            Reset Your Password
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--mute)", margin: 0, lineHeight: 1.5 }}>
            Enter and confirm your new secure password below to regain account access.
          </p>
        </div>

        {!token && (
          <div style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "20px",
            textAlign: "left",
            marginBottom: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#EF4444", marginBottom: "10px" }}>
              <AlertCircle size={20} />
              <span style={{ fontWeight: 600, fontSize: "14px" }}>Missing Reset Token</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--mute)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              It looks like you opened this page without a valid reset token. Please request a new password reset email.
            </p>
            <Link
              to="/forgot-password"
              className="cc-btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "10px", borderRadius: "10px", textDecoration: "none" }}
            >
              Request Password Reset
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="relay-auth-error" style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "16px" }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1, fontSize: "13px" }}>
              <div>{errorMessage}</div>
              {errorMessage.toLowerCase().includes("expired") || errorMessage.toLowerCase().includes("already") ? (
                <div style={{ marginTop: "6px" }}>
                  <Link to="/forgot-password" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "underline" }}>
                    Request a fresh reset link &rarr;
                  </Link>
                </div>
              ) : null}
            </div>
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
                Password Reset Successful!
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--mute)", lineHeight: 1.6, margin: "0 0 16px 0" }}>
              Your account password has been updated securely. You can now sign in with your new credentials.
            </p>

            <button
              type="button"
              className="cc-btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "10px" }}
              onClick={() => navigate("/login")}
            >
              Sign In to CampusConnect
            </button>
          </div>
        ) : token ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label className="relay-field-label">New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="relay-auth-input"
                  style={{ paddingRight: "40px" }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--mute)",
                    cursor: "pointer",
                    padding: 0
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="relay-field-label">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="relay-auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </div>

            {/* Password Validation Hints */}
            {newPassword.length > 0 && (
              <div style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "10px 12px",
                marginBottom: "20px",
                fontSize: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                <div style={{ color: hasMinLength ? "#10B981" : "var(--mute)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{hasMinLength ? "✓" : "○"}</span> At least 6 characters
                </div>
                <div style={{ color: passwordsMatch ? "#10B981" : "var(--mute)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{passwordsMatch ? "✓" : "○"}</span> Passwords match
                </div>
              </div>
            )}

            <button
              type="submit"
              className="cc-btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "10px" }}
              disabled={loading || !hasMinLength || (confirmPassword.length > 0 && !passwordsMatch)}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
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
        ) : null}
      </div>
    </div>
  );
}
