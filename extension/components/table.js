/**
 * Table component for displaying job applications
 */

import { formatDateForDisplay } from "../lib/utils.js";

/**
 * Render table with applications
 * @param {Array} applications
 * @param {Function} onRowClick
 * @param {Function} onStageChange
 * @param {Function} onDelete
 * @param {string} sortBy
 * @param {string} sortOrder
 */
export function renderTable(
  applications,
  onRowClick,
  onStageChange,
  onDelete,
  sortBy = "applyDate",
  sortOrder = "desc",
) {
  const tableBody = document.getElementById("tableBody");
  const table = document.getElementById("applicationsTable");
  const emptyState = document.getElementById("emptyState");

  if (!applications || applications.length === 0) {
    table.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  // Sort applications
  const sorted = [...applications].sort((a, b) => {
    let aVal = a[sortBy] || "";
    let bVal = b[sortBy] || "";

    // Handle dates
    if (sortBy === "applyDate" || sortBy === "responseDate") {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }

    // Handle strings
    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    let comparison;
    if (sortOrder === "asc") {
      comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      comparison = aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }

    // If values are equal, use createdAt as tiebreaker (newer applications appear first in desc order)
    if (comparison === 0) {
      const aCreated = a.createdAt || 0;
      const bCreated = b.createdAt || 0;
      return sortOrder === "asc" ? aCreated - bCreated : bCreated - aCreated;
    }

    return comparison;
  });

  // Render rows
  tableBody.innerHTML = sorted
    .map(
      (app) => `
    <tr data-id="${app.id}" class="${app.stage === "Rejected" ? "rejected" : ""}">
      <td class="expand-gutter">
        <button class="expand-btn" data-id="${app.id}" aria-label="Open details" title="Open details">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </td>
      <td class="date-cell">
        <input type="date" class="date-input" data-id="${app.id}" data-field="applyDate" value="${app.applyDate || ""}" />
      </td>
      <td contenteditable="true" data-field="company">${app.company || ""}</td>
      <td contenteditable="true" data-field="position">${app.position || ""}</td>
      <td>
        <select class="stage-select stage-${app.stage || "Applied"}" data-id="${app.id}">
          <option value="Applied" ${app.stage === "Applied" ? "selected" : ""}>Applied</option>
          <option value="OA" ${app.stage === "OA" ? "selected" : ""}>OA</option>
          <option value="Phone" ${app.stage === "Phone" ? "selected" : ""}>Phone</option>
          <option value="Interview" ${app.stage === "Interview" ? "selected" : ""}>Interview</option>
          <option value="Offer" ${app.stage === "Offer" ? "selected" : ""}>Offer</option>
          <option value="Rejected" ${app.stage === "Rejected" ? "selected" : ""}>Rejected</option>
        </select>
      </td>
      <td class="date-cell">
        <input type="date" class="date-input" data-id="${app.id}" data-field="responseDate" value="${app.responseDate || ""}" />
      </td>
      <td class="actions-cell">
        <button class="delete-btn" data-id="${app.id}" aria-label="Delete" title="Delete application">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4h12M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v9a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3.5 13V4h9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="delete-confirm" style="display: none;">
          <span class="delete-confirm-text">Delete?</span>
          <button class="delete-confirm-btn" data-id="${app.id}">Yes</button>
          <button class="delete-cancel-btn">No</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  // Add event listeners
  tableBody.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;

    // Row click (excluding interactive elements)
    row.addEventListener("click", (e) => {
      if (
        e.target.tagName !== "SELECT" &&
        e.target.tagName !== "BUTTON" &&
        e.target.tagName !== "INPUT" &&
        !e.target.hasAttribute("contenteditable")
      ) {
        onRowClick(id);
      }
    });

    // Editable fields
    row.querySelectorAll('[contenteditable="true"]').forEach((cell) => {
      cell.addEventListener("blur", (e) => {
        const field = e.target.dataset.field;
        const value = e.target.textContent.trim();
        onStageChange(id, { [field]: value });
      });

      // Prevent newlines in contenteditable
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.target.blur();
        }
      });
    });

    // Date inputs
    row.querySelectorAll(".date-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        e.stopPropagation();
        const field = e.target.dataset.field;
        const value = e.target.value;
        onStageChange(id, { [field]: value });
      });
    });

    // Stage select
    const stageSelect = row.querySelector(".stage-select");
    stageSelect.addEventListener("change", (e) => {
      e.stopPropagation();
      // Update select color class
      stageSelect.className = `stage-select stage-${e.target.value}`;
      onStageChange(id, { stage: e.target.value });
    });

    // Expand button
    const expandBtn = row.querySelector(".expand-btn");
    expandBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onRowClick(id);
    });

    // Delete button
    const deleteBtn = row.querySelector(".delete-btn");
    const deleteConfirm = row.querySelector(".delete-confirm");
    const deleteConfirmBtn = row.querySelector(".delete-confirm-btn");
    const deleteCancelBtn = row.querySelector(".delete-cancel-btn");

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Hide delete button and show confirmation
      deleteBtn.style.display = "none";
      deleteConfirm.style.display = "flex";
    });

    deleteConfirmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onDelete(id);
    });

    deleteCancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Hide confirmation and show delete button again
      deleteConfirm.style.display = "none";
      deleteBtn.style.display = "inline-flex";
    });
  });
}

/**
 * Update sort indicators in table headers
 * @param {string} sortBy
 * @param {string} sortOrder
 */
export function updateSortIndicators(sortBy, sortOrder) {
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.sort === sortBy) {
      th.classList.add(sortOrder === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}
