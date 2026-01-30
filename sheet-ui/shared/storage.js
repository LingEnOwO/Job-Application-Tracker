/**
 * Storage layer for Job Application Tracker
 * Works with both chrome.storage.local (extension) and localStorage (web UI)
 */

import { generateUUID, getTodayISO } from './utils.js';

const STORAGE_KEY = 'jobApplications';
const SCHEMA_KEY = 'customSchema';

/**
 * Detect if we're in a Chrome extension context
 * @returns {boolean}
 */
function isChromeExtension() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

/**
 * Get data from storage
 * @returns {Promise<Object>}
 */
async function getFromStorage(key) {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || {});
      });
    });
  } else {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  }
}

/**
 * Set data in storage
 * @param {string} key 
 * @param {*} value 
 * @returns {Promise<void>}
 */
async function setInStorage(key, value) {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * Get all job applications
 * @returns {Promise<Array>}
 */
export async function getAllApplications() {
  const data = await getFromStorage(STORAGE_KEY);
  return Object.values(data);
}

/**
 * Get a single application by ID
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export async function getApplication(id) {
  const data = await getFromStorage(STORAGE_KEY);
  return data[id] || null;
}

/**
 * Create a new job application
 * @param {Object} application 
 * @returns {Promise<Object>} Created application with ID
 */
export async function createApplication(application) {
  const id = generateUUID();
  const newApp = {
    id,
    company: application.company || '',
    position: application.position || '',
    jobUrl: application.jobUrl || '',
    applyDate: application.applyDate || getTodayISO(),
    stage: application.stage || 'Applied',
    jobId: application.jobId || '',
    responseDate: application.responseDate || '',
    resumeVersion: application.resumeVersion || '',
    referral: application.referral || false,
    jobDescription: application.jobDescription || '',
    notes: application.notes || '',
    customValues: application.customValues || {}
  };

  const data = await getFromStorage(STORAGE_KEY);
  data[id] = newApp;
  await setInStorage(STORAGE_KEY, data);
  
  return newApp;
}

/**
 * Update an existing application
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Promise<Object|null>}
 */
export async function updateApplication(id, updates) {
  const data = await getFromStorage(STORAGE_KEY);
  
  if (!data[id]) {
    return null;
  }

  data[id] = { ...data[id], ...updates };
  await setInStorage(STORAGE_KEY, data);
  
  return data[id];
}

/**
 * Delete an application
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export async function deleteApplication(id) {
  const data = await getFromStorage(STORAGE_KEY);
  
  if (!data[id]) {
    return false;
  }

  delete data[id];
  await setInStorage(STORAGE_KEY, data);
  
  return true;
}

/**
 * Get custom schema
 * @returns {Promise<Array>}
 */
export async function getCustomSchema() {
  const schema = await getFromStorage(SCHEMA_KEY);
  return Array.isArray(schema) ? schema : [];
}

/**
 * Update custom schema
 * @param {Array} schema 
 * @returns {Promise<void>}
 */
export async function updateCustomSchema(schema) {
  await setInStorage(SCHEMA_KEY, schema);
}

/**
 * Export all data as JSON
 * @returns {Promise<Object>}
 */
export async function exportData() {
  const applications = await getFromStorage(STORAGE_KEY);
  const schema = await getCustomSchema();
  
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    applications,
    customSchema: schema
  };
}

/**
 * Import data from JSON
 * @param {Object} data 
 * @returns {Promise<void>}
 */
export async function importData(data) {
  if (!data || !data.applications) {
    throw new Error('Invalid import data format');
  }

  await setInStorage(STORAGE_KEY, data.applications);
  
  if (data.customSchema) {
    await updateCustomSchema(data.customSchema);
  }
}

/**
 * Clear all data (for testing)
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  await setInStorage(STORAGE_KEY, {});
  await setInStorage(SCHEMA_KEY, []);
}
