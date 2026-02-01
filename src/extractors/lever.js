/**
 * Lever ATS extractor
 */

export function detectLever() {
  return window.location.hostname.includes('lever.co') ||
         document.querySelector('[data-qa="posting-name"]') !== null ||
         document.querySelector('.posting') !== null;
}

export function extractFromLever() {
  const data = {};

  // Company name - try JSON-LD schema first (most reliable)
  try {
    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    if (jsonLdScript) {
      const jsonData = JSON.parse(jsonLdScript.textContent);
      if (jsonData.hiringOrganization && jsonData.hiringOrganization.name) {
        data.company = jsonData.hiringOrganization.name;
      }
    }
  } catch (e) {
    // JSON parsing failed, continue to fallback
  }

  // Fallback: og:site_name meta tag
  if (!data.company) {
    const companyMeta = document.querySelector('meta[property="og:site_name"]');
    if (companyMeta) {
      data.company = companyMeta.content;
    }
  }

  // Fallback: extract from page title (e.g., "Job Application for X at Company")
  if (!data.company && document.title) {
    const atMatch = document.title.match(/\bat\s+(.+)$/);
    if (atMatch) {
      data.company = atMatch[1].trim();
    }
  }

  // Fallback: header elements
  if (!data.company) {
    const companyEl = document.querySelector('.main-header-text-logo, .company-name');
    if (companyEl) {
      data.company = companyEl.textContent.trim();
    }
  }


  // Job title
  const titleEl = document.querySelector('[data-qa="posting-name"], .posting-headline h2');
  if (titleEl) {
    data.position = titleEl.textContent.trim();
  }

  // Location
  const locationEl = document.querySelector('.posting-categories .location, [data-qa="posting-location"]');
  if (locationEl) {
    data.location = locationEl.textContent.trim();
  }

  // Job description
  const descEl = document.querySelector('.section-wrapper, .posting-description');
  if (descEl) {
    data.jobDescription = descEl.textContent.trim();
  }

  // Job ID from URL
  const jobIdMatch = window.location.pathname.match(/\/([a-f0-9-]+)$/);
  if (jobIdMatch) {
    data.jobId = jobIdMatch[1];
  }

  return data;
}
