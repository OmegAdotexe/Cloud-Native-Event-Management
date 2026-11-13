import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Radio, ArrowLeft, Sparkles, Shield, User, ShieldCheck, Info } from "lucide-react";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState("PARTICIPANT"); // UI portal selector
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loginWithGoogle, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showGoogleNotice, setShowGoogleNotice] = useState(false);
  const navigate = useNavigate();

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLoading(true);
    
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setLocalError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateGoogleAuth = async (mockEmail) => {
    setLocalError("");
    setLoading(true);
    try {
      await loginWithGoogle({
        idToken: `mock-google-token-${mockEmail || "student@thapar.edu"}`,
        department: "Computer Science",
      });
      navigate("/");
    } catch (err) {
      setLocalError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
      setShowGoogleNotice(false);
    }
  };

  const portalDescriptions = {
    PARTICIPANT: {
      title: "Participant Portal",
      badge: "Student & Attendee",
      icon: User,
      desc: "Sign in to discover campus events, register for sessions, and access digital QR entry passes.",
    },
    EVENT_ADMIN: {
      title: "Event Organizer Console",
      badge: "Club Lead & Faculty",
      icon: Shield,
      desc: "Sign in to manage club events, publish schedules, review attendee approvals, and inspect attendance.",
    },
    SUPER_ADMIN: {
      title: "Super Admin Console",
      badge: "Platform Administration",
      icon: ShieldCheck,
      desc: "Sign in to oversee campus-wide operations, review organizer applications, and manage platform security.",
    },
  };

  const currentPortal = portalDescriptions[selectedRole] || portalDescriptions.PARTICIPANT;
  const PortalIcon = currentPortal.icon;

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
            <ArrowLeft size={13} /> Public Home
          </Link>
        </div>

        {/* Role Portal Selector (3 Clearly Organized Options) */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--mute)", letterSpacing: "0.06em", marginBottom: "8px" }}>
            Select Portal Access:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", background: "var(--bg)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border)" }}>
            {[
              { id: "PARTICIPANT", label: "Participant" },
              { id: "EVENT_ADMIN", label: "Event Admin" },
              { id: "SUPER_ADMIN", label: "Super Admin" },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedRole(tab.id);
                  if (tab.id === "PARTICIPANT") { setEmail("participant@example.com"); setPassword("password"); }
                  else if (tab.id === "EVENT_ADMIN") { setEmail("admin@example.com"); setPassword("password"); }
                  else { setEmail("superadmin@example.com"); setPassword("password"); }
                }}
                style={{
                  background: selectedRole === tab.id ? "var(--surface)" : "transparent",
                  color: selectedRole === tab.id ? "var(--primary)" : "var(--mute)",
                  border: selectedRole === tab.id ? "1px solid var(--border)" : "none",
                  boxShadow: selectedRole === tab.id ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  borderRadius: "9px",
                  padding: "7px 6px",
                  fontSize: "12px",
                  fontWeight: selectedRole === tab.id ? 700 : 500,
                  cursor: "pointer",
                  transition: "all .15s ease",
                  textAlign: "center"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Portal Context Banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--primary-light)", borderRadius: "12px", marginBottom: "18px" }}>
          <div style={{ color: "var(--primary)", flexShrink: 0 }}>
            <PortalIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>{currentPortal.title}</div>
            <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.3" }}>{currentPortal.desc}</div>
          </div>
        </div>

        {(error || localError) && (
          <div className="relay-auth-error">
            {localError || error}
          </div>
        )}

        {/* Google Authentication Button */}
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
            Continue with Google
          </button>
        </div>

        {/* Google OAuth Modal / Notice */}
        {showGoogleNotice && (
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px", marginBottom: "18px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
              <Info size={16} style={{ color: "var(--primary)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text)" }}>Google Identity Services Notice</div>
                <div style={{ fontSize: "11.5px", color: "var(--mute)", lineHeight: "1.4" }}>
                  Google OAuth strictly requires an authorized HTTPS origin and verified university domain (e.g. <code>https://events.thapar.edu</code>). In the current HTTP public IP deployment, production OAuth remains disabled until domain & credentials are configured.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button
                type="button"
                className="cc-btn-primary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={() => handleSimulateGoogleAuth("student.demo@thapar.edu")}
              >
                Simulate @thapar.edu Google Login
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
          <span style={{ fontSize: "11px", color: "var(--mute)", textTransform: "uppercase" }}>or sign in with password</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <form onSubmit={handleLocalSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label className="relay-field-label">University Email</label>
            <input
              type="email"
              className="relay-auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@campus.edu"
              required
            />
          </div>
          <div style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label className="relay-field-label" style={{ marginBottom: 0 }}>Password</label>
              <Link 
                to="/forgot-password" 
                style={{ 
                  fontSize: "12px", 
                  color: "var(--primary)", 
                  textDecoration: "none", 
                  fontWeight: 600,
                  transition: "opacity 0.15s ease"
                }}
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              className="relay-auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="cc-btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "10px" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : `Sign In to ${currentPortal.label || "CampusConnect"}`}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{ marginTop: "20px", padding: "12px 14px", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.06em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={12} />
            <span>Instant Demo Logins</span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="relay-btn-ghost relay-btn-sm"
              style={{ fontSize: "11.5px", padding: "4px 8px", borderRadius: "8px", background: "var(--surface)" }}
              onClick={() => { setSelectedRole("PARTICIPANT"); setEmail("participant@example.com"); setPassword("password"); }}
            >
              Participant Demo
            </button>
            <button
              type="button"
              className="relay-btn-ghost relay-btn-sm"
              style={{ fontSize: "11.5px", padding: "4px 8px", borderRadius: "8px", background: "var(--surface)" }}
              onClick={() => { setSelectedRole("EVENT_ADMIN"); setEmail("admin@example.com"); setPassword("password"); }}
            >
              Event Admin Demo
            </button>
            <button
              type="button"
              className="relay-btn-ghost relay-btn-sm"
              style={{ fontSize: "11.5px", padding: "4px 8px", borderRadius: "8px", background: "var(--surface)" }}
              onClick={() => { setSelectedRole("SUPER_ADMIN"); setEmail("superadmin@example.com"); setPassword("password"); }}
            >
              Super Admin Demo
            </button>
          </div>
        </div>

        <p style={{ marginTop: "18px", fontSize: "13px", textAlign: "center", color: "var(--mute)" }}>
          New student? <Link to="/register" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
