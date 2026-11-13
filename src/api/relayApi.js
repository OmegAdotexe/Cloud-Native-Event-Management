/**
 * relayApi.js — Real API layer
 */

const API_BASE_URL = "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToken() {
  return sessionStorage.getItem("relay_auth_token") || localStorage.getItem("relay_auth_token");
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
      if (errData.errors && typeof errData.errors === "object") {
        const fieldErrors = Object.entries(errData.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(". ");
        message = fieldErrors || errData.message || message;
      } else {
        message = errData.message || errData.error || message;
      }
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

export async function getPublicEvents(category) {
  const url = category ? `/api/events/public?category=${category}` : "/api/events/public";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load public events");
  return res.json();
}

export async function getCategoryStats() {
  const res = await fetch("/api/events/categories/stats");
  if (!res.ok) throw new Error("Failed to load category statistics");
  return res.json();
}

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
// Analytics
export const getAdminDashboard = () => authFetch('/api/analytics/admin');
export const getSuperAdminDashboard = () => authFetch('/api/analytics/superadmin');
export const getEventAnalytics = (eventId) => authFetch(`/api/analytics/events/${eventId}`);
// ---------------------------------------------------------------------------

export async function getNotifications(category = null, page = 0, size = 20) {
  const params = new URLSearchParams({ page, size });
  if (category && category !== "ALL") params.append("category", category);
  return authFetch(`/api/v1/notifications?${params.toString()}`);
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
 * POST /api/auth/google
 */
export async function loginWithGoogle(data) {
  return authFetch("/api/auth/google", {
    method: "POST",
    body: JSON.stringify(data),
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

export async function updateProfile(data) {
  return authFetch("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function changePassword(data) {
  return authFetch("/api/auth/password", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function requestPasswordReset(email) {
  return authFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token, newPassword, confirmPassword) {
  return authFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });
}

export async function logout() {
  sessionStorage.removeItem("relay_auth_token");
  localStorage.removeItem("relay_auth_token");
  return { ok: true };
}
// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

export async function getPendingRegistrations(page = 0, size = 10) {
  return authFetch(`/api/events/pending-registrations?page=${page}&size=${size}`);
}

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

export async function getEventRegistrations(eventId, status, search, page = 0, size = 10) {
  const params = new URLSearchParams({ page, size });
  if (status) params.append("status", status);
  if (search && search.trim()) params.append("search", search.trim());
  return authFetch(`/api/events/${eventId}/registrations?${params.toString()}`);
}

export async function getEventRegistrationStats(eventId) {
  return authFetch(`/api/events/${eventId}/registrations/stats`);
}

export async function exportRegistrationsCsv(eventId) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/registrations/export`, { headers });
  if (!response.ok) throw new Error("Failed to export CSV");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registrations_${eventId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
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

// ---------------------------------------------------------------------------
// Phase 3: Admin Applications & Approvals
// ---------------------------------------------------------------------------

export async function applyForAdmin(data) {
  return authFetch("/api/admin-applications/apply", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyAdminApplicationStatus() {
  return authFetch("/api/admin-applications/status");
}

export async function getAdminApplications(status, search, page = 0, size = 15) {
  const params = new URLSearchParams({ page, size });
  if (status && status !== "ALL") params.append("status", status);
  if (search && search.trim()) params.append("search", search.trim());
  return authFetch(`/api/admin-applications?${params.toString()}`);
}

export async function getAdminApplicationStats() {
  return authFetch("/api/admin-applications/stats");
}

export async function getAdminApplicationById(id) {
  return authFetch(`/api/admin-applications/${id}`);
}

export async function getAdminApplicationAudits(id) {
  return authFetch(`/api/admin-applications/${id}/audits`);
}

export async function approveAdminApplication(id) {
  return authFetch(`/api/admin-applications/${id}/approve`, {
    method: "POST",
  });
}

export async function rejectAdminApplication(id, reason) {
  return authFetch(`/api/admin-applications/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function revokeAdminPrivileges(id, reason) {
  return authFetch(`/api/admin-applications/${id}/revoke`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function suspendAdmin(id, reason) {
  return authFetch(`/api/admin-applications/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
