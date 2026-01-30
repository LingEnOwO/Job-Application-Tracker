/**
 * Side panel logic for review form
 */

import { createApplication } from './lib/storage.js';
import { getTodayISO } from './lib/utils.js';

const form = document.getElementById('jobForm');
const loadingState = document.getElementById('loadingState');
const statusMessage = document.getElementById('statusMessage');
const saveBtn = document.getElementById('saveBtn');
const extractBtn = document.getElementById('extractBtn');

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
}

/**
 * Hide status message
 */
function hideStatus() {
  statusMessage.style.display = 'none';
}

/**
 * Populate form with extracted data
 */
function populateForm(data) {
  if (data.jobUrl) document.getElementById('jobUrl').value = data.jobUrl;
  if (data.company) document.getElementById('company').value = data.company;
  if (data.position) document.getElementById('position').value = data.position;
  if (data.applyDate) document.getElementById('applyDate').value = data.applyDate;
  if (data.stage) document.getElementById('stage').value = data.stage;
  if (data.jobId) document.getElementById('jobId').value = data.jobId;
  if (data.resumeVersion) document.getElementById('resumeVersion').value = data.resumeVersion;
  if (data.referral) document.getElementById('referral').checked = data.referral;
  if (data.jobDescription) document.getElementById('jobDescription').value = data.jobDescription;
  if (data.notes) document.getElementById('notes').value = data.notes;
}

/**
 * Get form data
 */
function getFormData() {
  return {
    jobUrl: document.getElementById('jobUrl').value.trim(),
    company: document.getElementById('company').value.trim(),
    position: document.getElementById('position').value.trim(),
    applyDate: document.getElementById('applyDate').value,
    stage: document.getElementById('stage').value,
    jobId: document.getElementById('jobId').value.trim(),
    resumeVersion: document.getElementById('resumeVersion').value.trim(),
    referral: document.getElementById('referral').checked,
    jobDescription: document.getElementById('jobDescription').value.trim(),
    notes: document.getElementById('notes').value.trim()
  };
}

/**
 * Extract job data from current tab
 */
async function extractJobData() {
  try {
    hideStatus();
    loadingState.style.display = 'block';
    form.style.display = 'none';

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Inject content script and request extraction
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Request extraction
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });

    if (response.success) {
      // Set default apply date to today
      response.data.applyDate = response.data.applyDate || getTodayISO();
      response.data.stage = response.data.stage || 'Applied';
      
      populateForm(response.data);
      loadingState.style.display = 'none';
      form.style.display = 'block';
      
      if (response.data.atsDetected) {
        showStatus(`Detected ${response.data.atsDetected} ATS. Please review extracted data.`, 'info');
      } else {
        showStatus('Data extracted. Please review and edit as needed.', 'info');
      }
    } else {
      throw new Error(response.error || 'Extraction failed');
    }
  } catch (error) {
    console.error('Extraction error:', error);
    loadingState.style.display = 'none';
    form.style.display = 'block';
    
    // Populate with minimal data
    populateForm({
      jobUrl: '',
      applyDate: getTodayISO(),
      stage: 'Applied'
    });
    
    showStatus('Could not auto-extract data. Please fill in manually.', 'error');
  }
}

/**
 * Save job application
 */
async function saveApplication(event) {
  event.preventDefault();
  
  try {
    hideStatus();
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const formData = getFormData();
    
    // Validate required fields
    if (!formData.jobUrl) {
      throw new Error('Job URL is required');
    }
    if (!formData.applyDate) {
      throw new Error('Apply date is required');
    }

    // Save to storage
    await createApplication(formData);
    
    // Update lastUpdated timestamp to trigger auto-refresh in sheet UI
    await chrome.storage.local.set({ lastUpdated: Date.now() });
    
    showStatus('✓ Application saved successfully!', 'success');
    
    // Reset form after short delay
    setTimeout(() => {
      form.reset();
      document.getElementById('applyDate').value = getTodayISO();
      document.getElementById('stage').value = 'Applied';
    }, 1500);
    
  } catch (error) {
    console.error('Save error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Application';
  }
}

// Event listeners
form.addEventListener('submit', saveApplication);
extractBtn.addEventListener('click', extractJobData);

// Auto-extract on load
extractJobData();
