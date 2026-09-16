import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Radio } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
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

  return (
    <div className="relay-auth-page">
      <div className="relay-auth-card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "9px",
            background: "linear-gradient(135deg, #E8943A, #D47A20)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(232, 148, 58, 0.3)"
          }}>
            <Radio size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "18px", color: "var(--text)" }}>Relay</span>
        </div>

        <h1>Welcome back</h1>
        <p style={{ color: "var(--mute)", fontSize: "13.5px", marginBottom: "28px" }}>Log in to your account to continue</p>

        {(error || localError) && (
          <div className="relay-auth-error">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "18px" }}>
            <label className="relay-field-label">Email</label>
            <input
              type="email"
              className="relay-auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@campus.edu"
              required
            />
          </div>
          <div style={{ marginBottom: "28px" }}>
            <label className="relay-field-label">Password</label>
            <input
              type="password"
              className="relay-auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="relay-btn" style={{ width: "100%", justifyContent: "center", padding: "12px", background: "#4A7BF7", color: "#FFFFFF", borderRadius: "9px", border: "none", fontWeight: 600 }} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "13px", textAlign: "center", color: "var(--mute)" }}>
          Don't have an account? <Link to="/register" style={{ color: "var(--amber)", textDecoration: "none", fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
