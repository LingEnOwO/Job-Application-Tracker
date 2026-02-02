/**
 * Workday ATS extractor
 */

export function detectWorkday() {
  return (
    window.location.hostname.includes("myworkdayjobs.com") ||
    document.querySelector('[data-automation-id="jobPostingHeader"]') !==
      null ||
    document.querySelector(".jobProperty") !== null
  );
}

export function extractFromWorkday() {
  const data = {};

  // Company name - extract from URL first (Workday-specific, most reliable)
  const hostname = window.location.hostname;
  // Extract first subdomain: cvshealth.wd1.myworkdayjobs.com -> cvshealth
  const companyMatch = hostname.match(/^([^.]+)\./);
  if (companyMatch) {
    data.company =
      companyMatch[1].charAt(0).toUpperCase() + companyMatch[1].slice(1);
  }

  // Fallback: JSON-LD schema
  if (!data.company) {
    try {
      const jsonLdScript = document.querySelector(
        'script[type="application/ld+json"]',
      );
      if (jsonLdScript) {
        const jsonData = JSON.parse(jsonLdScript.textContent);
        if (jsonData.hiringOrganization && jsonData.hiringOrganization.name) {
          data.company = jsonData.hiringOrganization.name;
        }
      }
    } catch (e) {
      // JSON parsing failed, continue
    }
  }

  // Job title
  const titleEl = document.querySelector(
    'h2[data-automation-id="jobPostingHeader"], .jobPostingHeader h2',
  );
  if (titleEl) {
    data.position = titleEl.textContent.trim();
  }

  // Location
  const locationEl = document.querySelector(
    '[data-automation-id="locations"], .jobProperty.location',
  );
  if (locationEl) {
    data.location = locationEl.textContent.trim();
  }

  // Job description
  const descEl = document.querySelector(
    '[data-automation-id="jobPostingDescription"], .jobDescription',
  );
  if (descEl) {
    data.jobDescription = descEl.textContent.trim();
  }

  // Job ID
  const jobIdEl = document.querySelector(
    '[data-automation-id="requisitionId"]',
  );
  if (jobIdEl) {
    const idText = jobIdEl.textContent.trim();
    // Extract ID from formats like "job requisition id202601577" or "idJR0026522"
    const match = idText.match(/id(\w+)$/i);
    data.jobId = match ? match[1] : idText;
  }

  return data;
}
