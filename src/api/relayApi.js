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
// Events
// ---------------------------------------------------------------------------

export async function getEvents() {
  return authFetch("/api/events");
}

export async function getEventById(id) {
  return authFetch(`/api/events/${id}`);
}

export async function createEvent(data) {
  return authFetch("/api/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id, data) {
  return authFetch(`/api/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id) {
  return authFetch(`/api/events/${id}`, { method: "DELETE" });
}

export async function publishEvent(id) {
  return authFetch(`/api/events/${id}/publish`, { method: "PATCH" });
}

export async function cancelEvent(id, reason) {
  return authFetch(`/api/events/${id}/cancel`, { method: "PATCH", body: JSON.stringify({ reason }) });
}

export async function reassignEvent(id, newEventAdminId) {
  return authFetch(`/api/events/${id}/reassign`, { method: "PATCH", body: JSON.stringify({ newEventAdminId }) });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getNotifications(page = 0, size = 20) {
  return authFetch(`/api/v1/notifications?page=${page}&size=${size}`);
}

export async function getUnreadNotificationCount() {
  return authFetch("/api/v1/notifications/unread-count");
}

export async function markNotificationRead(id) {
  return authFetch(`/api/v1/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead() {
  return authFetch("/api/v1/notifications/read-all", { method: "POST" });
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export async function getTimeline(eventId) {
  return authFetch(`/api/events/${eventId}/timeline`, { method: "GET" });
}

export async function createTimelineItem(eventId, data) {
  return authFetch(`/api/events/${eventId}/timeline`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTimelineItem(eventId, itemId, data) {
  return authFetch(`/api/events/${eventId}/timeline/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTimelineItem(eventId, itemId) {
  return authFetch(`/api/events/${eventId}/timeline/${itemId}`, {
    method: "DELETE",
  });
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
// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

export async function registerForEvent(eventId) {
  return authFetch(`/api/events/${eventId}/registrations`, { method: "POST" });
}

export async function cancelRegistration(eventId, registrationId, reason) {
  return authFetch(`/api/events/${eventId}/registrations/${registrationId}/cancel`, { 
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function approveRegistration(eventId, registrationId) {
  return authFetch(`/api/events/${eventId}/registrations/${registrationId}/approve`, { method: "POST" });
}

export async function rejectRegistration(eventId, registrationId, reason) {
  return authFetch(`/api/events/${eventId}/registrations/${registrationId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getEventRegistrations(eventId, status, page = 0, size = 10) {
  const params = new URLSearchParams({ page, size });
  if (status) params.append("status", status);
  return authFetch(`/api/events/${eventId}/registrations?${params.toString()}`);
}

export async function getMyRegistrations() {
  return authFetch("/api/participants/me/registrations");
}

export async function inviteParticipants(eventId, participantIds) {
  return authFetch(`/api/events/${eventId}/invites`, {
    method: "POST",
    body: JSON.stringify({ participantIds }),
  });
}
