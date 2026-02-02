/**
 * Export and import utilities
 */

import { exportData, importData } from "./storage.js";

/**
 * Export applications as CSV
 * @param {Array} applications
 */
export function exportAsCSV(applications) {
  if (!applications || applications.length === 0) {
    alert("No applications to export");
    return;
  }

  // Define CSV headers
  const headers = [
    "Company",
    "Position",
    "Job URL",
    "Apply Date",
    "Stage",
    "Response Date",
    "Job ID",
    "Resume Version",
    "Referral",
    "Notes",
  ];

  // Convert applications to CSV rows
  const rows = applications.map((app) => [
    app.company || "",
    app.position || "",
    app.jobUrl || "",
    app.applyDate || "",
    app.stage || "",
    app.responseDate || "",
    app.jobId || "",
    app.resumeVersion || "",
    app.referral ? "Yes" : "No",
    (app.notes || "").replace(/"/g, '""'), // Escape quotes
  ]);

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  // Download CSV
  downloadFile(csvContent, "job-applications.csv", "text/csv");
}

/**
 * Export all data as JSON
 */
export async function exportAsJSON() {
  try {
    const data = await exportData();
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, "job-applications.json", "application/json");
  } catch (error) {
    console.error("Export error:", error);
    alert("Failed to export data: " + error.message);
  }
}

/**
 * Import data from JSON file
 * @param {File} file
 * @param {Function} onSuccess
 */
export async function importFromJSON(file, onSuccess) {
  try {
    const content = await readFileAsText(file);
    const data = JSON.parse(content);

    await importData(data);

    alert("Data imported successfully!");
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error("Import error:", error);
    alert("Failed to import data: " + error.message);
  }
}

/**
 * Download file helper
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read file as text
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
