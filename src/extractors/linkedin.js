/**
 * LinkedIn ATS extractor
 */

const MIN_DESCRIPTION_LENGTH = 100;

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
 * Strip LinkedIn's title chrome: an unread-message prefix and the
 * " | Company | LinkedIn" suffix.
 * "(3) Robotics QA / QC Engineer | FieldAI | LinkedIn"
 *   -> { position: "Robotics QA / QC Engineer", company: "FieldAI" }
 * @returns {{position?: string, company?: string}}
 */
function parseDocumentTitle() {
  const raw = (document.title || "").replace(/^\(\d+\)\s*/, "").trim();
  if (!raw) return {};

  const parts = raw
    .split("|")
    .map((p) => p.trim())
    .filter((p) => p && p.toLowerCase() !== "linkedin");
  if (parts.length === 0) return {};

  const result = {};
  const position = parts[0];
  // Guard against navigation titles ("Jobs", "Search Jobs", "Feed")
  if (position.length > 3 && !/^(jobs|search|feed|my items)\b/i.test(position)) {
    result.position = position;
  }
  if (parts[1]) result.company = parts[1];
  return result;
}

/**
 * Job posting ID for the currently displayed job.
 * On the search results page the URL's currentJobId is authoritative — it
 * changes as the user clicks through cards, while embedded page data does not.
 * @returns {string|null}
 */
function getJobId() {
  const currentJobId = new URLSearchParams(window.location.search).get(
    "currentJobId",
  );
  if (currentJobId && /^\d+$/.test(currentJobId)) return currentJobId;

  // /jobs/view/4416960455 or /jobs/view/robotics-qa-engineer-at-fieldai-4416960455
  const pathMatch = window.location.pathname.match(/\/jobs\/view\/(?:.*?-)?(\d+)/);
  if (pathMatch) return pathMatch[1];

  const cardWithId = document.querySelector("[data-job-id]");
  const domId = cardWithId?.getAttribute("data-job-id");
  if (domId && /^\d+$/.test(domId)) return domId;

  return null;
}

/**
 * Convert a detached HTML node to readable text. innerText is unavailable on
 * DOMParser output (no layout), so block boundaries are inserted by hand.
 * @param {Element} node
 * @returns {string}
 */
function htmlNodeToText(node) {
  const clone = node.cloneNode(true);
  for (const br of clone.querySelectorAll("br")) {
    br.replaceWith("\n");
  }
  for (const block of clone.querySelectorAll("p, li, div, h1, h2, h3, h4, ul, ol")) {
    block.append("\n");
  }
  return cleanDescription(clone.textContent || "");
}

