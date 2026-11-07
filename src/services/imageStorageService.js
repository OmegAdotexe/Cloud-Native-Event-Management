/**
 * imageStorageService.js — Modular Cloud-Native Image Upload & Storage Service
 *
 * Implements client-side validation, drag-and-drop file processing,
 * responsive previews, persistent local caching, and modular AWS S3 upload integration.
 *
 * S3 Integration Architecture:
 * - Provisioned S3 Bucket: campusconnect-media-720936372381-ap-south-1
 * - Secure Flow:
 *   1. Client requests presigned PUT URL from backend: POST /api/media/presign { filename, contentType }
 *   2. Client uploads binary directly to S3 bucket via presigned URL with zero credentials on client.
 *   3. If backend endpoint is not yet mounted, service falls back to high-res local blob/Base64
 *      preview cache and clearly flags the status.
 */

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const STORAGE_KEY = "campusconnect_custom_images";

export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }
  if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Unsupported file format. Please upload JPG, PNG, or WEBP.",
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed size of 5 MB.`,
    };
  }
  return { valid: true };
}

export function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Converts a File object to a Base64 string for persistent offline preview
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Saves custom images for an event to localStorage
 */
export function saveCustomEventImages(eventIdentifier, { poster, gallery = [] }) {
  if (!eventIdentifier) return;
  try {
    const registry = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    registry[eventIdentifier] = {
      poster: poster || registry[eventIdentifier]?.poster,
      gallery: gallery.length > 0 ? gallery : (registry[eventIdentifier]?.gallery || []),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch (err) {
    console.warn("Could not save to localStorage (quota or disabled):", err);
  }
}

/**
 * Retrieves custom images for an event
 */
export function getCustomEventImages(eventIdentifier) {
  if (!eventIdentifier) return null;
  try {
    const registry = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return registry[eventIdentifier] || null;
  } catch (err) {
    return null;
  }
}

/**
 * Modular AWS S3 Upload Function
 * Attempts backend presigned URL upload if supported; otherwise uses high-res preview cache.
 */
export async function uploadEventImage(file, { eventId, type = "poster" } = {}) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 1. Generate local blob URL for immediate responsive UI feedback
  const previewUrl = URL.createObjectURL(file);
  const base64Data = await fileToBase64(file);

  // 2. Check if backend has S3 presigned URL support
  let s3UploadedUrl = null;
  let backendSupported = false;

  try {
    const token = localStorage.getItem("relay_auth_token");
    const presignResponse = await fetch("/api/media/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        eventId,
      }),
    });

    if (presignResponse.ok) {
      const { uploadUrl, publicUrl } = await presignResponse.json();
      // Upload directly to S3
      const s3Put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (s3Put.ok) {
        s3UploadedUrl = publicUrl;
        backendSupported = true;
      }
    }
  } catch (e) {
    // Backend endpoint not yet implemented — standard graceful fallback
    backendSupported = false;
  }

  const finalUrl = s3UploadedUrl || base64Data;

  // Persist locally for user session preview
  if (eventId) {
    if (type === "poster") {
      saveCustomEventImages(eventId, { poster: finalUrl });
    } else {
      const existing = getCustomEventImages(eventId);
      const gallery = existing?.gallery ? [...existing.gallery, finalUrl] : [finalUrl];
      saveCustomEventImages(eventId, { gallery });
    }
  }

  return {
    url: finalUrl,
    previewUrl,
    backendSupported,
    isLocalPreview: !backendSupported,
    fileName: file.name,
    fileSize: file.size,
    message: backendSupported
      ? "Uploaded securely to AWS S3 bucket."
      : "Active high-res preview cached locally. (Backend presigned S3 endpoint pending)",
  };
}

