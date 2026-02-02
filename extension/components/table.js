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
    <tr data-id="${app.id}">
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
        <select class="stage-select" data-id="${app.id}">
          <option value="Applied" ${app.stage === "Applied" ? "selected" : ""}>Applied</option>
          <option value="OA" ${app.stage === "OA" ? "selected" : ""}>OA</option>
          <option value="Phone" ${app.stage === "Phone" ? "selected" : ""}>Phone</option>
          <option value="Onsite" ${app.stage === "Onsite" ? "selected" : ""}>Onsite</option>
          <option value="Offer" ${app.stage === "Offer" ? "selected" : ""}>Offer</option>
          <option value="Rejected" ${app.stage === "Rejected" ? "selected" : ""}>Rejected</option>
        </select>
      </td>
      <td class="date-cell">
        <input type="date" class="date-input" data-id="${app.id}" data-field="responseDate" value="${app.responseDate || ""}" />
      </td>
      <td class="actions-cell">
        <button class="btn btn-small btn-danger delete-btn" data-id="${app.id}">Delete</button>
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
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this application?")) {
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
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.sort === sortBy) {
      th.classList.add(sortOrder === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}
