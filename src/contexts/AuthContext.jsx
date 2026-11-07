import React, { createContext, useContext, useState, useEffect } from "react";
import * as relayApi from "../api/relayApi.js";

// ---------------------------------------------------------------------------
// Context definition
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("relay_auth_token") || localStorage.getItem("relay_auth_token") || null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount if token exists
  useEffect(() => {
    async function initAuth() {
      const activeToken = sessionStorage.getItem("relay_auth_token") || localStorage.getItem("relay_auth_token");
      if (!activeToken) {
        setIsLoading(false);
        return;
      }
      // Guarantee session-isolated storage for current tab
      sessionStorage.setItem("relay_auth_token", activeToken);
      try {
        const me = await relayApi.getMe();
        setUser(me);
      } catch (err) {
        console.error("Session restoration failed:", err);
        setToken(null);
        setUser(null);
        sessionStorage.removeItem("relay_auth_token");
        localStorage.removeItem("relay_auth_token");
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, [token]);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await relayApi.login(credentials);
      // Store in sessionStorage so each tab maintains an independent authenticated identity
      sessionStorage.setItem("relay_auth_token", data.token);
      setToken(data.token);
      setUser(data);
      return data;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      await relayApi.register(userData);
      // After registration, user can login with credentials
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await relayApi.logout();
    } catch (err) {
      console.warn("Logout api failed:", err);
    }
    sessionStorage.removeItem("relay_auth_token");
    localStorage.removeItem("relay_auth_token");
    setToken(null);
    setUser(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, isLoading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
