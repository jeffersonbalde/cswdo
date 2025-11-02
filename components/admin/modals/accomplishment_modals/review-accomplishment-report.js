class ReviewAccomplishmentReportModal extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.reportData = null;
    this.loadingState = null;
    this.savedFormData = null;
  }

  async connectedCallback() {
    // Get report data from attribute if passed
    const reportDataAttr = this.getAttribute('report-data');
    if (reportDataAttr) {
      try {
        this.reportData = JSON.parse(reportDataAttr);
        // Format dates if needed
        this.formatReportData();
      } catch (e) {
        console.error('Error parsing report data:', e);
      }
    }

    // Get report ID from attribute if passed
    const reportId = this.getAttribute('report-id');
    if (reportId && !this.reportData) {
      // Fetch report data from server BEFORE rendering
      console.log("Fetching report data for ID:", reportId);
      await this.fetchReportById(reportId);
    }

    // Render AFTER data is fetched (or if data was passed directly)
    this.render();
    this.initializeElements();
    this.initEventListeners();
    
    // Fetch admin data and populate report data after DOM is fully initialized
    // Use pattern from on-review-accomlishment-report.js
    setTimeout(async () => {
      await this.fetchAdminData(); // Fetch logged-in admin data
      
      // Populate report data IMMEDIATELY if available (like on-review-accomlishment-report.js)
      if (this.reportData) {
        this.populateReportData(); // Populate readonly fields with report data
      } else {
        // If no data yet, wait and try again
        setTimeout(() => {
          if (this.reportData) {
            this.populateReportData();
          } else {
            this.showError("Failed to load report data. Please try again.");
          }
        }, 300);
      }
      
      // Set default date AFTER populating (only if no date exists)
      // This prevents overwriting existing review dates
      this.setDefaultDate();
    }, 300);
    
    this.openModal();
  }

  formatReportData() {
    if (!this.reportData) {
      console.warn("formatReportData called but reportData is null/undefined");
      return;
    }
    
    console.log("Formatting report data:", this.reportData);
    
    // Format dateSubmitted if it exists and is not empty
    if (this.reportData.dateSubmitted && this.reportData.dateSubmitted.toString().trim() !== '') {
      try {
        let dateObj;
        const dateStr = this.reportData.dateSubmitted.toString().trim();
        console.log("Formatting dateSubmitted:", dateStr);
        
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
          console.log("Formatted dateSubmitted to:", this.reportData.dateSubmitted);
        } else {
          console.warn("Invalid dateSubmitted:", dateStr);
        }
      } catch (e) {
        console.warn("Error formatting dateSubmitted:", e);
      }
    } else {
      console.log("dateSubmitted is empty or null:", this.reportData.dateSubmitted);
    }
    
    // Format dateReviewed/dateApproved if it exists and is not empty
    const dateToFormat = this.reportData.dateReviewed || this.reportData.dateApproved;
    if (dateToFormat && dateToFormat.toString().trim() !== '') {
      try {
        let dateObj;
        const dateStr = dateToFormat.toString().trim();
        console.log("Formatting dateReviewed/dateApproved:", dateStr);
        
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
          const formattedDate = dateObj.toLocaleDateString('en-US', options);
          this.reportData.dateReviewed = formattedDate;
          this.reportData.dateApproved = formattedDate;
          console.log("Formatted dateReviewed/dateApproved to:", formattedDate);
        } else {
          console.warn("Invalid dateReviewed/dateApproved:", dateStr);
        }
      } catch (e) {
        console.warn("Error formatting dateReviewed/dateApproved:", e);
      }
    } else {
      console.log("dateReviewed/dateApproved is empty or null");
    }
  }

  setDefaultDate() {
    // Only set default date if dateReviewed field exists and has no value from report data
    // This prevents overwriting existing review dates
    if (this.dateReviewed && (!this.reportData || !this.reportData.dateApproved)) {
      const today = new Date();
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = today.toLocaleDateString('en-US', options);
      // Only set if field is empty (not in view-only mode)
      if (!this.dateReviewed.value || this.dateReviewed.value.trim() === '') {
        const isViewOnly = this.getAttribute('view-only') === 'true';
        if (!isViewOnly) {
          this.dateReviewed.value = formattedDate;
          console.log("Set default dateReviewed:", formattedDate);
        }
      }
    }
  }

  disconnectedCallback() {
    // Clean up when modal is removed
    document.body.style.overflow = ""
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("reviewReportModal")
    this.form = this.shadowRoot.getElementById("reviewReportForm")
    this.cancelBtn = this.shadowRoot.getElementById("cancelReviewBtn")
    this.closeBtn = this.shadowRoot.getElementById("closeReviewModal")
    
    // Readonly report fields
    this.reportId = this.shadowRoot.getElementById("reportId")
    this.dateSubmission = this.shadowRoot.getElementById("dateSubmission")
    this.userId = this.shadowRoot.getElementById("userId")
    this.department = this.shadowRoot.getElementById("department")
    this.title = this.shadowRoot.getElementById("title")
    this.content = this.shadowRoot.getElementById("content")
    this.filePathInput = this.shadowRoot.getElementById("filePathInput")
    
    // Review fields
    this.adminId = this.shadowRoot.getElementById("adminId")
    this.dateReviewed = this.shadowRoot.getElementById("dateReviewed")
    this.status = this.shadowRoot.getElementById("status")
    this.remarks = this.shadowRoot.getElementById("remarks")

    this.errorDiv = this.shadowRoot.getElementById("reviewReportError")
  }

  initEventListeners() {
    // Close modal events
    this.cancelBtn.addEventListener("click", () => {
      this.handleCloseAttempt();
    })
    this.closeBtn.addEventListener("click", () => {
      this.handleCloseAttempt();
    })
    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.handleCloseAttempt();
      }
    })
    // Form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSubmit()
    })
    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) {
        this.handleCloseAttempt();
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

  hasUserInput() {
    // Check if user has entered any review data
    const adminIdHas = (this.adminId?.value || "").trim().length > 0;
    const dateReviewedHas = (this.dateReviewed?.value || "").trim().length > 0;
    const statusHas = (this.status?.value || "").trim().length > 0 && this.status.value !== "";
    const remarksHas = (this.remarks?.value || "").trim().length > 0;
    return adminIdHas || dateReviewedHas || statusHas || remarksHas;
  }

  handleCloseAttempt() {
    // Check if user has entered any data
    if (this.hasUserInput()) {
      // Show confirmation modal
      this.showCancelConfirmation();
    } else {
      // No input, close directly
      this.closeModal();
    }
  }

  showCancelConfirmation() {
    // Remove existing instance if any
    const existing = document.querySelector("cancel-confimation-modal");
    if (existing) existing.remove();

    const cancelModal = document.createElement("cancel-confimation-modal");
    cancelModal.setAttribute("title", "Warning Action");
    cancelModal.setAttribute("message", "are you sure to cancel entries? Entries will be deleted");
    
    // Listen for user decision
    cancelModal.addEventListener("cancel-confirm", (e) => {
      if (e.detail?.confirmed) {
        // Yes: dispose entries and close
        this.closeModal(false);
      } else {
        // No: keep modal open with current entries retained
        // User can continue inputting
        this.status?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  openModal() {
    this.modal.classList.add("show")
    this.clearError()
    document.body.style.overflow = "hidden"
  }

  closeModal(keepData = false) {
    this.modal.classList.remove("show")
    if (!keepData) {
      this.form.reset()
      this.clearError()
      this.savedFormData = null;
      // Reset date to today after form reset
      this.setDefaultDate();
    }
    document.body.style.overflow = ""
    // Remove the modal from DOM only if not keeping data (for error recovery)
    if (!keepData) {
      this.remove()
    }
  }

  reopenModal() {
    if (this.savedFormData) {
      // Restore form data
      if (this.savedFormData.adminId) this.adminId.value = this.savedFormData.adminId;
      if (this.savedFormData.dateReviewed) this.dateReviewed.value = this.savedFormData.dateReviewed;
      if (this.savedFormData.status) this.status.value = this.savedFormData.status;
      if (this.savedFormData.remarks) this.remarks.value = this.savedFormData.remarks;
      
      // Reopen modal (this will show it)
      this.modal.classList.add("show");
      document.body.style.overflow = "hidden";
      
      // Show error message after opening (so it's visible)
      if (this.savedFormData.errorMessage) {
        this.showError(this.savedFormData.errorMessage);
      }
    }
  }

  populateReportData() {
    // Check if this is view-only mode
    const isViewOnly = this.getAttribute('view-only') === 'true';
    
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
      
      // Populate title - Get fresh element reference (CRITICAL)
      const titleEl = this.shadowRoot.getElementById('title');
      if (titleEl) {
        titleEl.value = this.reportData.title || '';
      }
      
      // Populate content - Get fresh element reference (CRITICAL)
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
        if (isViewOnly) {
          adminIdEl.readOnly = true;
          adminIdEl.style.backgroundColor = '#f9fafb';
        }
      }
      
      // Populate date reviewed - Get fresh element reference
      const dateReviewedEl = this.shadowRoot.getElementById('dateReviewed');
      if (dateReviewedEl) {
        const dateReviewedValue = this.reportData.dateApproved || this.reportData.dateReviewed;
        if (dateReviewedValue) {
          dateReviewedEl.value = dateReviewedValue;
        }
        if (isViewOnly) {
          dateReviewedEl.readOnly = true;
          dateReviewedEl.style.backgroundColor = '#f9fafb';
        }
      }
      
      // Populate status with yellow tint for Pending - Get fresh element reference
      const statusEl = this.shadowRoot.getElementById('status');
      if (statusEl) {
        const statusValue = this.reportData.status || 'Pending';
        statusEl.value = statusValue;
        
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
        
        if (isViewOnly) {
          statusEl.disabled = true;
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
        if (isViewOnly) {
          remarksEl.readOnly = true;
          remarksEl.style.backgroundColor = '#f9fafb';
        }
      }
      
      // Hide save button and show close button in view-only mode
      if (isViewOnly) {
        const saveBtn = this.shadowRoot.getElementById('saveReviewBtn');
        if (saveBtn) {
          saveBtn.style.display = 'none';
        }
        const cancelBtn = this.shadowRoot.getElementById('cancelReviewBtn');
        if (cancelBtn) {
          cancelBtn.textContent = 'Close';
          cancelBtn.style.flex = 'none';
          cancelBtn.style.width = '100%';
        }
      }
    }
  }
  
  extractFileName(filePath) {
    if (!filePath) return '';
    // Extract filename from path (handle both forward and backward slashes)
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1] || filePath;
  }

  async fetchAdminData() {
    try {
      // Check window.userData first (injected by PHP)
      console.log("Checking window.userData for admin:", window.userData);
      
      if (window.userData && window.userData.user_id) {
        const adminId = window.userData.user_id || '';
        console.log("Using window.userData - admin user_id:", adminId);
        
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        this.autoFillAdminFields(adminId);
        return;
      }

      // If not available in window.userData, fetch from API
      console.log("window.userData not found or missing user_id, fetching from API...");
      const response = await fetch('./php_folder/get-user-data.php', {
        method: 'GET',
        credentials: 'same-origin'
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Admin data API response:", result);
        
        if (result.success && result.data) {
          const adminId = result.data.user_id || '';
          console.log("Setting admin data from API - user_id:", adminId);
          
          // Small delay to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          this.autoFillAdminFields(adminId);
        } else {
          console.warn("Could not fetch admin data:", result.message);
        }
      } else {
        const errorText = await response.text();
        console.warn("Failed to fetch admin data from API - Response status:", response.status, "Response:", errorText);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
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
      
      // Try to extract JSON from response (similar to on-review-accomlishment-report.js pattern)
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
        this.showError("Failed to parse server response. Check console for details.");
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
        const errorMsg = result.message || "Failed to fetch report data.";
        this.showError(errorMsg);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      this.showError("Failed to fetch report data: " + err.message);
    }
  }

  autoFillAdminFields(adminId) {
    console.log("autoFillAdminFields called with:", { adminId });
    
    // Auto-fill adminId field with logged-in admin's user_id
    if (this.adminId) {
      if (adminId) {
        this.adminId.value = adminId.toString();
        this.adminId.readOnly = true;
        this.adminId.style.backgroundColor = '#f5f5f5';
        this.adminId.style.cursor = 'not-allowed';
        console.log("✓ Admin ID auto-filled:", adminId);
      } else {
        console.warn("Admin ID field exists but no adminId value provided");
      }
    } else {
      console.error("❌ Admin ID field not found in DOM");
    }
  }

  showLoadingState() {
    // Remove existing loading state if any
    const existing = document.querySelector("loading-state");
    if (existing) existing.remove();
    
    this.loadingState = document.createElement("loading-state");
    this.loadingState.setAttribute("subheader", "Saving review");
    document.body.appendChild(this.loadingState);
    this.loadingState.show();
  }

  hideLoadingState() {
    if (this.loadingState) {
      this.loadingState.hide();
      this.loadingState.remove();
      this.loadingState = null;
    }
  }

  showError(message, type = 'error') {
    this.errorDiv.textContent = message
    this.errorDiv.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'}`
    this.errorDiv.classList.add("show")
  }

  clearError() {
    this.errorDiv.textContent = ""
    this.errorDiv.classList.remove("show")
  }

  async handleSubmit() {
    // Check if this is view-only mode
    const isViewOnly = this.getAttribute('view-only') === 'true';
    if (isViewOnly) {
      // In view-only mode, just close the modal
      this.closeModal();
      return;
    }
    
    // Get form data
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());

    // Validation
    if (
      !data.reportId ||
      !data.adminId ||
      !data.dateReviewed ||
      !data.status ||
      data.status === ""
    ) {
      this.showError("Please fill in all required fields (Admin ID, Date Reviewed, and Status are required).");
      return;
    }

    // Show confirmation modal first
    const confirmModal = document.createElement("sure-to-save-modal");
    document.body.appendChild(confirmModal);
    
    // Listen for confirmation
    confirmModal.addEventListener("confirm-save", async (e) => {
      if (e.detail.confirmed) {
        // Close confirmation modal first
        confirmModal.remove();
        
        // Store form data for potential error recovery
        this.savedFormData = {
          ...data,
          errorMessage: null
        };
        
        // Close modal immediately and show loading state
        this.closeModal(true); // Keep data for error recovery
        this.showLoadingState();
        
        try {
          // Prepare form data for submission
          const submitFormData = new FormData();
          submitFormData.append('action', 'update');
          
          // Add all form fields
          Object.keys(data).forEach(key => {
            submitFormData.append(key, data[key]);
          });
          
          // Convert date format for backend
          let dateReviewedValue = data.dateReviewed;
          if (dateReviewedValue) {
            const dateObj = new Date(dateReviewedValue);
            if (!isNaN(dateObj.getTime())) {
              dateReviewedValue = dateObj.toISOString().slice(0, 19).replace('T', ' ');
            }
          }
          
          // Map field names to match backend expectations
          submitFormData.append('reportId', data.reportId);
          submitFormData.append('adminId', data.adminId);
          submitFormData.append('dateReviewed', dateReviewedValue);
          submitFormData.append('status', data.status);
          submitFormData.append('adminComments', data.remarks || '');
          
          const response = await fetch("./php_folder/manageAccomplishmentReports.php", {
            method: "POST",
            body: submitFormData
          });
          
          const responseText = await response.text();
          const result = JSON.parse(responseText);

          if (result.success) {
            // Hide loading state first
            this.hideLoadingState();

            // Dispatch event to parent
            this.dispatchEvent(
              new CustomEvent("review-saved", {
                detail: { report: data },
                bubbles: true,  
              })
            );

            // Dispatch refresh event to parent component
            this.dispatchEvent(
              new CustomEvent("refresh-reports-table", {
                bubbles: true,
              })
            );

            // Show success modal
            const successModal = document.createElement("success-save-modal");
            successModal.setAttribute("message", "✅ Review Saved Successfully!");
            document.body.appendChild(successModal);

            // Clean up - close modal completely
            this.closeModal();
          } else {
            // Hide loading state
            this.hideLoadingState();
            
            // Store error message and reopen modal
            this.savedFormData.errorMessage = result.message || "An error occurred while saving review.";
            
            // Reopen the modal with error displayed
            this.reopenModal();
          }
        } catch (err) {
          console.error("Submit error:", err);
          
          // Hide loading state
          this.hideLoadingState();
          
          // Store error message and reopen modal
          this.savedFormData.errorMessage = "Failed to save review. Check your internet or server.";
          this.reopenModal();
        }
      }
    });
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
      <div id="reviewReportModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 id="reviewReportTitle" class="modal-title">Review Accomplishment Report</h5>
              <button type="button" id="closeReviewModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div id="reviewReportError" class="alert alert-danger"></div>
              <form id="reviewReportForm">
                <div class="modal-content-wrapper">
                  <!-- Column 1: Report Details (same as add modal) -->
                  <div class="form-section">
                    <div class="form-row">
                      <div class="form-group">
                        <label for="reportId" class="form-label">Report No.</label>
                        <input type="text" id="reportId" name="reportId" class="form-control" required readonly>
                      </div>
                      <div class="form-group">
                        <label for="dateSubmission" class="form-label">Date Submission</label>
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
                      <label for="content" class="form-label">Content</label>
                      <textarea id="content" name="content" class="form-control textarea" rows="8" required readonly></textarea>
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
                  
                  <!-- Column 3: Review Fields -->
                  <div class="review-section">
                    <div class="form-group">
                      <label for="adminId" class="form-label">Admin ID</label>
                      <input type="text" id="adminId" name="adminId" class="form-control" required>
                    </div>
                    <div class="form-group">
                      <label for="dateReviewed" class="form-label">Date Reviewed</label>
                      <input type="text" id="dateReviewed" name="dateReviewed" class="form-control" required>
                    </div>
                    <div class="form-group">
                      <label for="status" class="form-label">Status</label>
                      <select id="status" name="status" class="form-control" required>
                        <option value="">Select Status</option>
                        <option value="Approved">Approve</option>
                        <option value="Declined">Decline</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="remarks" class="form-label">Remarks</label>
                      <textarea id="remarks" name="remarks" class="form-control textarea" rows="8" placeholder="Enter review remarks..."></textarea>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" id="saveReviewBtn" class="btn btn-primary" form="reviewReportForm">Save Review</button>
              <button type="button" id="cancelReviewBtn" class="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

customElements.define("review-accomplishment-report-modal", ReviewAccomplishmentReportModal)

