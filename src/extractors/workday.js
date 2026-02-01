/**
 * Workday ATS extractor
 */

export function detectWorkday() {
  return window.location.hostname.includes('myworkdayjobs.com') ||
         document.querySelector('[data-automation-id="jobPostingHeader"]') !== null ||
         document.querySelector('.jobProperty') !== null;
}

export function extractFromWorkday() {
  const data = {};

  // Company name - usually in URL or header
  const hostname = window.location.hostname;
  const companyMatch = hostname.match(/([^.]+)\.myworkdayjobs\.com/);
  if (companyMatch) {
    data.company = companyMatch[1].charAt(0).toUpperCase() + companyMatch[1].slice(1);
  }

  // Job title
  const titleEl = document.querySelector('h2[data-automation-id="jobPostingHeader"], .jobPostingHeader h2');
  if (titleEl) {
    data.position = titleEl.textContent.trim();
  }

  // Location
  const locationEl = document.querySelector('[data-automation-id="locations"], .jobProperty.location');
  if (locationEl) {
    data.location = locationEl.textContent.trim();
  }

  // Job description
  const descEl = document.querySelector('[data-automation-id="jobPostingDescription"], .jobDescription');
  if (descEl) {
    data.jobDescription = descEl.textContent.trim();
  }

  // Job ID
  const jobIdEl = document.querySelector('[data-automation-id="requisitionId"]');
  if (jobIdEl) {
    data.jobId = jobIdEl.textContent.trim();
  }

  return data;
}
