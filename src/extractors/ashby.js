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

  // Fallback: extract from URL path for jobs.ashbyhq.com
  if (!data.company) {
    const hostname = window.location.hostname;
    if (hostname === 'jobs.ashbyhq.com') {
      // Extract from /company-name/job-id
      const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
      if (pathMatch) {
        // Convert "develop-health" to "Develop Health"
        data.company = pathMatch[1].split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
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

  // Job description - try meta description first (cleaner)
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && metaDesc.content) {
    data.jobDescription = metaDesc.content.trim();
  } else {
    // Fallback to DOM element
    const descEl = document.querySelector('[data-testid="job-description"], .job-description');
    if (descEl) {
      data.jobDescription = descEl.textContent.trim();
    }
  }

  // Job ID from URL
  const jobIdMatch = window.location.pathname.match(/\/([a-f0-9-]+)$/);
  if (jobIdMatch) {
    data.jobId = jobIdMatch[1];
  }

  return data;
}
