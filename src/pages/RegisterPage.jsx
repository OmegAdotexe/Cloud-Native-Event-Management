import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

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
      // Role is hardcoded to PARTICIPANT to prevent privileged account creation
      await register({ name, email, password, role: "PARTICIPANT" });
      navigate("/login");
    } catch (err) {
      setLocalError(err.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relay-root relay-scroll" style={{ height: "720px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="relay-card" style={{ width: "360px", padding: "24px" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "8px", marginTop: 0 }}>Create an account</h1>
        <p className="relay-meta-item" style={{ marginBottom: "24px" }}>Join Relay</p>

        {(error || localError) && (
          <div style={{ background: "rgba(226, 96, 79, 0.15)", border: "1px solid var(--coral)", color: "var(--coral)", padding: "10px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label className="relay-field-label">Full Name</label>
            <input
              type="text"
              className="relay-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: "16px", fontSize: "12px", textAlign: "center", color: "var(--mute)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--amber)", textDecoration: "none" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
