/**
 * Content script - runs on job posting pages
 * Extracts job data using modular extractors
 */

import { extract } from './extractors/extractors.js';

// Listen for extraction requests from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    try {
      const jobData = extract();
      sendResponse({ success: true, data: jobData });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep channel open for async response
});
