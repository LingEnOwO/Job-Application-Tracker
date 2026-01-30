/**
 * Content script - runs on job posting pages
 * Extracts job data and sends to side panel
 * 
 * Note: This file is injected inline, so extraction logic is embedded here
 */

// Listen for extraction requests from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    try {
      const jobData = extractJobData();
      sendResponse({ success: true, data: jobData });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep channel open for async response
});

/**
 * Main extraction function
 */
function extractJobData() {
  // Get today's date in local timezone
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const applyDate = `${year}-${month}-${day}`;
  
  const data = {
    jobUrl: window.location.href,
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
  if (data.position) data.position = data.position.trim();
  if (data.company) data.company = data.company.trim();
  if (data.jobDescription) {
    data.jobDescription = data.jobDescription.substring(0, 10000).trim();
  }

  return data;
}

/**
 * Extract metadata from page
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
 * Greenhouse detection and extraction
 */
function detectGreenhouse() {
  return window.location.hostname.includes('greenhouse.io') ||
         document.querySelector('.app-title') !== null ||
         document.querySelector('#application_form') !== null;
}

function extractFromGreenhouse() {
  const data = {};

  const companyMeta = document.querySelector('meta[property="og:site_name"]');
  if (companyMeta) {
    data.company = companyMeta.content;
  } else {
    const header = document.querySelector('.company-name, .header-company-name');
    if (header) data.company = header.textContent.trim();
  }

  const titleEl = document.querySelector('.app-title, h1.app-title, [data-qa="job-title"]');
  if (titleEl) data.position = titleEl.textContent.trim();

  const locationEl = document.querySelector('.location, .app-location');
  if (locationEl) data.location = locationEl.textContent.trim();

  const descEl = document.querySelector('#content, .content, .job-description');
  if (descEl) data.jobDescription = descEl.textContent.trim();

  const jobIdMatch = window.location.pathname.match(/\/jobs\/(\d+)/);
  if (jobIdMatch) data.jobId = jobIdMatch[1];

  return data;
}

/**
 * Lever detection and extraction
 */
function detectLever() {
  return window.location.hostname.includes('lever.co') ||
         document.querySelector('[data-qa="posting-name"]') !== null ||
         document.querySelector('.posting') !== null;
}

function extractFromLever() {
  const data = {};

  const companyMeta = document.querySelector('meta[property="og:site_name"]');
  if (companyMeta) {
    data.company = companyMeta.content;
  } else {
    const companyEl = document.querySelector('.main-header-text-logo, .company-name');
    if (companyEl) data.company = companyEl.textContent.trim();
  }

  const titleEl = document.querySelector('[data-qa="posting-name"], .posting-headline h2');
  if (titleEl) data.position = titleEl.textContent.trim();

  const locationEl = document.querySelector('.posting-categories .location, [data-qa="posting-location"]');
  if (locationEl) data.location = locationEl.textContent.trim();

  const descEl = document.querySelector('.section-wrapper, .posting-description');
  if (descEl) data.jobDescription = descEl.textContent.trim();

  const jobIdMatch = window.location.pathname.match(/\/([a-f0-9-]+)$/);
  if (jobIdMatch) data.jobId = jobIdMatch[1];

  return data;
}

/**
 * Ashby detection and extraction
 */
function detectAshby() {
  return window.location.hostname.includes('ashbyhq.com') ||
         document.querySelector('[data-testid="job-title"]') !== null ||
         document.querySelector('.ashby-job-posting') !== null;
}

function extractFromAshby() {
  const data = {};

  const companyMeta = document.querySelector('meta[property="og:site_name"]');
  if (companyMeta) {
    data.company = companyMeta.content;
  } else {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 0) {
      data.company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  }

  const titleEl = document.querySelector('[data-testid="job-title"], h1');
  if (titleEl) data.position = titleEl.textContent.trim();

  const locationEl = document.querySelector('[data-testid="job-location"]');
  if (locationEl) data.location = locationEl.textContent.trim();

  const descEl = document.querySelector('[data-testid="job-description"], .job-description');
  if (descEl) data.jobDescription = descEl.textContent.trim();

  const jobIdMatch = window.location.pathname.match(/\/([a-f0-9-]+)$/);
  if (jobIdMatch) data.jobId = jobIdMatch[1];

  return data;
}

/**
 * Workday detection and extraction
 */
function detectWorkday() {
  return window.location.hostname.includes('myworkdayjobs.com') ||
         document.querySelector('[data-automation-id="jobPostingHeader"]') !== null ||
         document.querySelector('.jobProperty') !== null;
}

function extractFromWorkday() {
  const data = {};

  const hostname = window.location.hostname;
  const companyMatch = hostname.match(/([^.]+)\.myworkdayjobs\.com/);
  if (companyMatch) {
    data.company = companyMatch[1].charAt(0).toUpperCase() + companyMatch[1].slice(1);
  }

  const titleEl = document.querySelector('h2[data-automation-id="jobPostingHeader"], .jobPostingHeader h2');
  if (titleEl) data.position = titleEl.textContent.trim();

  const locationEl = document.querySelector('[data-automation-id="locations"], .jobProperty.location');
  if (locationEl) data.location = locationEl.textContent.trim();

  const descEl = document.querySelector('[data-automation-id="jobPostingDescription"], .jobDescription');
  if (descEl) data.jobDescription = descEl.textContent.trim();

  const jobIdEl = document.querySelector('[data-automation-id="requisitionId"]');
  if (jobIdEl) data.jobId = jobIdEl.textContent.trim();

  return data;
}

/**
 * Fallback extraction
 */
function extractFallback() {
  const data = {};

  const h1 = document.querySelector('h1');
  if (h1) data.position = h1.textContent.trim();

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

  const mainContent = document.querySelector('main, article, .job-description, .description');
  if (mainContent) {
    data.jobDescription = mainContent.textContent.trim();
  }

  return data;
}
