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

  // Company name
  const companyMeta = document.querySelector('meta[property="og:site_name"]');
  if (companyMeta) {
    data.company = companyMeta.content;
  } else {
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
