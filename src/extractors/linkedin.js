/**
 * LinkedIn ATS extractor
 */

export function detectLinkedIn() {
  return (
    window.location.hostname.includes("linkedin.com") &&
    (window.location.pathname.includes("/jobs/view/") ||
      document.querySelector("#job-details") !== null)
  );
}

export function extractFromLinkedIn() {
  const data = {};

  // Company name - look for anchor with /company/ in href near job header
  const companyLink = document.querySelector('a[href*="/company/"]');
  if (companyLink) {
    data.company = companyLink.textContent.trim();
  }

  // Fallback: LinkedIn company name selector
  if (!data.company) {
    const companyEl = document.querySelector(
      ".job-details-jobs-unified-top-card__company-name",
    );
    if (companyEl) {
      data.company = companyEl.textContent.trim();
    }
  }

  // Job title - look for h1 first
  const titleEl = document.querySelector("h1");
  if (titleEl) {
    // If h1 contains an anchor, extract from that
    const titleLink = titleEl.querySelector("a");
    data.position = titleLink
      ? titleLink.textContent.trim()
      : titleEl.textContent.trim();
  }

  // Fallback: try common LinkedIn title selectors
  if (!data.position) {
    const titleSelectors = [
      ".job-details-jobs-unified-top-card__job-title",
      ".topcard__title",
      ".jobs-unified-top-card__job-title",
    ];

    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.position = el.textContent.trim();
        break;
      }
    }
  }

  // Last resort fallback: parse from page title (format: "Job Title - Company | LinkedIn")
  if (!data.position && document.title) {
    const titleParts = document.title.split(/[-|]/);
    if (titleParts.length > 0) {
      const potentialTitle = titleParts[0].trim();
      if (
        potentialTitle &&
        !potentialTitle.toLowerCase().includes("linkedin")
      ) {
        data.position = potentialTitle;
      }
    }
  }

  // Job description - target the main description container
  let descEl = document.querySelector("#job-details");

  // Fallback: try other common LinkedIn description containers
  if (!descEl) {
    const descSelectors = [
      ".jobs-description-content__text",
      ".jobs-box__html-content",
      ".description__text",
      ".jobs-description",
    ];

    for (const selector of descSelectors) {
      descEl = document.querySelector(selector);
      if (descEl) break;
    }
  }

  if (descEl) {
    // Extract text using innerText (better whitespace handling than textContent)
    let descText = descEl.innerText || descEl.textContent || "";

    // Clean up the description
    descText = descText
      .trim()
      // Remove "Show more" / "Show less" buttons if present
      .replace(/\b(Show more|Show less)\b/gi, "")
      // Collapse multiple blank lines into max 2 newlines
      .replace(/\n{3,}/g, "\n\n")
      // Normalize whitespace within lines
      .replace(/[^\S\n]+/g, " ")
      .trim();

    if (descText) {
      data.jobDescription = descText;
    }
  }

  // Note: LinkedIn does not expose stable job IDs in the DOM
  // Job ID would need to be parsed from URL if needed in the future

  return data;
}
