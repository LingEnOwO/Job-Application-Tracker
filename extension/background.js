/**
 * Background service worker for Job Application Tracker extension
 */

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for messages from content script or side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobData') {
    // Inject content script to extract job data
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['content.js']
    }).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});
