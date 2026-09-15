import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

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
    <div className="relay-root relay-scroll" style={{ height: "720px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="relay-card" style={{ width: "360px", padding: "24px" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "8px", marginTop: 0 }}>Log in to Relay</h1>
        <p className="relay-meta-item" style={{ marginBottom: "24px" }}>Welcome back</p>

        {(error || localError) && (
          <div style={{ background: "rgba(226, 96, 79, 0.15)", border: "1px solid var(--coral)", color: "var(--coral)", padding: "10px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label className="relay-field-label">Email</label>
            <input
              type="email"
              className="relay-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label className="relay-field-label">Password</label>
            <input
              type="password"
              className="relay-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="relay-btn" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p style={{ marginTop: "16px", fontSize: "12px", textAlign: "center", color: "var(--mute)" }}>
          Don't have an account? <Link to="/register" style={{ color: "var(--amber)", textDecoration: "none" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
