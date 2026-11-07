import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as relayApi from "../api/relayApi.js";
import { Radio, ArrowLeft, ShieldCheck, Info, UserCheck, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const location = useLocation();
  const [accountType, setAccountType] = useState(() => {
    return location.state?.role === "EVENT_ADMIN" ? "EVENT_ADMIN" : "PARTICIPANT";
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [orgRole, setOrgRole] = useState("");
  const [statement, setStatement] = useState("");

  const { register, login, loginWithGoogle, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showGoogleNotice, setShowGoogleNotice] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLoading(true);

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (accountType === "EVENT_ADMIN") {
      if (!department.trim()) {
        setLocalError("Department or Organization is required for Event Admin applications.");
        setLoading(false);
        return;
      }
      if (!phone.trim()) {
        setLocalError("Phone number is required for organizer verification.");
        setLoading(false);
        return;
      }
    }

    try {
      // 1. Create user account (safely created as PARTICIPANT role on backend)
      await register({ name, email, password, department: department.trim() });

      // 2. If Event Admin application, immediately authenticate and submit application
      if (accountType === "EVENT_ADMIN") {
        await login(email, password);
        await relayApi.applyForAdmin({
          fullName: name.trim(),
          department: department.trim(),
          phoneNumber: phone.trim(),
          organizationRole: orgRole.trim() || "Lead Organizer",
          statement: statement.trim() || `Event management request for ${department.trim()}`,
        });
        setApplicationSubmitted(true);
      } else {
        navigate("/login");
      }
    } catch (err) {
      setLocalError(err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateGoogleRegister = async () => {
    setLocalError("");
    setLoading(true);
    try {
      await loginWithGoogle({
        idToken: `mock-google-token-${email || "newstudent@thapar.edu"}`,
        department: department || "Engineering",
      });
      navigate("/");
    } catch (err) {
      setLocalError(err.message || "Google registration failed.");
    } finally {
      setLoading(false);
      setShowGoogleNotice(false);
    }
  };

  return (
    <div className="relay-auth-page">
      <div className="relay-auth-card" style={{ maxWidth: accountType === "EVENT_ADMIN" ? "520px" : "460px", transition: "max-width 0.2s ease" }}>
        {/* Brand Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="cc-brand-icon">
              <Radio size={18} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "19px", color: "var(--text)" }}>
              CampusConnect
            </span>
          </div>

          <Link to="/landing" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--mute)", textDecoration: "none" }}>
            <ArrowLeft size={13} /> Home
          </Link>
        </div>

        {/* Account Type Toggle */}
        <div style={{ display: "flex", gap: "6px", background: "var(--bg)", padding: "4px", borderRadius: "10px", marginBottom: "18px", border: "1px solid var(--border)" }}>
          <button
            type="button"
            className={`relay-btn-ghost ${accountType === "PARTICIPANT" ? "active" : ""}`}
            onClick={() => setAccountType("PARTICIPANT")}
            style={{
              flex: 1, padding: "8px", fontSize: "12.5px", fontWeight: 600,
              background: accountType === "PARTICIPANT" ? "var(--surface)" : "transparent",
              color: accountType === "PARTICIPANT" ? "var(--primary)" : "var(--mute)",
              boxShadow: accountType === "PARTICIPANT" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Student Participant
          </button>
          <button
            type="button"
            className={`relay-btn-ghost ${accountType === "EVENT_ADMIN" ? "active" : ""}`}
            onClick={() => setAccountType("EVENT_ADMIN")}
            style={{
              flex: 1, padding: "8px", fontSize: "12.5px", fontWeight: 600,
              background: accountType === "EVENT_ADMIN" ? "var(--surface)" : "transparent",
              color: accountType === "EVENT_ADMIN" ? "var(--primary)" : "var(--mute)",
              boxShadow: accountType === "EVENT_ADMIN" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Event Admin Application
          </button>
        </div>

        {applicationSubmitted ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "var(--teal-light)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={28} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
              Application Submitted!
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 20px" }}>
              Your application to become an Event Admin for <strong>{department}</strong> has been received and logged.
              Our Super Admins will review your organizational credentials.
              In the meantime, your account is active as a campus participant.
            </p>
            <button
              type="button"
              className="cc-btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "10px" }}
              onClick={() => navigate("/")}
            >
              Continue to Campus Portal
            </button>
          </div>
        ) : (
          <>
            <h1>{accountType === "EVENT_ADMIN" ? "Event Admin Application" : "Create Student Account"}</h1>
            <p style={{ color: "var(--mute)", fontSize: "13px", marginBottom: "18px" }}>
              {accountType === "EVENT_ADMIN"
                ? "Apply for organizer privileges to create and manage society events."
                : "Instant self-registration for university students and event attendees."}
            </p>

            {/* Role Notice */}
            <div style={{
              display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 14px",
              background: accountType === "EVENT_ADMIN" ? "var(--amber-light)" : "var(--teal-light)",
              borderRadius: "12px", marginBottom: "18px"
            }}>
              {accountType === "EVENT_ADMIN" ? (
                <UserCheck size={18} style={{ color: "var(--amber)", marginTop: "2px", flexShrink: 0 }} />
              ) : (
                <ShieldCheck size={18} style={{ color: "var(--teal)", marginTop: "2px", flexShrink: 0 }} />
              )}
              <div style={{ fontSize: "12px", color: accountType === "EVENT_ADMIN" ? "var(--amber)" : "var(--teal)", lineHeight: "1.4" }}>
                {accountType === "EVENT_ADMIN" ? (
                  <span><strong>Super Admin Review Required:</strong> Applications are verified by Super Admins before event publishing privileges are granted.</span>
                ) : (
                  <span><strong>Instant Active Access:</strong> Student accounts are activated immediately.</span>
                )}
              </div>
            </div>

            {(error || localError) && (
              <div className="relay-auth-error">
                {localError || error}
              </div>
            )}

            {/* Google Signup Button (Participant only) */}
            {accountType === "PARTICIPANT" && (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <button
                    type="button"
                    className="relay-btn-ghost"
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                      gap: "10px", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)",
                      background: "var(--surface)", fontWeight: 600, fontSize: "13.5px", color: "var(--text)",
                    }}
                    onClick={() => setShowGoogleNotice(true)}
                    disabled={loading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Sign up with Google
                  </button>
                </div>

                {showGoogleNotice && (
                  <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px", marginBottom: "18px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                      <Info size={16} style={{ color: "var(--primary)", marginTop: "2px", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text)" }}>Google Identity Notice</div>
                        <div style={{ fontSize: "11.5px", color: "var(--mute)", lineHeight: "1.4" }}>
                          Google OAuth mandates an authorized HTTPS domain for production. On dev environments, you can simulate verified student registration with 1 click.
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button
                        type="button"
                        className="cc-btn-primary"
                        style={{ fontSize: "12px", padding: "6px 12px" }}
                        onClick={handleSimulateGoogleRegister}
                      >
                        Simulate @thapar.edu Google Signup
                      </button>
                      <button
                        type="button"
                        className="relay-btn-ghost relay-btn-sm"
                        onClick={() => setShowGoogleNotice(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ fontSize: "11px", color: "var(--mute)", textTransform: "uppercase" }}>or register with email</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label className="relay-field-label">Full Name</label>
                <input
                  type="text"
                  className="relay-auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label className="relay-field-label">Institutional / University Email</label>
                <input
                  type="email"
                  className="relay-auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.edu or name@thapar.edu"
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label className="relay-field-label">Department / Society / Organization</label>
                <input
                  type="text"
                  className="relay-auth-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={accountType === "EVENT_ADMIN" ? "e.g. Computer Science Society, IEEE, Athletics" : "e.g. Computer Science, Mechanical"}
                  required={accountType === "EVENT_ADMIN"}
                />
              </div>

              {accountType === "EVENT_ADMIN" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                    <div>
                      <label className="relay-field-label">Phone Number</label>
                      <input
                        type="tel"
                        className="relay-auth-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>
                    <div>
                      <label className="relay-field-label">Role in Organization</label>
                      <input
                        type="text"
                        className="relay-auth-input"
                        value={orgRole}
                        onChange={(e) => setOrgRole(e.target.value)}
                        placeholder="e.g. President, Lead, Coordinator"
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label className="relay-field-label">Event Hosting Statement / Justification</label>
                    <textarea
                      rows={3}
                      className="relay-auth-input"
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      placeholder="Briefly state what events your society plans to host..."
                      style={{ resize: "vertical", height: "auto" }}
                    />
                  </div>
                </>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label className="relay-field-label">Password</label>
                <input
                  type="password"
                  className="relay-auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <button
                type="submit"
                className="cc-btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "10px" }}
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : accountType === "EVENT_ADMIN"
                    ? "Submit Event Admin Application"
                    : "Complete Participant Registration"}
              </button>
            </form>

            <p style={{ marginTop: "18px", fontSize: "13px", textAlign: "center", color: "var(--mute)" }}>
              Already have an account? <Link to="/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
