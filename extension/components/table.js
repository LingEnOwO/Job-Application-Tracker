/**
 * Table component for displaying job applications
 */

import { formatDateForDisplay } from '../lib/utils.js';

/**
 * Render table with applications
 * @param {Array} applications 
 * @param {Function} onRowClick 
 * @param {Function} onStageChange 
 * @param {Function} onDelete 
 * @param {string} sortBy 
 * @param {string} sortOrder 
 */
export function renderTable(applications, onRowClick, onStageChange, onDelete, sortBy = 'applyDate', sortOrder = 'desc') {
  const tableBody = document.getElementById('tableBody');
  const table = document.getElementById('applicationsTable');
  const emptyState = document.getElementById('emptyState');

  if (!applications || applications.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  table.style.display = 'table';
  emptyState.style.display = 'none';

  // Sort applications
  const sorted = [...applications].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';

    // Handle dates
    if (sortBy === 'applyDate' || sortBy === 'responseDate') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }

    // Handle strings
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Render rows
  tableBody.innerHTML = sorted.map(app => `
    <tr data-id="${app.id}">
      <td>${formatDateForDisplay(app.applyDate)}</td>
      <td contenteditable="true" data-field="company">${app.company || ''}</td>
      <td contenteditable="true" data-field="position">${app.position || ''}</td>
      <td>
        <select class="stage-select" data-id="${app.id}">
          <option value="Applied" ${app.stage === 'Applied' ? 'selected' : ''}>Applied</option>
          <option value="OA" ${app.stage === 'OA' ? 'selected' : ''}>OA</option>
          <option value="Phone" ${app.stage === 'Phone' ? 'selected' : ''}>Phone</option>
          <option value="Onsite" ${app.stage === 'Onsite' ? 'selected' : ''}>Onsite</option>
          <option value="Offer" ${app.stage === 'Offer' ? 'selected' : ''}>Offer</option>
          <option value="Rejected" ${app.stage === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td>${app.responseDate ? formatDateForDisplay(app.responseDate) : '-'}</td>
      <td class="actions-cell">
        <button class="btn btn-small btn-danger delete-btn" data-id="${app.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  // Add event listeners
  tableBody.querySelectorAll('tr').forEach(row => {
    const id = row.dataset.id;

    // Row click (excluding interactive elements)
    row.addEventListener('click', (e) => {
      if (e.target.tagName !== 'SELECT' && 
          e.target.tagName !== 'BUTTON' && 
          !e.target.hasAttribute('contenteditable')) {
        onRowClick(id);
      }
    });

    // Editable fields
    row.querySelectorAll('[contenteditable="true"]').forEach(cell => {
      cell.addEventListener('blur', (e) => {
        const field = e.target.dataset.field;
        const value = e.target.textContent.trim();
        onStageChange(id, { [field]: value });
      });

      // Prevent newlines in contenteditable
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
        }
      });
    });

    // Stage select
    const stageSelect = row.querySelector('.stage-select');
    stageSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      onStageChange(id, { stage: e.target.value });
    });

    // Delete button
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this application?')) {
        onDelete(id);
      }
    });
  });
}

/**
 * Update sort indicators in table headers
 * @param {string} sortBy 
 * @param {string} sortOrder 
 */
export function updateSortIndicators(sortBy, sortOrder) {
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sort === sortBy) {
      th.classList.add(sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
  });
}
