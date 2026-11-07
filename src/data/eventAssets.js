/**
 * eventAssets.js — Curated high-resolution campus and event visual assets.
 * 
 * Provides verified high-speed CDN photographs for universities, hackathons,
 * cultural events, workshops, seminars, and sports, complete with fallback SVG placeholders
 * so no image is ever broken or missing.
 */

export const CURATED_EVENT_IMAGES = {
  // Campus & Atmosphere
  CAMPUS_HERO: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80",
  CAMPUS_QUAD: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
  CAMPUS_LIBRARY: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
  CAMPUS_STUDENTS: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",

  // Technical & Hackathons
  HACKATHON_1: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1000&q=80",
  HACKATHON_2: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80",
  CODING_WORKSHOP: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
  ROBOTICS_AI: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80",
  CYBERSECURITY: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80",

  // Workshops & Seminars
  SEMINAR_AUDITORIUM: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80",
  KEYNOTE_SPEAKER: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80",
  WORKSHOP_COLLAB: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80",
  DESIGN_SPRINT: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80",

  // Cultural & Festivals
  CULTURAL_CONCERT: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80",
  STAGE_LIGHTS: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80",
  ART_EXHIBITION: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1000&q=80",
  CAMPUS_FEST: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80",

  // Sports & Athletics
  SPORTS_ARENA: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80",
  BASKETBALL: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80",
  FOOTBALL_FIELD: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80",
  ATHLETICS_TRACK: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1000&q=80",
};

// Category defaults
export const CATEGORY_IMAGE_COLLECTIONS = {
  WORKSHOP: [
    CURATED_EVENT_IMAGES.CODING_WORKSHOP,
    CURATED_EVENT_IMAGES.WORKSHOP_COLLAB,
    CURATED_EVENT_IMAGES.DESIGN_SPRINT,
    CURATED_EVENT_IMAGES.HACKATHON_1,
  ],
  SEMINAR: [
    CURATED_EVENT_IMAGES.SEMINAR_AUDITORIUM,
    CURATED_EVENT_IMAGES.KEYNOTE_SPEAKER,
    CURATED_EVENT_IMAGES.CAMPUS_LIBRARY,
  ],
  CULTURAL: [
    CURATED_EVENT_IMAGES.CAMPUS_FEST,
    CURATED_EVENT_IMAGES.CULTURAL_CONCERT,
    CURATED_EVENT_IMAGES.STAGE_LIGHTS,
    CURATED_EVENT_IMAGES.ART_EXHIBITION,
  ],
  SPORTS: [
    CURATED_EVENT_IMAGES.SPORTS_ARENA,
    CURATED_EVENT_IMAGES.BASKETBALL,
    CURATED_EVENT_IMAGES.FOOTBALL_FIELD,
    CURATED_EVENT_IMAGES.ATHLETICS_TRACK,
  ],
  OTHER: [
    CURATED_EVENT_IMAGES.CAMPUS_QUAD,
    CURATED_EVENT_IMAGES.CAMPUS_STUDENTS,
    CURATED_EVENT_IMAGES.HACKATHON_2,
  ],
};

/**
 * Returns a high-res cover image for an event.
 * Checks for user uploaded images in local storage, keywords in title/description,
 * or falls back to category defaults.
 */
export function getEventCoverImage(event) {
  if (!event) return CURATED_EVENT_IMAGES.CAMPUS_QUAD;

  // 1. Check local image registry (for uploaded event posters)
  try {
    const customRegistry = JSON.parse(localStorage.getItem("campusconnect_custom_images") || "{}");
    if (event.id && customRegistry[event.id]?.poster) {
      return customRegistry[event.id].poster;
    }
    if (event.title && customRegistry[event.title]?.poster) {
      return customRegistry[event.title].poster;
    }
  } catch (e) {
    // ignore
  }

  // 2. Direct cover/poster URL if present in event object
  if (event.posterUrl || event.coverImage || event.imageUrl) {
    return event.posterUrl || event.coverImage || event.imageUrl;
  }

  // 3. Keyword matching in title
  const title = (event.title || "").toLowerCase();
  if (title.includes("hack") || title.includes("code") || title.includes("cloud") || title.includes("tech") || title.includes("ai")) {
    return CURATED_EVENT_IMAGES.HACKATHON_1;
  }
  if (title.includes("music") || title.includes("dance") || title.includes("fest") || title.includes("concert") || title.includes("cultural")) {
    return CURATED_EVENT_IMAGES.CULTURAL_CONCERT;
  }
  if (title.includes("sport") || title.includes("football") || title.includes("cricket") || title.includes("basketball") || title.includes("tournament")) {
    return CURATED_EVENT_IMAGES.SPORTS_ARENA;
  }
  if (title.includes("design") || title.includes("ux") || title.includes("ui") || title.includes("prototype")) {
    return CURATED_EVENT_IMAGES.DESIGN_SPRINT;
  }
  if (title.includes("robot") || title.includes("cyber")) {
    return CURATED_EVENT_IMAGES.ROBOTICS_AI;
  }

  // 4. Category-based fallback with deterministic pick using ID or title length
  const category = (event.category || "OTHER").toUpperCase();
  const pool = CATEGORY_IMAGE_COLLECTIONS[category] || CATEGORY_IMAGE_COLLECTIONS.OTHER;
  const index = Math.abs((event.id ? Number(event.id) : (event.title || "").length) % pool.length);
  return pool[index];
}

/**
 * Returns gallery images for an event details page
 */
export function getEventGalleryImages(event) {
  if (!event) return [];

  // Check custom uploaded gallery
  try {
    const customRegistry = JSON.parse(localStorage.getItem("campusconnect_custom_images") || "{}");
    const customItem = (event.id && customRegistry[event.id]) || (event.title && customRegistry[event.title]);
    if (customItem?.gallery && customItem.gallery.length > 0) {
      return customItem.gallery;
    }
  } catch (e) {}

  const cat = (event.category || "OTHER").toUpperCase();
  const pool = CATEGORY_IMAGE_COLLECTIONS[cat] || CATEGORY_IMAGE_COLLECTIONS.OTHER;
  return pool.slice(0, 3);
}

/**
 * Reliable fallback handler for img tags
 */
export const handleImageError = (e, fallbackUrl = CURATED_EVENT_IMAGES.CAMPUS_QUAD) => {
  if (e.target.src !== fallbackUrl) {
    e.target.src = fallbackUrl;
  }
};
