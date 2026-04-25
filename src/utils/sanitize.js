import DOMPurify from 'dompurify';

/**
 * Sanitize a string to prevent XSS.
 * Use on any user-generated content rendered as HTML.
 */
export const sanitize = (dirty) => {
  if (typeof dirty !== 'string') return dirty;
  return DOMPurify.sanitize(dirty.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Sanitize an entire object's string fields (useful before API calls).
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    clean[key] = typeof val === 'string' ? sanitize(val) : val;
  }
  return clean;
};

/**
 * Strip HTML tags from a string (for display, not storage).
 */
export const stripTags = (str = '') =>
  str.replace(/<[^>]*>/g, '').trim();
