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
  
  // // Method 2: Back button aria-label
  // if (!companyName) {
  //   const backButton = document.querySelector('.ashby-job-board-back-to-all-jobs-button, [aria-label*="Back to"]');
  //   if (backButton) {
  //     const ariaLabel = backButton.getAttribute('aria-label');
  //     if (ariaLabel) {
  //       // Extract from "Back to [Company]'s Job Listings"
  //       const match = ariaLabel.match(/Back to (.+)'s Job Listings/);
  //       if (match) {
  //         companyName = match[1];
  //       }
  //     }
  //   }
  // }
  
  // // Method 3: Logo image alt text
  // if (!companyName) {
  //   const navImages = document.querySelectorAll('nav img[alt], header img[alt], [class*="nav"] img[alt]');
  //   for (const img of navImages) {
  //     if (img.alt && img.alt.trim()) {
  //       // Prefer images with "wordmark" in class name
  //       if (img.className.toLowerCase().includes('wordmark')) {
  //         companyName = img.alt.trim();
  //         break;
  //       }
  //       if (!companyName) {
  //         companyName = img.alt.trim();
  //       }
  //     }
  //   }
  // }
  
  // // Method 4: URL path (for jobs.ashbyhq.com URLs)
  // if (!companyName) {
  //   const hostname = window.location.hostname;
  //   if (hostname === 'jobs.ashbyhq.com') {
  //     // Extract from /company-name/job-id
  //     const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
  //     if (pathMatch) {
  //       // Convert "develop-health" to "Develop Health"
  //       companyName = pathMatch[1].split('-').map(word => 
  //         word.charAt(0).toUpperCase() + word.slice(1)
  //       ).join(' ');
  //     }
  //   } else {
  //     // For custom domains, use subdomain
  //     const parts = hostname.split('.');
  //     if (parts.length > 0 && parts[0] !== 'jobs') {
  //       companyName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  //     }
  //   }
  // }
  
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
