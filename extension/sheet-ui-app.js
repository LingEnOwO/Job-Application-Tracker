/**
 * Main application logic for Sheet UI
 */

import { getAllApplications, updateApplication, deleteApplication, createApplication } from './lib/storage.js';
import { getTodayISO } from './lib/utils.js';
import { renderTable, updateSortIndicators } from './components/table.js';
import { renderSidePeek, closeSidePeek } from './components/sidepanel-view.js';
import { exportAsCSV, exportAsJSON, importFromJSON } from './utils/export-import.js';

// State
let applications = [];
let selectedAppId = null;
let sortBy = 'applyDate';
let sortOrder = 'desc';
let activeFilters = ['all']; // Stage filters
let searchQuery = ''; // Search keyword
const NOTES_STORAGE_KEY = 'sheetNotes';

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
    loadNotes();
  } catch (error) {
    console.error('Failed to load applications:', error);
    applications = [];
  }
}

/**
 * Load notes from localStorage
 */
function loadNotes() {
  const notes = localStorage.getItem(NOTES_STORAGE_KEY);
  if (notes) {
    document.getElementById('notesTextarea').value = notes;
  }
}

/**
 * Save notes to localStorage
 */
function saveNotes() {
  const notes = document.getElementById('notesTextarea').value;
  localStorage.setItem(NOTES_STORAGE_KEY, notes);
}

/**
 * Filter and search applications
 */
function getFilteredApplications() {
  let filtered = applications;

  // Apply stage filters
  if (!activeFilters.includes('all')) {
    filtered = filtered.filter(app => activeFilters.includes(app.stage));
  }

  // Apply search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(app => {
      return (
        (app.company || '').toLowerCase().includes(query) ||
        (app.position || '').toLowerCase().includes(query) ||
        (app.notes || '').toLowerCase().includes(query) ||
        (app.jobDescription || '').toLowerCase().includes(query)
      );
    });
  }

  return filtered;
}

/**
 * Update count display
 */
function updateCount() {
  const filtered = getFilteredApplications();
  const total = applications.length;
  const shown = filtered.length;
  
  const countText = document.getElementById('countText');
  if (shown === total) {
    countText.textContent = `${total} application${total !== 1 ? 's' : ''}`;
  } else {
    countText.textContent = `${shown} of ${total} application${total !== 1 ? 's' : ''}`;
  }
}

/**
 * Render the UI
 */
function render() {
  const filtered = getFilteredApplications();
  
  renderTable(
    filtered,
    handleRowClick,
    handleUpdate,
    handleDelete,
    sortBy,
    sortOrder
  );
  updateSortIndicators(sortBy, sortOrder);
  updateCount();

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
async function handleAddApplication(e) {
  // Stop event propagation to prevent the global click listener from closing the panel
  e.stopPropagation();
  
  // Create empty application template with defaults
  const newAppTemplate = {
    id: null, // Will be generated on create
    company: '',
    position: '',
    jobUrl: '',
    applyDate: getTodayISO(),
    stage: 'Applied',
    responseDate: '',
    jobId: '',
    resumeVersion: '',
    referral: false,
    jobDescription: '',
    notes: ''
  };

  // Open side panel in create mode
  renderSidePeek(
    newAppTemplate,
    null, // onUpdate not used in create mode
    handleCloseSidePeek,
    'create',
    handleCreateApplication
  );
}

/**
 * Handle create application from side panel
 */
async function handleCreateApplication(formData) {
  try {
    // Validate - only block completely empty applications
    const hasAnyData = formData.jobUrl || formData.company || formData.position || 
                       formData.jobDescription || formData.notes;
    if (!hasAnyData) {
      alert('Please fill in at least one field (URL, company, position, etc.)');
      return;
    }

    // Create the application
    const newApp = await createApplication(formData);
    
    // Update lastUpdated to trigger auto-refresh
    await chrome.storage.local.set({ lastUpdated: Date.now() });
    
    // Reload applications and render
    await loadApplications();
    render();
    
    // Close the panel
    handleCloseSidePeek();
    
    // Show success message
    showSuccessMessage(`Application created successfully!${formData.company ? ` (${formData.company})` : ''}`);
    
    // Highlight the new row
    setTimeout(() => {
      document.querySelectorAll('tbody tr').forEach(row => {
        row.classList.remove('selected');
        if (row.dataset.id === newApp.id) {
          row.classList.add('selected');
        }
      });
    }, 100);
  } catch (error) {
    console.error('Failed to create application:', error);
    alert('Failed to create application: ' + error.message);
  }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = 'success-message';
  messageEl.textContent = message;
  document.body.appendChild(messageEl);
  
  // Fade in
  setTimeout(() => messageEl.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    messageEl.classList.remove('show');
    setTimeout(() => messageEl.remove(), 300);
  }, 3000);
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

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const stage = chip.dataset.stage;
      
      if (stage === 'all') {
        activeFilters = ['all'];
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      } else {
        // Remove 'all' if selecting specific stage
        if (activeFilters.includes('all')) {
          activeFilters = [];
          document.querySelector('.filter-chip[data-stage="all"]').classList.remove('active');
        }
        
        // Toggle this stage
        if (activeFilters.includes(stage)) {
          activeFilters = activeFilters.filter(s => s !== stage);
          chip.classList.remove('active');
          
          // If no filters, reset to 'all'
          if (activeFilters.length === 0) {
            activeFilters = ['all'];
            document.querySelector('.filter-chip[data-stage="all"]').classList.add('active');
          }
        } else {
          activeFilters.push(stage);
          chip.classList.add('active');
        }
      }
      
      render();
    });
  });

  // Search input
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  // Notes toggle
  const toggleNotesBtn = document.getElementById('toggleNotesBtn');
  const notesContent = document.getElementById('notesContent');
  const notesHeader = document.querySelector('.notes-header');
  
  notesHeader.addEventListener('click', () => {
    notesContent.classList.toggle('collapsed');
    toggleNotesBtn.textContent = notesContent.classList.contains('collapsed') ? '▶' : '▼';
  });

  // Notes auto-save
  const notesTextarea = document.getElementById('notesTextarea');
  notesTextarea.addEventListener('input', saveNotes);

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

/**
 * Listen for storage changes to auto-refresh when applications are saved
 * This enables real-time updates when saving from the side panel
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    // Check if applications or lastUpdated changed
    if (changes.jobApplications || changes.lastUpdated) {
      console.log('Storage changed, refreshing applications...');
      loadApplications().then(() => {
        render();
      });
    }
  }
});

// Initialize on load
init();
