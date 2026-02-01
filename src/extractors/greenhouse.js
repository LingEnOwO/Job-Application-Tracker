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

  // Company name - extract from page title first (e.g., "Job Application for X at Company")
  if (document.title) {
    const atMatch = document.title.match(/\bat\s+(.+)$/);
    if (atMatch) {
      data.company = atMatch[1].trim();
    }
  }

  // Fallback: extract from URL path (e.g., /flexport/jobs/...)
  if (!data.company) {
    const pathname = window.location.pathname;
    // Match /company-name/jobs/... pattern
    const pathMatch = pathname.match(/^\/([^\/]+)\/jobs\//);
    if (pathMatch) {
      // Capitalize first letter
      data.company = pathMatch[1].charAt(0).toUpperCase() + pathMatch[1].slice(1);
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

  // Job description - use filtered DOM extraction
  data.jobDescription = extractGreenhouseJobDescription();

  // Job ID - sometimes in URL or data attributes
  const jobIdMatch = window.location.pathname.match(/\/jobs\/(\d+)/);
  if (jobIdMatch) {
    data.jobId = jobIdMatch[1];
  }

  return data;
}

/**
 * Extract job description from DOM with filtering
 * Removes location headers, application forms, and other contaminating content
 */
function extractGreenhouseJobDescription() {
  // Try narrow selectors first
  const selectors = [
    '#job_description',
    '[data-qa="job-description"]',
    'main.job-post',
    '.job-post-container',
    '#content .job__description',
    '.job-description',
    '#content'
  ];
  
  let descEl = null;
  for (const selector of selectors) {
    descEl = document.querySelector(selector);
    if (descEl) break;
  }
  
  if (!descEl) {
    return '';
  }
  
  // Clone the node to avoid modifying the page
  const clone = descEl.cloneNode(true);
  
  // Remove contaminating elements
  const removeSelectors = [
    '#application',
    'form',
    '.application--container',
    '.application-form',
    '#application_form',
    '.location',
    '.job__location',
    '.app-location',
    'header',
    '.image-container',
    '.logo',
    '.divider',
    '.content-intro',
    '.job-alert',  // Remove "Create a job alert" section
    '.app-title',
    'h1',  // Remove job title
    '.tag-text'  // Remove "New" tags
  ];
  
  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // Remove "Back to jobs" links
  clone.querySelectorAll('a').forEach(link => {
    if (link.textContent.toLowerCase().includes('back to jobs')) {
      link.remove();
    }
  });
  
  // Remove everything after "Apply for this job" headings
  const applyHeadings = Array.from(clone.querySelectorAll('h1, h2, h3, h4, h5, h6, button'));
  for (const heading of applyHeadings) {
    const text = heading.textContent.toLowerCase();
    if (text.includes('apply for this job') || text.includes('apply now') || text === 'apply') {
      // Remove this heading and everything after it
      let current = heading;
      while (current) {
        const next = current.nextSibling;
        current.remove();
        current = next;
      }
      break;
    }
  }
  
  let text = clone.textContent.trim();
  
  // Remove location header if it appears at the start
  // Pattern: "City, State; City, State" or "City, StateApply"
  text = text.replace(/^[A-Z][a-z]+,\s+[A-Z]{2}(;\s+[A-Z][a-z]+,\s+[A-Z]{2})*\s*/, '');
  text = text.replace(/^Apply\s+/, '');
  
  // Sanity check: if text still contains contamination, try harder
  if (text.includes('Apply for this job')) {
    const cutoff = text.indexOf('Apply for this job');
    text = text.substring(0, cutoff).trim();
  }
  
  return text;
}
