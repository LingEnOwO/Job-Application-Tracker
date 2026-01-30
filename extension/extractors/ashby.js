/**
 * Ashby ATS extractor
 */

export function detectAshby() {
  return window.location.hostname.includes('ashbyhq.com') ||
         document.querySelector('[data-testid="job-title"]') !== null ||
         document.querySelector('.ashby-job-posting') !== null;
}

export function extractFromAshby() {
  const data = {};

  // Company name - often in URL or meta tags
  const companyMeta = document.querySelector('meta[property="og:site_name"]');
  if (companyMeta) {
    data.company = companyMeta.content;
  } else {
    // Try to extract from URL (e.g., jobs.companyname.com or companyname.ashbyhq.com)
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 0) {
      data.company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  }

  // Job title
  const titleEl = document.querySelector('[data-testid="job-title"], h1');
  if (titleEl) {
    data.position = titleEl.textContent.trim();
  }

  // Location
  const locationEl = document.querySelector('[data-testid="job-location"]');
  if (locationEl) {
    data.location = locationEl.textContent.trim();
  }

  // Job description
  const descEl = document.querySelector('[data-testid="job-description"], .job-description');
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
