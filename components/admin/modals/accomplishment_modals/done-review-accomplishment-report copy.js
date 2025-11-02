class DoneReviewAccomplishmentReportModal extends HTMLElement {
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
      } catch (e) {
        console.error('Error parsing report data:', e);
      }
    }

    // Get report ID from attribute if passed
    const reportId = this.getAttribute('report-id');
    if (reportId && !this.reportData) {
      // Fetch report data from server
      await this.fetchReportById(reportId);
    }

    this.render();
    this.initializeElements();
    this.initEventListeners();
    
    // Populate report data IMMEDIATELY after elements are initialized (like on-review-accomlishment-report.js)
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

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("doneReviewReportModal")
    this.closeBtn = this.shadowRoot.getElementById("closeDoneReviewModal")
    
    // Readonly report fields
    this.reportId = this.shadowRoot.getElementById("reportId")
    this.dateSubmission = this.shadowRoot.getElementById("dateSubmission")
    this.userId = this.shadowRoot.getElementById("userId")
    this.department = this.shadowRoot.getElementById("department")
    this.title = this.shadowRoot.getElementById("title")
    this.content = this.shadowRoot.getElementById("content")
    this.filePathInput = this.shadowRoot.getElementById("filePathInput")
    
    // Review fields (all readonly)
    this.adminId = this.shadowRoot.getElementById("adminId")
    this.dateReviewed = this.shadowRoot.getElementById("dateReviewed")
    this.status = this.shadowRoot.getElementById("status")
    this.remarks = this.shadowRoot.getElementById("remarks")
  }

  initEventListeners() {
    // Close button in footer
    const closeDoneReviewBtn = this.shadowRoot.getElementById("closeDoneReviewBtn");
    if (closeDoneReviewBtn) {
      closeDoneReviewBtn.addEventListener("click", () => {
        this.closeModal();
      });
    }
    
    // Close modal events - no constraints, direct close
    this.closeBtn.addEventListener("click", () => {
      this.closeModal();
    })
    
    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    })
    
    // ESC key to close - no constraints
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) {
        this.closeModal();
      }
    })
    
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
      // Open PDF in new tab
      const fileUrl = this.reportData.filePath.startsWith('./') || this.reportData.filePath.startsWith('/') 
        ? this.reportData.filePath 
        : './' + this.reportData.filePath;
      window.open(fileUrl, '_blank');
    }
  }

  openModal() {
    this.modal.classList.add("show")
    document.body.style.overflow = "hidden"
  }

  closeModal() {
    this.modal.classList.remove("show")
    document.body.style.overflow = ""
    this.remove()
  }

  populateReportData() {
    // Re-initialize elements to ensure they're fresh references (like on-review-accomlishment-report.js)
    this.initializeElements();
    
    // Populate all fields DIRECTLY using fresh element references (like on-review-accomlishment-report.js)
    if (this.reportData) {
      // Populate report ID - Get fresh element reference
      const reportIdEl = this.shadowRoot.getElementById('reportId');
      if (reportIdEl) {
        reportIdEl.value = this.reportData.reportId || '';
      }
      
      // Populate date submission - Get fresh element reference
      const dateSubmissionEl = this.shadowRoot.getElementById('dateSubmission');
      if (dateSubmissionEl) {
        dateSubmissionEl.value = this.reportData.dateSubmitted || '';
      }
      
      // Populate user ID - Get fresh element reference
      const userIdEl = this.shadowRoot.getElementById('userId');
      if (userIdEl) {
        userIdEl.value = this.reportData.headId || '';
      }
      
      // Populate department - Get fresh element reference
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
      
      // Handle PDF file display - Get fresh element reference
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
      
      // Populate admin ID - Get fresh element reference
      const adminIdEl = this.shadowRoot.getElementById('adminId');
      if (adminIdEl) {
        if (this.reportData.adminId) {
          adminIdEl.value = this.reportData.adminId;
        }
        adminIdEl.readOnly = true;
        adminIdEl.style.backgroundColor = '#f9fafb';
      }
      
      // Populate date reviewed - Get fresh element reference
      const dateReviewedEl = this.shadowRoot.getElementById('dateReviewed');
      if (dateReviewedEl) {
        const dateReviewedValue = this.reportData.dateApproved || this.reportData.dateReviewed;
        if (dateReviewedValue) {
          dateReviewedEl.value = dateReviewedValue;
        }
        dateReviewedEl.readOnly = true;
        dateReviewedEl.style.backgroundColor = '#f9fafb';
      }
      
      // Populate status with yellow tint for Pending - Get fresh element reference
      const statusEl = this.shadowRoot.getElementById('status');
      if (statusEl) {
        const statusValue = this.reportData.status || 'Pending';
        statusEl.value = statusValue;
        statusEl.disabled = true;
        
        // Apply yellow tint for Pending status (like on-review-accomlishment-report.js)
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
      
      // Try to extract JSON from response (like on-review-accomlishment-report.js)
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
        
        // Format dates using formatReportData method (if it exists) or inline formatting
        if (this.reportData.dateSubmitted) {
          try {
            let dateObj;
            const dateStr = this.reportData.dateSubmitted.toString().trim();
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dateObj = new Date(dateStr + 'T00:00:00');
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
        
        if (this.reportData.dateReviewed || this.reportData.dateApproved) {
          try {
            const dateToFormat = this.reportData.dateReviewed || this.reportData.dateApproved;
            let dateObj;
            const dateStr = dateToFormat.toString().trim();
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dateObj = new Date(dateStr + 'T00:00:00');
            } else {
              dateObj = new Date(dateStr);
            }
            if (!isNaN(dateObj.getTime())) {
              const options = { year: 'numeric', month: 'long', day: 'numeric' };
              const formattedDate = dateObj.toLocaleDateString('en-US', options);
              this.reportData.dateReviewed = formattedDate;
              this.reportData.dateApproved = formattedDate;
            }
          } catch (e) {
            console.warn("Error formatting dateReviewed:", e);
          }
        }
        
        console.log('Report data after formatting:', JSON.stringify(this.reportData, null, 2));
      } else {
        console.error("Failed to fetch report:", result.message);
        console.error("Error details:", result);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
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
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5rem;
          height: 100%;
        }
        .form-section { display: flex; flex-direction: column; }
        .review-section { display: flex; flex-direction: column; }
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
        .new-pdf-preview-link {
          color: #ea580c;
          text-decoration: none;
          cursor: pointer;
          display: block;
          width: 100%;
        }
        .new-pdf-preview-link:hover {
          color: #c2410c;
          text-decoration: underline;
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
        .form-control.textarea { resize: none; font-family: inherit; background-color: white !important; }
        input.form-control, textarea.form-control, select.form-control { background-color: white !important; }
        input.form-control:focus, textarea.form-control:focus, select.form-control:focus { background-color: white !important; }
        .divider-line {
          width: 100%;
          height: 1px;
          border: none;
          border-top: 2px dashed #ea580c;
          margin: 1.5rem 0;
          opacity: 0.6;
        }
        .modal-footer { padding: 1rem; display: flex; gap: 0.75rem; position: relative; z-index: 10; }
        .btn { flex: 1; padding: 0.5rem 1rem; border-radius: 2px; font-weight: 500; cursor: pointer; border: none; font-size: 0.875rem; }
        .btn-primary { background-color: #ea580c; color: white; }
        .btn-primary:hover { background-color: #c2410c; }
        .btn-primary:disabled { background-color: #9ca3af; color: #6b7280; cursor: not-allowed; }
        .btn-secondary { background-color: transparent; color: #374151; border: 2px solid #9ca3af; }
        .btn-secondary:hover { background-color: #f9fafb; }
        .alert { padding: 0.75rem; margin-bottom: 1rem; border-radius: 2px; display: none; }
        .alert-danger { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .alert-success { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #059669; }
        .alert.show { display: block; }
      </style>
      <div id="doneReviewReportModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 id="doneReviewReportTitle" class="modal-title">Accomplishment Report</h5>
              <button type="button" id="closeDoneReviewModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div class="modal-content-wrapper">
                <!-- Column 1: Report Details (same as add modal) -->
                <div class="form-section">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="reportId" class="form-label">Report No.</label>
                      <input type="text" id="reportId" name="reportId" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                      <label for="dateSubmission" class="form-label">Date Submission</label>
                      <input type="text" id="dateSubmission" name="dateSubmission" class="form-control" readonly>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="userId" class="form-label">User ID</label>
                      <input type="text" id="userId" name="userId" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                      <label for="department" class="form-label">Department</label>
                      <select id="department" name="department" class="form-control" disabled>
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
                    <input type="text" id="title" name="title" class="form-control" readonly>
                  </div>
                  <div class="form-group">
                    <label for="content" class="form-label">Content</label>
                    <textarea id="content" name="content" class="form-control textarea" rows="8" readonly></textarea>
                  </div>
                </div>
                
                <!-- Column 2: File Section (same as add modal) -->
                <div class="file-section">
                  <div class="file-upload-section">
                    <label for="filePathInput" class="file-upload-label">Attach PDF File</label>
                    <div class="file-input-container">
                      <input type="text" id="filePathInput" name="filePathInput" class="file-path-input" readonly placeholder="No file selected">
                      <button type="button" id="viewFileBtn" class="attach-file-btn">View File</button>
                    </div>
                    <iframe id="pdfPreview" class="pdf-preview" style="display: none;"></iframe>
                    <div id="newPdfPreview" class="new-pdf-preview" style="display: none;"></div>
                  </div>
                </div>
                
                <!-- Column 3: Review Fields (all readonly) -->
                <div class="review-section">
                  <div class="form-group">
                    <label for="adminId" class="form-label">Admin ID</label>
                    <input type="text" id="adminId" name="adminId" class="form-control" readonly>
                  </div>
                  <div class="form-group">
                    <label for="dateReviewed" class="form-label">Date Reviewed</label>
                    <input type="text" id="dateReviewed" name="dateReviewed" class="form-control" readonly>
                  </div>
                  <div class="form-group">
                    <label for="status" class="form-label">Status</label>
                    <select id="status" name="status" class="form-control" disabled>
                      <option value="">Select Status</option>
                      <option value="Approved">Approve</option>
                      <option value="Declined">Decline</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="remarks" class="form-label">Remarks</label>
                    <textarea id="remarks" name="remarks" class="form-control textarea" rows="8" readonly></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" id="closeDoneReviewBtn" class="btn btn-secondary" style="width: 100%;">Close</button>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

customElements.define("done-review-accomplishment-report-modal", DoneReviewAccomplishmentReportModal)

