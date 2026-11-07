import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Radio, ArrowLeft, ShieldCheck, Info } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const { register, loginWithGoogle, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showGoogleNotice, setShowGoogleNotice] = useState(false);
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

    try {
      await register({ name, email, password, department: department.trim() });
      navigate("/login");
    } catch (err) {
      setLocalError(err.message || "Failed to register.");
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
      <div className="relay-auth-card" style={{ maxWidth: "460px" }}>
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

        <h1>Create Student Account</h1>
        <p style={{ color: "var(--mute)", fontSize: "13px", marginBottom: "18px" }}>
          Instant self-registration for university students and event attendees.
        </p>

        {/* Participant Instant Access Notice */}
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 14px", background: "var(--teal-light)", borderRadius: "12px", marginBottom: "18px" }}>
          <ShieldCheck size={18} style={{ color: "var(--teal)", marginTop: "2px", flexShrink: 0 }} />
          <div style={{ fontSize: "12px", color: "var(--teal)", lineHeight: "1.4" }}>
            <strong>Instant Active Access:</strong> Student accounts are activated immediately. Event Organizer & Admin permissions require Super Admin authorization.
          </div>
        </div>

        {(error || localError) && (
          <div className="relay-auth-error">
            {localError || error}
          </div>
        )}

        {/* Google Signup Button */}
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="relay-btn-ghost"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontWeight: 600,
              fontSize: "13.5px",
              color: "var(--text)",
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

        {/* Google Notice Modal */}
        {showGoogleNotice && (
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px", marginBottom: "18px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
              <Info size={16} style={{ color: "var(--primary)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text)" }}>Google Identity Notice</div>
                <div style={{ fontSize: "11.5px", color: "var(--mute)", lineHeight: "1.4" }}>
                  Google OAuth mandates an authorized HTTPS domain for production. On local environments, you can simulate verified student registration with 1 click.
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
            <label className="relay-field-label">University Email</label>
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
            <label className="relay-field-label">Department / Branch</label>
            <input
              type="text"
              className="relay-auth-input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science, Mechanical, Arts"
            />
          </div>
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
            {loading ? "Creating account..." : "Complete Participant Registration"}
          </button>
        </form>

        <p style={{ marginTop: "18px", fontSize: "13px", textAlign: "center", color: "var(--mute)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
