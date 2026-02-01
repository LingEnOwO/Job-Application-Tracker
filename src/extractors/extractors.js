/**
 * Main extractor orchestrator
 * Coordinates ATS-specific extractors and fallback logic
 */

import { detectGreenhouse, extractFromGreenhouse } from './greenhouse.js';
import { detectLever, extractFromLever } from './lever.js';
import { detectAshby, extractFromAshby } from './ashby.js';
import { detectWorkday, extractFromWorkday } from './workday.js';

/**
 * Extract job URL (always available)
 * @returns {string}
 */
function extractJobUrl() {
  return window.location.href;
}

/**
 * Extract metadata from page (title, meta tags, JSON-LD)
 * @returns {Object}
 */
function extractMetadata() {
  const data = {};

  // Try Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');

  if (ogTitle) data.position = ogTitle.content;
  if (ogSiteName) data.company = ogSiteName.content;
  if (ogDescription) data.jobDescription = ogDescription.content;

  // Try Twitter tags
  if (!data.position) {
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) data.position = twitterTitle.content;
  }

  // Try page title
  if (!data.position && document.title) {
    data.position = document.title;
  }

  // Try JSON-LD structured data
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const jsonData = JSON.parse(script.textContent);
      if (jsonData['@type'] === 'JobPosting') {
        if (jsonData.title) data.position = jsonData.title;
        if (jsonData.hiringOrganization?.name) data.company = jsonData.hiringOrganization.name;
        if (jsonData.description) data.jobDescription = jsonData.description;
        if (jsonData.jobLocation?.address?.addressLocality) {
          data.location = jsonData.jobLocation.address.addressLocality;
        }
        break;
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }

  return data;
}

/**
 * Detect which ATS is being used
 * @returns {string|null} ATS name or null
 */
function detectATS() {
  if (detectGreenhouse()) return 'greenhouse';
  if (detectLever()) return 'lever';
  if (detectAshby()) return 'ashby';
  if (detectWorkday()) return 'workday';
  return null;
}

/**
 * Extract from detected ATS
 * @param {string} ats 
 * @returns {Object}
 */
function extractFromATS(ats) {
  switch (ats) {
    case 'greenhouse':
      return extractFromGreenhouse();
    case 'lever':
      return extractFromLever();
    case 'ashby':
      return extractFromAshby();
    case 'workday':
      return extractFromWorkday();
    default:
      return {};
  }
}

/**
 * Fallback extraction from main content
 * @returns {Object}
 */
function extractFallback() {
  const data = {};

  // Try to find job title - check page title first (more reliable than h1)
  if (document.title) {
    // Many sites use format: "Job Title - Company" or "Job Title | Company"
    // Extract the first part before common separators
    const titleParts = document.title.split(/[-|@]/);
    if (titleParts.length > 0) {
      const potentialTitle = titleParts[0].trim();
      // Only use if it's not too short (avoid single words like "Jobs")
      if (potentialTitle.length > 3) {
        data.position = potentialTitle;
      }
    }
  }

  // Fallback to h1 if page title didn't work
  if (!data.position) {
    const h1 = document.querySelector('h1');
    if (h1) {
      data.position = h1.textContent.trim();
    }
  }

  // Try to find company name in common locations
  const companySelectors = [
    '.company-name',
    '.employer-name',
    '[itemprop="hiringOrganization"]',
    '.company'
  ];

  for (const selector of companySelectors) {
    const el = document.querySelector(selector);
    if (el) {
      data.company = el.textContent.trim();
      break;
    }
  }

  // Try to get main content for job description
  const mainContent = document.querySelector('main, article, .job-description, .description');
  if (mainContent) {
    data.jobDescription = mainContent.textContent.trim();
  }

  return data;
}

/**
 * Main extraction function
 * @returns {Object} Extracted job data
 */
export function extract() {
  // Get today's date in local timezone
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const applyDate = `${year}-${month}-${day}`;
  
  const data = {
    jobUrl: extractJobUrl(),
    applyDate: applyDate
  };

  // Try metadata extraction first
  const metadata = extractMetadata();
  Object.assign(data, metadata);

  // Try ATS-specific extraction
  const ats = detectATS();
  if (ats) {
    const atsData = extractFromATS(ats);
    Object.assign(data, atsData);
    data.atsDetected = ats;
  } else {
    // Fallback extraction
    const fallbackData = extractFallback();
    Object.assign(data, fallbackData);
  }

  // Clean up the data
  if (data.position) {
    data.position = data.position.trim();
  }
  if (data.company) {
    data.company = data.company.trim();
  }
  if (data.jobDescription) {
    // Limit job description length to avoid storage issues
    data.jobDescription = data.jobDescription.substring(0, 10000).trim();
  }

  return data;
}