function cleanDescription(text) {
  return text
    .replace(/\r/g, "")
    .replace(/\b(Show more|Show less)\b/gi, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Read the job title/company that LinkedIn's server-driven UI embeds in
 * <script id="rehydrate-data">. The payload is a JSON-encoded React Flight
 * stream, so keys appear as \"jobTitle\":\"...\" — quotes may be backslashed.
 *
 * Only the object matching the current job ID is trusted: the script holds the
 * job that was selected on page load, which goes stale once the SPA navigates.
 * @param {string|null} jobId
 * @returns {{position?: string, company?: string}}
 */
function extractFromRehydrationData(jobId) {
  if (!jobId) return {};

  const script = document.getElementById("rehydrate-data");
  const text = script?.textContent;
  if (!text) return {};

  const field = (chunk, key) => {
    const match = chunk.match(new RegExp(`\\\\?"${key}\\\\?"\\s*:\\s*\\\\?"([^"\\\\]+)`));
    return match ? match[1].trim() : null;
  };

  const anchor = new RegExp(`\\\\?"jobId\\\\?"\\s*:\\s*\\\\?"${jobId}\\\\?"`, "g");
  let match;
  while ((match = anchor.exec(text)) !== null) {
    // jobId, companyName and jobTitle sit in the same payload object
    const chunk = text.slice(match.index, match.index + 6000);
    const position = field(chunk, "jobTitle");
    const company = field(chunk, "companyName");
    if (position || company) {
      const result = {};
      if (position) result.position = position;
      if (company) result.company = company;
      return result;
    }
  }

  return {};
}

/**
 * Legacy bootstrap data: the pre-2026 LinkedIn UI embedded server-side API
 * responses as JSON inside <code> tags. Kept for pages still served that UI.
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

/**
 * Description from the rendered page. The current UI ships hashed class names,
 * so the "About the job" heading is used as an anchor once the known selectors
 * miss.
 * @returns {string|null}
 */
function extractDescriptionFromDom() {
  const descSelectors = [
    "#job-details",
    ".jobs-description__content",
    ".jobs-description-content__text",
    ".jobs-box__html-content",
    ".show-more-less-html__markup",
    ".description__text",
    ".jobs-description",
  ];

  for (const selector of descSelectors) {
    const el = document.querySelector(selector);
    if (!el) continue;
    const text = cleanDescription(el.innerText || el.textContent || "");
    if (text.length >= MIN_DESCRIPTION_LENGTH) return text;
  }

  // Anchor on the section heading and take the surrounding block
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, strong, span, div");
  for (const heading of headings) {
    const label = (heading.textContent || "").trim();
    if (!/^about the job$/i.test(label)) continue;

    let node = heading;
    for (let depth = 0; depth < 4 && node; depth++) {
      const sibling = node.nextElementSibling;
      if (sibling) {
        const text = cleanDescription(sibling.innerText || sibling.textContent || "");
        if (text.length >= MIN_DESCRIPTION_LENGTH) return text;
      }
      node = node.parentElement;
    }
  }

  return null;
}

/**
 * LinkedIn's public guest endpoint returns the full posting as plain HTML.
 * The signed-in UI loads the description lazily and renders it with hashed
 * class names, so this is the dependable source for it.
 * @param {string} jobId
 * @returns {Promise<Object|null>}
 */
async function fetchGuestJobPosting(jobId) {
  try {
    const response = await fetch(
      `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`,
      { credentials: "omit" },
    );
    if (!response.ok) return null;

    const doc = new DOMParser().parseFromString(await response.text(), "text/html");
    const result = {};

    const titleEl = doc.querySelector(".top-card-layout__title, .topcard__title");
    if (titleEl?.textContent.trim()) result.position = titleEl.textContent.trim();

    const companyEl = doc.querySelector(".topcard__org-name-link, .topcard__flavor a");
    if (companyEl?.textContent.trim()) result.company = companyEl.textContent.trim();

    const locationEl = doc.querySelector(".topcard__flavor--bullet");
    if (locationEl?.textContent.trim()) result.location = locationEl.textContent.trim();

    const descEl = doc.querySelector(
      ".show-more-less-html__markup, .description__text",
    );
    if (descEl) {
      const text = htmlNodeToText(descEl);
      if (text.length >= MIN_DESCRIPTION_LENGTH) result.jobDescription = text;
    }

    return result;
  } catch (e) {
    // Offline, rate limited, or the endpoint changed — callers fall back to DOM
    return null;
  }
}

function fillMissing(data, source) {
  if (!source) return;
  for (const key of ["position", "company", "location", "jobDescription"]) {
    if (!data[key] && source[key]) data[key] = source[key];
  }
}

export async function extractFromLinkedIn() {
  const data = {};
  const jobId = getJobId();

  // --- Company ---
  const companySelectors = [
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name",
    ".topcard__org-name-link",
  ];
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent.trim()) {
      data.company = el.textContent.trim();
      break;
    }
  }

  // --- Position ---
  // h1 works on /jobs/view/ pages; on the search results page the page h1 is
  // "Search all jobs", so only use it if it doesn't look like a nav heading
  const h1 = document.querySelector("h1");
  if (h1) {
    const text = h1.textContent.trim();
    if (!text.toLowerCase().includes("search") && text.length > 3) {
      const link = h1.querySelector("a");
      data.position = (link ? link.textContent : text).trim();
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
      if (el?.textContent.trim()) {
        data.position = el.textContent.trim();
        break;
      }
    }
  }

  // --- Description ---
  const domDescription = extractDescriptionFromDom();
  if (domDescription) data.jobDescription = domDescription;

  // --- Embedded page data (current server-driven UI) ---
  fillMissing(data, extractFromRehydrationData(jobId));

  // --- Legacy bootstrap data (pre-2026 UI) ---
  if (!data.position || !data.company || !data.jobDescription) {
    fillMissing(data, extractFromBootstrap());
  }

  // --- Guest API ---
  // Reliably carries the description, which the signed-in UI loads lazily
  if (jobId && (!data.position || !data.company || !data.jobDescription)) {
    fillMissing(data, await fetchGuestJobPosting(jobId));
  }

  // --- Page title ---
  // "Position | Company | LinkedIn"; last resort so a stale SPA title never
  // wins over live page data
  fillMissing(data, parseDocumentTitle());

  return data;
}
