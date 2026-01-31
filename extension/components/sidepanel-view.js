/**
 * Side peek panel component for viewing/editing application details
 */

import { formatDateForDisplay, formatDateToISO } from '../lib/utils.js';

/**
 * Render side peek panel with application details
 * @param {Object} application 
 * @param {Function} onUpdate 
 * @param {Function} onClose 
 */
export function renderSidePeek(application, onUpdate, onClose) {
  const sidePeek = document.getElementById('sidePeek');
  const content = document.getElementById('sidePeekContent');

  if (!application) {
    sidePeek.classList.remove('open');
    return;
  }

  content.innerHTML = `
    <div class="detail-group">
      <div class="detail-label">Company</div>
      <div class="detail-value">
        <input type="text" id="edit-company" value="${application.company || ''}" />
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Position</div>
      <div class="detail-value">
        <input type="text" id="edit-position" value="${application.position || ''}" />
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Job URL</div>
      <div class="detail-value url-field">
        <input type="url" id="edit-jobUrl" value="${application.jobUrl || ''}" placeholder="https://..." />
        ${application.jobUrl ? `<a href="${application.jobUrl}" target="_blank" rel="noopener" class="url-link" title="${application.jobUrl}">🔗 Open</a>` : ''}
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Apply Date</div>
      <div class="detail-value">
        <input type="date" id="edit-applyDate" value="${application.applyDate || ''}" />
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Stage</div>
      <div class="detail-value">
        <select id="edit-stage">
          <option value="Applied" ${application.stage === 'Applied' ? 'selected' : ''}>Applied</option>
          <option value="OA" ${application.stage === 'OA' ? 'selected' : ''}>OA</option>
          <option value="Phone" ${application.stage === 'Phone' ? 'selected' : ''}>Phone</option>
          <option value="Onsite" ${application.stage === 'Onsite' ? 'selected' : ''}>Onsite</option>
          <option value="Offer" ${application.stage === 'Offer' ? 'selected' : ''}>Offer</option>
          <option value="Rejected" ${application.stage === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Response Date</div>
      <div class="detail-value">
        <input type="date" id="edit-responseDate" value="${application.responseDate || ''}" />
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Job ID</div>
      <div class="detail-value">
        <input type="text" id="edit-jobId" value="${application.jobId || ''}" />
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Resume Version</div>
      <div class="detail-value">
        <input type="text" id="edit-resumeVersion" value="${application.resumeVersion || ''}" />
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Referral</div>
      <div class="detail-value checkbox-field">
        <input type="checkbox" id="edit-referral" ${application.referral ? 'checked' : ''} />
        <label for="edit-referral">Applied via referral</label>
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Job Description</div>
      <div class="detail-value">
        <textarea id="edit-jobDescription" placeholder="Paste job description here..." rows="8">${application.jobDescription || ''}</textarea>
      </div>
    </div>

    <div class="detail-group">
      <div class="detail-label">Notes (Markdown)</div>
      <div class="detail-value">
        <textarea id="edit-notes" placeholder="Add your notes here...">${application.notes || ''}</textarea>
      </div>
    </div>
  `;

  // Add event listeners for auto-save
  const fields = [
    'company', 'position', 'jobUrl', 'applyDate', 'stage', 'responseDate', 
    'jobId', 'resumeVersion', 'referral', 'jobDescription', 'notes'
  ];

  fields.forEach(field => {
    const element = document.getElementById(`edit-${field}`);
    if (element) {
      const eventType = element.type === 'checkbox' ? 'change' : 'blur';
      element.addEventListener(eventType, () => {
        const value = element.type === 'checkbox' ? element.checked : element.value;
        onUpdate(application.id, { [field]: value });
      });
    }
  });

  // Collapsible sections
  content.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      const target = header.dataset.target;
      const contentEl = document.getElementById(target);
      contentEl.classList.toggle('collapsed');
      const icon = header.querySelector('.collapse-icon');
      icon.textContent = contentEl.classList.contains('collapsed') ? '▶' : '▼';
    });
  });

  sidePeek.classList.add('open');

  // Close button
  const closeBtn = document.getElementById('closeSidePeek');
  closeBtn.onclick = onClose;
}

/**
 * Close side peek panel
 */
export function closeSidePeek() {
  const sidePeek = document.getElementById('sidePeek');
  sidePeek.classList.remove('open');
}
