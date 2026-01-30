/**
 * Greenhouse ATS extractor
 */

export function detectGreenhouse() {
  return window.location.hostname.includes('greenhouse.io') ||
         document.querySelector('.app-title') !== null ||
         document.querySelector('#application_form') !== null;
}

export function extractFromGreenhouse() {
  const data = {};

  // Company name - often in header or meta tags
  const companyMeta = document.querySelector('meta[property="og:site_name"]');
  if (companyMeta) {
    data.company = companyMeta.content;
  } else {
    // Try to extract from page title or header
    const header = document.querySelector('.company-name, .header-company-name');
    if (header) {
      data.company = header.textContent.trim();
    }
  }

  // Job title
  const titleEl = document.querySelector('.app-title, h1.app-title, [data-qa="job-title"]');
  if (titleEl) {
    data.position = titleEl.textContent.trim();
  }

  // Location
  const locationEl = document.querySelector('.location, .app-location');
  if (locationEl) {
    data.location = locationEl.textContent.trim();
  }

  // Job description
  const descEl = document.querySelector('#content, .content, .job-description');
  if (descEl) {
    data.jobDescription = descEl.textContent.trim();
  }

  // Job ID - sometimes in URL or data attributes
  const jobIdMatch = window.location.pathname.match(/\/jobs\/(\d+)/);
  if (jobIdMatch) {
    data.jobId = jobIdMatch[1];
  }

  return data;
}
