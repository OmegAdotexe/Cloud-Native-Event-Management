import React, { useState } from "react";
import { X, User, Shield, Building, Mail, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import * as relayApi from "../api/relayApi.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ProfileModal({ isOpen, onClose, initialTab = "DETAILS" }) {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Edit Profile state
  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const updated = await relayApi.updateProfile({ name, department });
      if (setUser) {
        setUser(prev => ({ ...prev, ...updated }));
      }
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await relayApi.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setSavingPassword(false);
    }
  };

  const isGoogle = user.authProvider === "GOOGLE";

  return (
    <div className="relay-modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="relay-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: "560px", width: "90%", padding: "28px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "19px", fontWeight: 700, margin: 0, color: "var(--text)" }}>User Profile & Settings</h2>
            <p style={{ fontSize: "12px", color: "var(--mute)", margin: "4px 0 0" }}>Manage your personal details, credentials, and institutional role</p>
          </div>
          <button className="relay-btn-ghost" onClick={onClose} style={{ padding: "6px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="relay-tab-bar" style={{ marginBottom: "22px" }}>
          <button 
            type="button" 
            className={`relay-tab ${activeTab === "DETAILS" ? "active" : ""}`}
            onClick={() => setActiveTab("DETAILS")}
          >
            Account Details
          </button>
          <button 
            type="button" 
            className={`relay-tab ${activeTab === "EDIT" ? "active" : ""}`}
            onClick={() => setActiveTab("EDIT")}
          >
            Edit Profile
          </button>
          <button 
            type="button" 
            className={`relay-tab ${activeTab === "PASSWORD" ? "active" : ""}`}
            onClick={() => setActiveTab("PASSWORD")}
          >
            Change Password
          </button>
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === "DETAILS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700 }}>
                {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{user.name}</div>
                <div style={{ fontSize: "12.5px", color: "var(--mute)" }}>{user.email}</div>
                <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "var(--primary-light)", color: "var(--primary)" }}>
                    {user.role}
                  </span>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "rgba(42, 171, 138, 0.12)", color: "var(--teal)" }}>
                    {user.status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
              <div style={{ padding: "12px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "11.5px", color: "var(--mute)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building size={13} /> Department / Club
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", marginTop: "4px" }}>
                  {user.department || "General Campus Member"}
                </div>
              </div>

              <div style={{ padding: "12px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "11.5px", color: "var(--mute)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Shield size={13} /> Authentication Provider
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", marginTop: "4px" }}>
                  {user.authProvider || "Local Secure Credentials"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === "EDIT" && (
          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {profileMsg && (
              <div style={{ 
                padding: "10px 14px", 
                borderRadius: "8px", 
                fontSize: "13px", 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                background: profileMsg.type === "success" ? "rgba(42, 171, 138, 0.12)" : "rgba(229, 90, 79, 0.12)",
                color: profileMsg.type === "success" ? "var(--teal)" : "var(--coral)",
              }}>
                {profileMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {profileMsg.text}
              </div>
            )}

            <div>
              <label className="relay-field-label">Full Name</label>
              <input 
                type="text" 
                className="relay-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label className="relay-field-label">Department / Organizing Club</label>
              <input 
                type="text" 
                className="relay-input" 
                placeholder="e.g. Computer Science / Robotics Society"
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button type="button" className="relay-btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="cc-btn-primary" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
        {activeTab === "PASSWORD" && (
          <div>
            {isGoogle ? (
              <div style={{ padding: "16px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)", textAlign: "center" }}>
                <KeyRound size={28} style={{ color: "var(--primary)", margin: "0 auto 10px" }} />
                <div style={{ fontWeight: 600, color: "var(--text)" }}>Google-Managed Account</div>
                <p style={{ fontSize: "12.5px", color: "var(--mute)", margin: "6px 0 0" }}>
                  This account signs in through Google Identity Services. Password management is handled securely through your Google Account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {passwordMsg && (
                  <div style={{ 
                    padding: "10px 14px", 
                    borderRadius: "8px", 
                    fontSize: "13px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    background: passwordMsg.type === "success" ? "rgba(42, 171, 138, 0.12)" : "rgba(229, 90, 79, 0.12)",
                    color: passwordMsg.type === "success" ? "var(--teal)" : "var(--coral)",
                  }}>
                    {passwordMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {passwordMsg.text}
                  </div>
                )}

                <div>
                  <label className="relay-field-label">Current Password</label>
                  <input 
                    type="password" 
                    className="relay-input" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <label className="relay-field-label">New Password</label>
                  <input 
                    type="password" 
                    className="relay-input" 
                    placeholder="Minimum 6 characters"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <label className="relay-field-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="relay-input" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                  <button type="button" className="relay-btn-ghost" onClick={onClose}>Cancel</button>
                  <button type="submit" className="cc-btn-primary" disabled={savingPassword}>
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

