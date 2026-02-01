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
