/**
 * LinkedIn ATS extractor
 */

export function detectLinkedIn() {
  return (
    window.location.hostname.includes("linkedin.com") &&
    (window.location.pathname.includes("/jobs/view/") ||
      window.location.pathname.includes("/jobs/search/") ||
      window.location.pathname.startsWith("/jobs/") ||
      document.querySelector("#job-details") !== null)
  );
}

/**
 * Extract job data from LinkedIn's bootstrap data embedded in <code> tags.
 * LinkedIn embeds server-side API responses in the HTML as JSON inside <code>
 * elements before any client-side rendering. This is always present and doesn't
 * depend on the SPA having finished rendering the DOM.
 */
function extractFromBootstrap() {
  const codeTags = document.querySelectorAll("code");

  for (const codeTag of codeTags) {
    try {
      const text = codeTag.textContent;
      // Only bother parsing tags that contain job posting card data
      if (!text.includes("JobPostingCard")) continue;

      const json = JSON.parse(text);
      const included = json.included;
      if (!Array.isArray(included)) continue;

      const result = {};

      for (const item of included) {
        const type = item.$type || "";

        // JobPostingCard has the title and the "Company · Location" subtitle
        if (type.includes("jobs.JobPostingCard")) {
          if (item.title?.text) {
            result.position = item.title.text.trim();
          }
          if (item.navigationBarSubtitle) {
            const parts = item.navigationBarSubtitle.split(" · ");
            if (parts[0]) result.company = parts[0].trim();
            if (parts[1]) result.location = parts[1].trim();
          }
        }

        // JobPosting (non-card) has the full description
        if (
          type.includes("jobs.JobPosting") &&
          !type.includes("Card") &&
          item.description?.text
        ) {
          result.jobDescription = item.description.text.trim();
        }
      }

      if (result.position || result.company) {
        return result;
      }
    } catch (e) {
      // Skip non-JSON or malformed code tags
    }
  }

  return null;
}

export function extractFromLinkedIn() {
  const data = {};

  // --- Company ---
  // Try specific class selectors first (precise, not affected by search list)
  const companySelectors = [
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name",
    ".topcard__org-name-link",
  ];
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el) {
      data.company = el.textContent.trim();
      break;
    }
  }

  // Fallback: first /company/ link (unreliable on SRP — may be from search list)
  if (!data.company) {
    const companyLink = document.querySelector('a[href*="/company/"]');
    if (companyLink) data.company = companyLink.textContent.trim();
  }

  // --- Position ---
  // h1 works on /jobs/view/ pages; on the SRP the page h1 is "Search all jobs"
  // so only use h1 if it doesn't look like a navigation heading
  const h1 = document.querySelector("h1");
  if (h1) {
    const text = h1.textContent.trim();
    if (!text.toLowerCase().includes("search") && text.length > 3) {
      const link = h1.querySelector("a");
      data.position = link ? link.textContent.trim() : text;
    }
  }

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

  // --- Description ---
  let descEl = document.querySelector("#job-details");
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
    let descText = descEl.innerText || descEl.textContent || "";
    descText = descText
      .trim()
      .replace(/\b(Show more|Show less)\b/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[^\S\n]+/g, " ")
      .trim();
    if (descText) data.jobDescription = descText;
  }

  // --- Bootstrap data fallback ---
  // If the SPA hasn't rendered the job detail panel yet (common on SRP),
  // fall back to LinkedIn's server-side bootstrap data in <code> tags.
  if (!data.position || !data.company || !data.jobDescription) {
    const bootstrap = extractFromBootstrap();
    if (bootstrap) {
      if (!data.position && bootstrap.position) data.position = bootstrap.position;
      if (!data.company && bootstrap.company) data.company = bootstrap.company;
      if (!data.location && bootstrap.location) data.location = bootstrap.location;
      if (!data.jobDescription && bootstrap.jobDescription)
        data.jobDescription = bootstrap.jobDescription;
    }
  }

  return data;
}
