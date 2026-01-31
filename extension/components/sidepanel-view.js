/**
 * Side peek panel component for viewing/editing application details
 */

import { formatDateForDisplay, formatDateToISO } from '../lib/utils.js';

/**
 * Render side peek panel with application details
 * @param {Object} application 
 * @param {Function} onUpdate 
 * @param {Function} onClose 
 * @param {string} mode - 'create' or 'edit'
 * @param {Function} onCreate - callback for create button (only in create mode)
 */
export function renderSidePeek(application, onUpdate, onClose, mode = 'edit', onCreate = null) {
  const sidePeek = document.getElementById('sidePeek');
  const content = document.getElementById('sidePeekContent');
  const header = document.querySelector('.side-peek-header h2');

  if (!application) {
    sidePeek.classList.remove('open');
    return;
  }

  // Update header based on mode
  if (header) {
    header.textContent = mode === 'create' ? 'New Application' : 'Application Details';
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

    ${mode === 'create' ? `
      <div class="create-actions">
        <button id="createBtn" class="btn btn-primary">Create</button>
        <button id="cancelCreateBtn" class="btn btn-secondary">Cancel</button>
      </div>
    ` : ''}
  `;

  // Add event listeners for auto-save (only in edit mode)
  if (mode === 'edit') {
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
  }

  // Create mode buttons
  if (mode === 'create') {
    const createBtn = document.getElementById('createBtn');
    const cancelBtn = document.getElementById('cancelCreateBtn');

    createBtn.addEventListener('click', () => {
      const formData = getFormData();
      onCreate(formData);
    });

    cancelBtn.addEventListener('click', () => {
      onClose();
    });
  }

  // Add open class and set inline styles to show panel
  if (!sidePeek.classList.contains('open')) {
    sidePeek.classList.add('open');
  }
  
  // Force visibility using inline styles (CSS caching workaround)
  sidePeek.style.cssText = 'right: 0 !important; transform: none !important;';
  
  // Close button
  const closeBtn = document.getElementById('closeSidePeek');
  closeBtn.onclick = onClose;
}

/**
 * Get form data from side panel inputs
 */
function getFormData() {
  return {
    company: document.getElementById('edit-company')?.value || '',
    position: document.getElementById('edit-position')?.value || '',
    jobUrl: document.getElementById('edit-jobUrl')?.value || '',
    applyDate: document.getElementById('edit-applyDate')?.value || '',
    stage: document.getElementById('edit-stage')?.value || 'Applied',
    responseDate: document.getElementById('edit-responseDate')?.value || '',
    jobId: document.getElementById('edit-jobId')?.value || '',
    resumeVersion: document.getElementById('edit-resumeVersion')?.value || '',
    referral: document.getElementById('edit-referral')?.checked || false,
    jobDescription: document.getElementById('edit-jobDescription')?.value || '',
    notes: document.getElementById('edit-notes')?.value || ''
  };
}

/**
 * Close side peek panel
 */
export function closeSidePeek() {
  const sidePeek = document.getElementById('sidePeek');
  
  // Reset inline styles
  sidePeek.style.cssText = '';
  
  // Remove open class
  sidePeek.classList.remove('open');
}
