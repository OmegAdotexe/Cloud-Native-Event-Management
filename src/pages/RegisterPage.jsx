import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Radio, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
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
      await register({ name, email, password });
      navigate("/login");
    } catch (err) {
      setLocalError(err.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relay-auth-page">
      <div className="relay-auth-card">
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

          <Link to="/landing" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--mute)", textDecoration: "none" }}>
            <ArrowLeft size={13} /> Home
          </Link>
        </div>

        <h1>Create an Account</h1>
        <p style={{ color: "var(--mute)", fontSize: "13.5px", marginBottom: "26px" }}>
          Join CampusConnect to discover and register for university events.
        </p>

        {(error || localError) && (
          <div className="relay-auth-error">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "18px" }}>
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
          <div style={{ marginBottom: "18px" }}>
            <label className="relay-field-label">University Email</label>
            <input
              type="email"
              className="relay-auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@campus.edu"
              required
            />
          </div>
          <div style={{ marginBottom: "26px" }}>
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
            {loading ? "Creating account..." : "Sign Up for CampusConnect"}
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "13px", textAlign: "center", color: "var(--mute)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
