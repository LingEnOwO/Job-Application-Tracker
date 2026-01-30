/**
 * Main application logic for Sheet UI
 */

import { getAllApplications, updateApplication, deleteApplication, createApplication } from './shared/storage.js';
import { getTodayISO } from './shared/utils.js';
import { renderTable, updateSortIndicators } from './components/table.js';
import { renderSidePeek, closeSidePeek } from './components/sidepanel-view.js';
import { exportAsCSV, exportAsJSON, importFromJSON } from './utils/export-import.js';

// State
let applications = [];
let selectedAppId = null;
let sortBy = 'applyDate';
let sortOrder = 'desc';

/**
 * Initialize the application
 */
async function init() {
  await loadApplications();
  setupEventListeners();
  render();
}

/**
 * Load applications from storage
 */
async function loadApplications() {
  try {
    applications = await getAllApplications();
  } catch (error) {
    console.error('Failed to load applications:', error);
    applications = [];
  }
}

/**
 * Render the UI
 */
function render() {
  renderTable(
    applications,
    handleRowClick,
    handleUpdate,
    handleDelete,
    sortBy,
    sortOrder
  );
  updateSortIndicators(sortBy, sortOrder);

  // Render side peek if an app is selected
  if (selectedAppId) {
    const app = applications.find(a => a.id === selectedAppId);
    if (app) {
      renderSidePeek(app, handleUpdate, handleCloseSidePeek);
    }
  }
}

/**
 * Handle row click
 */
function handleRowClick(id) {
  selectedAppId = id;
  const app = applications.find(a => a.id === id);
  if (app) {
    renderSidePeek(app, handleUpdate, handleCloseSidePeek);
    
    // Highlight selected row
    document.querySelectorAll('tbody tr').forEach(row => {
      row.classList.remove('selected');
      if (row.dataset.id === id) {
        row.classList.add('selected');
      }
    });
  }
}

/**
 * Handle application update
 */
async function handleUpdate(id, updates) {
  try {
    await updateApplication(id, updates);
    await loadApplications();
    render();
  } catch (error) {
    console.error('Failed to update application:', error);
    alert('Failed to update application');
  }
}

/**
 * Handle application delete
 */
async function handleDelete(id) {
  try {
    await deleteApplication(id);
    if (selectedAppId === id) {
      selectedAppId = null;
      closeSidePeek();
    }
    await loadApplications();
    render();
  } catch (error) {
    console.error('Failed to delete application:', error);
    alert('Failed to delete application');
  }
}

/**
 * Handle side peek close
 */
function handleCloseSidePeek() {
  selectedAppId = null;
  closeSidePeek();
  document.querySelectorAll('tbody tr').forEach(row => {
    row.classList.remove('selected');
  });
}

/**
 * Handle add new application
 */
async function handleAddApplication() {
  const jobUrl = prompt('Enter job URL:');
  if (!jobUrl) return;

  try {
    const newApp = await createApplication({
      jobUrl,
      applyDate: getTodayISO(),
      stage: 'Applied'
    });
    await loadApplications();
    render();
    
    // Open the new application in side peek
    handleRowClick(newApp.id);
  } catch (error) {
    console.error('Failed to create application:', error);
    alert('Failed to create application');
  }
}

/**
 * Handle sort
 */
function handleSort(column) {
  if (sortBy === column) {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy = column;
    sortOrder = 'desc';
  }
  render();
}

/**
 * Handle export CSV
 */
function handleExportCSV() {
  exportAsCSV(applications);
}

/**
 * Handle export JSON
 */
async function handleExportJSON() {
  await exportAsJSON();
}

/**
 * Handle import JSON
 */
async function handleImportJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  await importFromJSON(file, async () => {
    await loadApplications();
    render();
  });

  // Reset file input
  event.target.value = '';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add application button
  document.getElementById('addRowBtn').addEventListener('click', handleAddApplication);

  // Export buttons
  document.getElementById('exportCsvBtn').addEventListener('click', handleExportCSV);
  document.getElementById('exportJsonBtn').addEventListener('click', handleExportJSON);

  // Import button
  document.getElementById('importJsonInput').addEventListener('change', handleImportJSON);

  // Sort headers
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      handleSort(th.dataset.sort);
    });
  });

  // Close side peek when clicking outside
  document.addEventListener('click', (e) => {
    const sidePeek = document.getElementById('sidePeek');
    if (sidePeek.classList.contains('open') && 
        !sidePeek.contains(e.target) && 
        !e.target.closest('tbody tr')) {
      handleCloseSidePeek();
    }
  });
}

// Initialize on load
init();
