/**
 * Shared utility functions for Job Application Tracker
 */

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Format date to ISO string (YYYY-MM-DD) in local timezone
 * @param {Date} date 
 * @returns {string}
 */
export function formatDateToISO(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as ISO string in local timezone
 * @returns {string}
 */
export function getTodayISO() {
  return formatDateToISO(new Date());
}

/**
 * Parse ISO date string to Date object
 * @param {string} isoString 
 * @returns {Date|null}
 */
export function parseISODate(isoString) {
  if (!isoString) return null;
  return new Date(isoString);
}

/**
 * Format date for display (e.g., "Jan 29, 2026")
 * @param {string} isoString 
 * @returns {string}
 */
export function formatDateForDisplay(isoString) {
  if (!isoString) return '';
  const date = parseISODate(isoString);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Sanitize text by removing extra whitespace
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeText(text) {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Validate URL
 * @param {string} url 
 * @returns {boolean}
 */
export function isValidURL(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 * @param {string} url 
 * @returns {string}
 */
export function extractDomain(url) {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}
