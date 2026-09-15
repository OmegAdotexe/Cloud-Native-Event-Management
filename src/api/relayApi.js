/**
 * relayApi.js — Real API layer
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToken() {
  return localStorage.getItem("relay_auth_token");
}

async function authFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "An error occurred";
    try {
      const errData = await response.json();
      message = errData.message || errData.error || message;
    } catch {
      message = response.statusText || message;
    }
    throw { status: response.status, message };
  }

  // Some endpoints might not return content (e.g. 204 No Content)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Events (Stubbed for now, as Prompt 4 says "Do not implement Event Management yet")
// ---------------------------------------------------------------------------
import { initialEvents } from "../data/mockData.js";

export async function getEvents() {
  return structuredClone(initialEvents);
}

export async function patchEvent(id, patch) {
  return { id, ...patch };
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getNotifications(eventId) {
  return [];
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/login
 */
export async function login(credentials) {
  return authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/**
 * POST /api/auth/register
 */
export async function register(userData) {
  return authFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

/**
 * GET /api/auth/me
 */
export async function getMe() {
  return authFetch("/api/auth/me", {
    method: "GET",
  });
}

export async function logout() {
  localStorage.removeItem("relay_auth_token");
  return { ok: true };
}
