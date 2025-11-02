class OnReviewAccomplishmentReportModal extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.reportData = null;
  }

  async connectedCallback() {
    // Get report data from attribute if passed
    const reportDataAttr = this.getAttribute('report-data');
    if (reportDataAttr) {
      try {
        this.reportData = JSON.parse(reportDataAttr);
        this.formatReportData();
      } catch (e) {
        console.error('Error parsing report data:', e);
      }
    }

    // Get report ID from attribute if passed
    const reportId = this.getAttribute('report-id');
    if (reportId && !this.reportData) {
      // Fetch report data from server BEFORE rendering
      console.log('Fetching report data for ID:', reportId);
      await this.fetchReportById(reportId);
    }

    // Render AFTER data is fetched (or if data was passed directly)
    this.render();
    this.initializeElements();
    this.initEventListeners();
    
    // Populate report data IMMEDIATELY after elements are initialized
    // Then open modal after a short delay to ensure values are set
    if (this.reportData) {
      // Populate immediately
      this.populateReportData();
      
      // Small delay to ensure DOM updates, then open
      setTimeout(() => {
        this.openModal();
      }, 100);
    } else {
      // If no data yet, wait and try again
      setTimeout(() => {
        if (this.reportData) {
          this.populateReportData();
        }
        this.openModal();
      }, 300);
    }
  }

  disconnectedCallback() {
    // Clean up when modal is removed
    document.body.style.overflow = ""
  }

  formatReportData() {
    if (!this.reportData) {
      console.warn("formatReportData called but reportData is null/undefined");
      return;
    }
  
    // Format dateSubmitted if it exists and is not empty
    if (this.reportData.dateSubmitted && this.reportData.dateSubmitted.toString().trim() !== '') {
      try {
        let dateObj;
        const dateStr = this.reportData.dateSubmitted.toString().trim();
        
        // Check if it's in Y-m-d format
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateObj = new Date(dateStr + 'T00:00:00');
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/)) {
          // Handle DATETIME format
          dateObj = new Date(dateStr.replace(' ', 'T'));
        } else {
          dateObj = new Date(dateStr);
        }
        
        if (!isNaN(dateObj.getTime())) {
          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          this.reportData.dateSubmitted = dateObj.toLocaleDateString('en-US', options);
        }
      } catch (e) {
        console.warn("Error formatting dateSubmitted:", e);
      }
    }
  }

  async fetchReportById(reportId) {
    try {
      console.log('Fetching report with ID:', reportId);
      const formData = new FormData();
      formData.append('action', 'getReportById');
      formData.append('reportId', reportId);
      
      const response = await fetch('./php_folder/manageAccomplishmentReports.php', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response from server:', responseText);
      
      // Try to extract JSON from response (similar to view-ordinances-modal pattern)
      let jsonText = responseText.trim();
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }
      
      let result;
      try {
        result = JSON.parse(jsonText);
        console.log('Parsed result:', result);
      } catch (parseErr) {
        console.error("Error parsing response:", parseErr);
        console.error("Response text was:", responseText);
        return;
      }
      
      if (result.success && result.report) {
        this.reportData = result.report;
        console.log('Report data received from server:', JSON.stringify(this.reportData, null, 2));
        
        // Format dates
        this.formatReportData();
        
        console.log('Report data after formatting:', JSON.stringify(this.reportData, null, 2));
      } else {
        console.error("Failed to fetch report:", result.message);
        console.error("Error details:", result);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("onReviewReportModal")
    this.closeBtn = this.shadowRoot.getElementById("closeOnReviewModal")
    
    // Readonly report fields
    this.reportId = this.shadowRoot.getElementById("reportId")
    this.dateSubmission = this.shadowRoot.getElementById("dateSubmission")
    this.userId = this.shadowRoot.getElementById("userId")
    this.department = this.shadowRoot.getElementById("department")
    this.title = this.shadowRoot.getElementById("title")
    this.content = this.shadowRoot.getElementById("content")
    this.filePathInput = this.shadowRoot.getElementById("filePathInput")
    
    // Review fields
    this.status = this.shadowRoot.getElementById("status")
    this.remarks = this.shadowRoot.getElementById("remarks")
    
    this.closeBtnFooter = this.shadowRoot.getElementById("closeOnReviewBtn")
  }

  initEventListeners() {
    // Close button in footer
    if (this.closeBtnFooter) {
      this.closeBtnFooter.addEventListener("click", () => {
        this.closeModal();
      });
    }
    
    // Close button in header
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => {
        this.closeModal();
      });
    }
    
    // Close on backdrop click - no constraints
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }
    
    // ESC key to close - no constraints
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal && this.modal.classList.contains("show")) {
        this.closeModal();
      }
    });
    
    // View file button
    const viewFileBtn = this.shadowRoot.getElementById("viewFileBtn");
    if (viewFileBtn) {
      viewFileBtn.addEventListener("click", () => {
        this.viewFile();
      });
    }
  }

  viewFile() {
    if (this.reportData && this.reportData.filePath) {
      // Construct the full path to the PDF file
      const filePath = this.reportData.filePath.startsWith('./') 
        ? this.reportData.filePath.substring(2) 
        : this.reportData.filePath.startsWith('/') 
          ? this.reportData.filePath.substring(1)
          : this.reportData.filePath;
      
      // Open PDF in new tab
      const fullUrl = `./${filePath}`;
      window.open(fullUrl, '_blank');
    }
  }

  populateReportData() {
    // Re-initialize elements to ensure they're fresh references
    this.initializeElements();
    
    // Populate all fields DIRECTLY (like view-ordinances-modal does)
    if (this.reportData) {
      // Populate report ID
      const reportIdEl = this.shadowRoot.getElementById('reportId');
      if (reportIdEl) {
        reportIdEl.value = this.reportData.reportId || '';
      }
      
      // Populate date submission
      const dateSubmissionEl = this.shadowRoot.getElementById('dateSubmission');
      if (dateSubmissionEl) {
        dateSubmissionEl.value = this.reportData.dateSubmitted || '';
      }
      
      // Populate user ID
      const userIdEl = this.shadowRoot.getElementById('userId');
      if (userIdEl) {
        userIdEl.value = this.reportData.headId || '';
      }
      
      // Populate department
      const departmentEl = this.shadowRoot.getElementById('department');
      if (departmentEl && this.reportData.department) {
        departmentEl.disabled = false;
        departmentEl.value = this.reportData.department;
        departmentEl.disabled = true;
      }
      
      // Populate title - Get fresh element reference
      const titleEl = this.shadowRoot.getElementById('title');
      if (titleEl) {
        titleEl.value = this.reportData.title || '';
      }
      
      // Populate content - Get fresh element reference
      const contentEl = this.shadowRoot.getElementById('content');
      if (contentEl) {
        contentEl.value = this.reportData.content || '';
      }
      
      // Handle PDF file display
      if (this.reportData.filePath) {
        const fileName = this.extractFileName(this.reportData.filePath);
        
        const filePathInputEl = this.shadowRoot.getElementById('filePathInput');
        if (filePathInputEl) {
          filePathInputEl.value = fileName;
        }
        
        // Display PDF preview
        const pdfPreview = this.shadowRoot.getElementById('pdfPreview');
        if (pdfPreview) {
          let pdfPath = this.reportData.filePath;
          // Remove leading ./ if present
          if (pdfPath.startsWith('./')) {
            pdfPath = pdfPath.substring(2);
          }
          if (pdfPath.startsWith('/')) {
            pdfPath = pdfPath.substring(1);
          }
          pdfPreview.src = './' + pdfPath;
          pdfPreview.style.display = 'block';
        }
      }
      
      // Populate status with yellow tint for Pending - Get fresh element reference
      const statusEl = this.shadowRoot.getElementById('status');
      if (statusEl) {
        const statusValue = this.reportData.status || 'Pending';
        statusEl.value = statusValue;
        statusEl.readOnly = true;
        
        // Apply yellow tint for Pending status
        if (statusValue.toLowerCase() === 'pending') {
          statusEl.style.backgroundColor = '#fff7ed';
          statusEl.style.color = '#92400e';
          statusEl.style.borderColor = '#fcd34d';
        } else if (statusValue.toLowerCase() === 'approved') {
          statusEl.style.backgroundColor = '#f0fdf4';
          statusEl.style.color = '#166534';
          statusEl.style.borderColor = '#86efac';
        } else if (statusValue.toLowerCase() === 'declined') {
          statusEl.style.backgroundColor = '#fef2f2';
          statusEl.style.color = '#991b1b';
          statusEl.style.borderColor = '#fca5a5';
        } else {
          statusEl.style.backgroundColor = '#fff7ed';
          statusEl.style.color = '#92400e';
          statusEl.style.borderColor = '#fcd34d';
        }
      }
      
      // Populate remarks - default to "No Admin Remarks." if null/empty - Get fresh element reference
      const remarksEl = this.shadowRoot.getElementById('remarks');
      if (remarksEl) {
        const remarksValue = this.reportData.adminComments;
        if (remarksValue && remarksValue.trim() !== '' && remarksValue !== null) {
          remarksEl.value = String(remarksValue);
        } else {
          remarksEl.value = 'No Admin Remarks.';
        }
        remarksEl.readOnly = true;
        remarksEl.style.backgroundColor = '#f9fafb';
      }
    }
  }
  
  extractFileName(filePath) {
    if (!filePath) return '';
    // Extract filename from path (handle both forward and backward slashes)
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1] || filePath;
  }

  openModal() {
    if (this.modal) {
      this.modal.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove("show");
      document.body.style.overflow = "";
      this.remove();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        .modal {
          display: none;
          position: fixed;
          z-index: 1055;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal.show { display: flex; }
        .modal-dialog {
          max-width: 1235px;
          width: 100%;
          position: relative;
        }
        .modal-content {
          background-color: white;
          border: 2px solid #ea580c;
          border-radius: 5px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          width: 1235px;
        }
        .modal-bg-logo {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: url('./imgs/CSWDO Pags Logo.png') no-repeat center center;
          background-size: 60%;
          opacity: 0.08;
          z-index: 11;
          pointer-events: none;
        }
        .modal-header, .modal-body, .modal-footer {
          position: relative;
          z-index: 10;
          background-color: rgba(255, 255, 255, 0.95);
        }
        .modal-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .modal-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #374151;
          flex: 1;
        }
        .btn-close {
          position: absolute;
          top: 50%;
          right: 1rem;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          z-index: 20;
        }
        .btn-close:hover { background-color: #f3f4f6; }
        .modal-body { padding: 1rem; position: relative; z-index: 10; }
        .modal-content-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          height: 100%;
        }
        .form-section { display: flex; flex-direction: column; }
        .file-section { display: flex; flex-direction: column; justify-content: flex-start; }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .form-group { margin-bottom: 1rem; }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        .form-label {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
        .form-control {
          width: 100%;
          padding: 0.5rem;
          border: 2px solid #ea580c;
          border-radius: 2px;
          font-size: 14px;
          color: black;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .form-control:focus {
          outline: none;
          border-color: #c2410c;
          box-shadow: 0 0 0 1px #c2410c;
          background-color: white !important;
        }
        .form-control:read-only { background-color: #f9fafb !important; cursor: not-allowed; }
        .form-control:disabled { background-color: #f9fafb !important; cursor: not-allowed; }
        .form-control.textarea { resize: none; font-family: inherit; background-color: white !important; }
        input.form-control, textarea.form-control, select.form-control { background-color: white !important; }
        input.form-control:focus, textarea.form-control:focus, select.form-control:focus { background-color: white !important; }
        .separator {
          width: 100%;
          height: 2px;
          background-color: #90EE90;
          margin: 1.5rem 0;
          grid-column: 1 / -1;
        }
        .status-remarks-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 1rem;
          grid-column: 1 / -1;
        }
        .modal-footer { 
          padding: 1rem; 
          display: flex; 
          justify-content: center; 
          position: relative; 
          z-index: 10; 
        }
        .btn-close-footer {
          padding: 0.5rem 2rem;
          border-radius: 2px;
          font-weight: 500;
          cursor: pointer;
          border: 2px solid #ea580c;
          font-size: 0.875rem;
          background-color: #fff7ed;
          color: #ea580c;
          min-width: 120px;
        }
        .btn-close-footer:hover { 
          background-color: #ea580c;
          color: white;
        }
        .file-upload-section { margin-bottom: 1rem; height: 100%; display: flex; flex-direction: column; max-height: 500px; }
        .file-upload-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; }
        .file-input-container { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
        .file-path-input { flex: 1; padding: 0.5rem; border: 2px solid #ea580c; border-radius: 2px; font-size: 14px; color: #6b7280; background-color: #f9fafb !important; cursor: not-allowed; }
        .file-path-input:read-only { background-color: #f9fafb !important; }
        .attach-file-btn { background-color: #ea580c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 2px; cursor: pointer; font-size: 0.875rem; white-space: nowrap; }
        .attach-file-btn:hover { background-color: #c2410c; }
        .pdf-preview {
          width: 100%;
          height: 400px;
          border: 2px solid #e5e7eb;
          border-radius: 4px;
          display: none;
          background-color: #f9fafb;
          flex: 1;
        }
        .new-pdf-preview {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #ea580c;
          word-break: break-all;
          font-weight: 500;
          display: none;
        }
      </style>
      <div id="onReviewReportModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 class="modal-title">Submitted Accomplishment Report</h5>
              <button type="button" id="closeOnReviewModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div class="modal-content-wrapper">
                <div class="form-section">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="reportId" class="form-label">Report No.</label>
                      <input type="text" id="reportId" name="reportId" class="form-control" required readonly>
                    </div>
                    <div class="form-group">
                      <label for="dateSubmission" class="form-label">Date Filed</label>
                      <input type="text" id="dateSubmission" name="dateSubmission" class="form-control" required readonly>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="userId" class="form-label">User ID</label>
                      <input type="text" id="userId" name="userId" class="form-control" required readonly>
                    </div>
                    <div class="form-group">
                      <label for="department" class="form-label">Department</label>
                      <select id="department" name="department" class="form-control" required disabled>
                        <option value="">Select Department</option>
                        <option value="Social Welfare">Social Welfare</option>
                        <option value="Health Services">Health Services</option>
                        <option value="Education">Education</option>
                        <option value="Community Development">Community Development</option>
                        <option value="Youth Affairs">Youth Affairs</option>
                        <option value="Environmental Services">Environmental Services</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="title" class="form-label">Title</label>
                    <input type="text" id="title" name="title" class="form-control" required readonly>
                  </div>
                  <div class="form-group">
                    <label for="content" class="form-label">Contents</label>
                    <textarea id="content" name="content" class="form-control textarea" rows="8" required readonly></textarea>
                  </div>
                </div>
                <div class="file-section">
                  <div class="file-upload-section">
                    <label for="filePathInput" class="file-upload-label">Choose jpeg/png File</label>
                    <div class="file-input-container">
                      <input type="text" id="filePathInput" name="filePathInput" class="file-path-input" readonly placeholder="No file selected">
                      <button type="button" id="viewFileBtn" class="attach-file-btn">Attach File</button>
                    </div>
                    <iframe id="pdfPreview" class="pdf-preview" style="display: none;"></iframe>
                    <div id="newPdfPreview" class="new-pdf-preview" style="display: none;"></div>
                  </div>
                </div>
              </div>
              <div class="separator"></div>
              <div class="status-remarks-section">
                <div class="form-group">
                  <label for="status" class="form-label">Status</label>
                  <input type="text" id="status" name="status" class="form-control" readonly>
                </div>
                <div class="form-group">
                  <label for="remarks" class="form-label">Admin Remarks</label>
                  <input type="text" id="remarks" name="remarks" class="form-control" readonly>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" id="closeOnReviewBtn" class="btn-close-footer">Close</button>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

customElements.define("on-review-accomplishment-report-modal", OnReviewAccomplishmentReportModal)
