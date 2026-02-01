/**
 * Lever ATS extractor
 */

export function detectLever() {
  return (
    window.location.hostname.includes("lever.co") ||
    document.querySelector('[data-qa="posting-name"]') !== null ||
    document.querySelector(".posting") !== null
  );
}

export function extractFromLever() {
  const data = {};

  // Company name - try JSON-LD schema first (most reliable)
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
    // JSON parsing failed, continue to fallback
  }

  // Fallback: extract from page title (e.g., "Company - Job Title")
  if (!data.company && document.title) {
    const dashSplit = document.title.split(" - ")[0];
    if (dashSplit) {
      data.company = dashSplit.trim();
    }
  }

  // Job title
  const titleEl = document.querySelector(
    '[data-qa="posting-name"], .posting-headline h2',
  );
  if (titleEl) {
    data.position = titleEl.textContent.trim();
  }

  // Location
  const locationEl = document.querySelector(
    '.posting-categories .location, [data-qa="posting-location"]',
  );
  if (locationEl) {
    data.location = locationEl.textContent.trim();
  }

  // Job description - scope to .content container
  // We want the contiguous range of `.section.page-centered` starting at
  // `[data-qa="job-description"]` and ending right before the final apply section.
  const contentContainer = document.querySelector(".content");
  if (contentContainer) {
    const sections = Array.from(
      contentContainer.querySelectorAll(".section.page-centered"),
    );

    const startIdx = sections.findIndex(
      (el) => el.getAttribute("data-qa") === "job-description",
    );

    if (startIdx !== -1) {
      const descriptionParts = [];

      for (let i = startIdx; i < sections.length; i++) {
        const section = sections[i];
        const qa = section.getAttribute("data-qa") || "";

        // Stop BEFORE the apply CTA section
        if (
          section.classList.contains("last-section-apply") ||
          qa.startsWith("btn-apply") ||
          section.querySelector('[data-qa^="btn-apply"]')
        ) {
          break;
        }

        // Use innerText for nicer formatting (preserves bullet/newline structure better than textContent)
        const text = (section.innerText || section.textContent || "").trim();
        if (text) descriptionParts.push(text);
      }

      if (descriptionParts.length > 0) {
        data.jobDescription = descriptionParts.join("\n\n");
      }
    }
  }

  // Job ID from URL
  const jobIdMatch = window.location.pathname.match(/\/([a-f0-9-]+)$/);
  if (jobIdMatch) {
    data.jobId = jobIdMatch[1];
  }

  return data;
}
