class AddAccomplishmentReportModal extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.selectedFile = null;
    this.uploadedFilePath = '';
    this.savedFormData = null; // Store form data for error recovery
    this.loadingState = null; // Reference to loading state component
    this.previousPdfUrl = null; // Store PDF object URL for cleanup
  }

  async connectedCallback() {
    this.render();
    this.initializeElements();
    await this.fetchNewReportId(); // Fetch from backend
    this.setDefaultDate(); // Set today's date
    this.initEventListeners();
    
    // Fetch user data after DOM is fully initialized
    // Use setTimeout to ensure all elements are ready
    setTimeout(async () => {
      await this.fetchUserData(); // Fetch logged-in user data
    }, 200);
    
    this.openModal();
  }

  setDefaultDate() {
    // Set default date to today in format "November 3, 2025"
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    if (this.dateSubmission) {
      this.dateSubmission.value = formattedDate;
    }
  }

  disconnectedCallback() {
    // Clean up when modal is removed
    document.body.style.overflow = ""
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("addReportModal")
    this.form = this.shadowRoot.getElementById("addReportForm")
    this.cancelBtn = this.shadowRoot.getElementById("cancelAddBtn")
    this.closeBtn = this.shadowRoot.getElementById("closeAddModal")
    
    // Inputs
    this.reportId = this.shadowRoot.getElementById("reportId")
    this.dateSubmission = this.shadowRoot.getElementById("dateSubmission")
    this.userId = this.shadowRoot.getElementById("userId")
    this.department = this.shadowRoot.getElementById("department")
    this.title = this.shadowRoot.getElementById("title")
    this.content = this.shadowRoot.getElementById("content")
    this.fileInput = this.shadowRoot.getElementById("reportFile")
    this.pdfPreview = this.shadowRoot.getElementById("pdfPreview")
    this.newPdfPreview = this.shadowRoot.getElementById("newPdfPreview")
    this.attachBtn = this.shadowRoot.getElementById("attachFileBtn")

    this.errorDiv = this.shadowRoot.getElementById("addReportError")
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

    // File upload handling
    this.fileInput.addEventListener("change", (e) => {
      this.handleFileSelect(e);
    });

    this.attachBtn.addEventListener("click", () => {
      this.fileInput.click();
    });
  }

  hasUserInput() {
    // Only check user-entered fields: Title, Content, and Attach PDF
    // Report ID, Date Submission, User ID, and Department are auto-filled; ignore them
    const titleHas = (this.title?.value || "").trim().length > 0;
    const contentHas = (this.content?.value || "").trim().length > 0;
    const fileHas = !!this.selectedFile;
    
    const hasInput = titleHas || contentHas || fileHas;
    
    if (hasInput) {
      console.log("User input detected:", {
        title: titleHas,
        content: contentHas,
        file: fileHas
      });
    }
    
    return hasInput;
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
        this.title?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type - accept PDF
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.showError('Please select a valid PDF file.');
        this.fileInput.value = '';
        this.updateFilePath('');
        this.hidePdfPreview();
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.showError('File size too large. Maximum size is 10MB.');
        this.fileInput.value = '';
        this.updateFilePath('');
        this.hidePdfPreview();
        return;
      }

      this.selectedFile = file;
      this.updateFilePath(file.name);
      this.showPdfPreview(file);
    }
  }

  showPdfPreview(file) {
    if (this.pdfPreview && this.newPdfPreview) {
      // Show PDF preview in iframe
      const url = URL.createObjectURL(file);
      this.pdfPreview.src = url;
      this.pdfPreview.style.display = "block";
      
      // Show clickable link for the PDF
      this.newPdfPreview.innerHTML = `<a href="#" class="new-pdf-preview-link">${file.name}</a>`;
      this.newPdfPreview.style.display = "block";
      
      // Add click event to open the file in new tab
      const link = this.newPdfPreview.querySelector('.new-pdf-preview-link');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (this.selectedFile) {
            const url = URL.createObjectURL(this.selectedFile);
            window.open(url, '_blank');
          }
        });
      }
      
      // Store the object URL to revoke it later
      if (this.previousPdfUrl) {
        URL.revokeObjectURL(this.previousPdfUrl);
      }
      this.previousPdfUrl = url;
    }
  }

  hidePdfPreview() {
    if (this.newPdfPreview) {
      this.newPdfPreview.style.display = "none";
      this.newPdfPreview.innerHTML = "";
    }
    
    if (this.pdfPreview) {
      this.pdfPreview.style.display = "none";
      this.pdfPreview.src = "";
      // Revoke object URL to prevent memory leaks
      if (this.previousPdfUrl) {
        URL.revokeObjectURL(this.previousPdfUrl);
        this.previousPdfUrl = null;
      }
    }
    
    // Clear the input field
    this.updateFilePath('');
  }

  updateFilePath(fileName) {
    const filePathInput = this.shadowRoot.getElementById("filePathInput");
    if (filePathInput) {
      filePathInput.value = fileName || '';
    }
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
      this.selectedFile = null;
      this.uploadedFilePath = '';
      this.hidePdfPreview();
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
      if (this.savedFormData.reportId) this.reportId.value = this.savedFormData.reportId;
      if (this.savedFormData.dateSubmission) this.dateSubmission.value = this.savedFormData.dateSubmission;
      if (this.savedFormData.userId) this.userId.value = this.savedFormData.userId;
      if (this.savedFormData.department) this.department.value = this.savedFormData.department;
      if (this.savedFormData.title) this.title.value = this.savedFormData.title;
      if (this.savedFormData.content) this.content.value = this.savedFormData.content;
      
      // Restore PDF preview if it was selected
      if (this.savedFormData.hasFile && this.selectedFile) {
        this.updateFilePath(this.selectedFile.name);
        this.showPdfPreview(this.selectedFile);
      }
      
      // Reopen modal (this will show it)
      this.modal.classList.add("show");
      document.body.style.overflow = "hidden";
      
      // Show error message after opening (so it's visible)
      if (this.savedFormData.errorMessage) {
        this.showError(this.savedFormData.errorMessage);
      }
    }
  }

  showLoadingState() {
    // Remove existing loading state if any
    const existing = document.querySelector("loading-state");
    if (existing) existing.remove();
    
    this.loadingState = document.createElement("loading-state");
    this.loadingState.setAttribute("subheader", "Submitting report");
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

  async fetchNewReportId() {
    try {
      const formData = new FormData()
      formData.append('action', 'getNextID')
      
      const res = await fetch("./php_folder/manageAccomplishmentReports.php", {
        method: "POST",
        body: formData
      });

      const text = await res.text();
      const json = JSON.parse(text);
      
      if (json.success) {
        this.reportId.value = json.reportId;
        this.reportId.readOnly = true;
      } else {
        // Fallback if PHP fails
        const placeholderId = "RPT-" + new Date().getTime().toString().slice(-6);
        this.reportId.value = placeholderId;
        this.reportId.readOnly = true;
        this.showError("Could not get Report ID from server. Using temporary ID.");
      }
    } catch (err) {
      console.error("Error fetching ID:", err);
      // Fallback on error
      const placeholderId = "RPT-" + new Date().getTime().toString().slice(-6);
      this.reportId.value = placeholderId;
      this.reportId.readOnly = true;
      this.showError("Could not get Report ID. Using temporary ID.");
    }
  }

  async fetchUserData() {
    try {
      // Check window.userData first (injected by PHP in deptadmin.php)
      console.log("Checking window.userData:", window.userData);
      
      if (window.userData && window.userData.user_id) {
        // user_dept from users database is used as the Department field value
        const userDept = window.userData.user_dept || window.userData.userDept || '';
        console.log("Using window.userData - user_id:", window.userData.user_id, "user_dept:", userDept);
        
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        this.autoFillUserFields(window.userData.user_id, userDept);
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
        console.log("User data API response:", result);
        
        if (result.success && result.data) {
          // user_dept from users database is equivalent to the Department field
          // The value must match one of the dropdown options for proper selection
          const userDept = result.data.user_dept || result.data.userDept || '';
          console.log("Setting user data from API - user_id:", result.data.user_id, "user_dept:", userDept);
          
          // Small delay to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          this.autoFillUserFields(result.data.user_id, userDept);
        } else {
          console.warn("Could not fetch user data:", result.message);
        }
      } else {
        const errorText = await response.text();
        console.warn("Failed to fetch user data from API - Response status:", response.status, "Response:", errorText);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }

  autoFillUserFields(userId, department) {
    console.log("autoFillUserFields called with:", { userId, department });
    
    // Auto-fill userId field with logged-in user's user_id from users table
    if (this.userId) {
      if (userId) {
        this.userId.value = userId.toString();
        this.userId.readOnly = true;
        this.userId.style.backgroundColor = '#f5f5f5';
        this.userId.style.cursor = 'not-allowed';
        console.log("✓ User ID auto-filled:", userId);
      } else {
        console.warn("User ID field exists but no userId value provided");
      }
    } else {
      console.error("❌ User ID field not found in DOM");
    }

    // Auto-fill department field with logged-in user's user_dept from users table
    // Note: The department value (user_dept) must match one of the dropdown option values
    if (this.department) {
      if (department && department.trim()) {
        const deptValue = department.trim();
        console.log("Attempting to set department:", deptValue);
        console.log("Department element found:", !!this.department);
        console.log("Department options count:", this.department.options.length);
        
        // Get all option values for debugging
        const allOptions = Array.from(this.department.options).map(opt => ({
          value: opt.value,
          text: opt.text
        }));
        console.log("All dropdown options:", allOptions);
        
        // Check if value exists in dropdown options (case-sensitive match)
        const optionExists = Array.from(this.department.options).some(opt => opt.value === deptValue);
        
        if (optionExists) {
          // Temporarily enable to set value, then disable
          this.department.disabled = false;
          this.department.value = deptValue; // user_dept from users table
          this.department.disabled = true;
          this.department.style.backgroundColor = '#f5f5f5';
          this.department.style.cursor = 'not-allowed';
          console.log("✓ Department auto-filled successfully:", deptValue);
          console.log("✓ Selected option value:", this.department.value);
        } else {
          console.warn(`⚠ Department value "${deptValue}" from user_dept does not match any dropdown option`);
          
          // Try case-insensitive match as fallback
          const caseInsensitiveMatch = Array.from(this.department.options).find(opt => 
            opt.value.toLowerCase() === deptValue.toLowerCase()
          );
          
          if (caseInsensitiveMatch) {
            console.log("Found case-insensitive match, using:", caseInsensitiveMatch.value);
            this.department.disabled = false;
            this.department.value = caseInsensitiveMatch.value;
            this.department.disabled = true;
            this.department.style.backgroundColor = '#f5f5f5';
            this.department.style.cursor = 'not-allowed';
            console.log("✓ Department set via case-insensitive match");
          } else {
            // Still set it (even if it doesn't match) so the user can see what was retrieved
            this.department.disabled = false;
            // Try to set the value anyway - might work if browser is lenient
            try {
              this.department.value = deptValue;
              // If value didn't stick, it means no match
              if (this.department.value !== deptValue) {
                console.error("Failed to set department value - no matching option");
              }
            } catch (e) {
              console.error("Error setting department value:", e);
            }
            this.department.disabled = true;
            this.department.style.backgroundColor = '#fff3cd'; // Yellow background to indicate mismatch
            this.department.style.cursor = 'not-allowed';
          }
        }
      } else {
        console.warn("Department field exists but no department value provided (empty or null)");
      }
    } else {
      console.error("❌ Department field not found in DOM");
    }
  }

  async handleSubmit() {
    // Enable disabled fields before form submission (they won't be included in FormData if disabled)
    const wasDepartmentDisabled = this.department && this.department.disabled;
    if (wasDepartmentDisabled) {
      this.department.disabled = false;
    }

    // Get form data after enabling fields
    const formData = new FormData(this.form);
    
    // Add the selected file to formData if it exists
    if (this.selectedFile) {
      formData.append('reportFile', this.selectedFile);
    }
    
    const data = Object.fromEntries(formData.entries());

    // Validation
    if (
      !data.reportId ||
      !data.dateSubmission ||
      !data.userId ||
      !data.department ||
      !data.title ||
      !data.content
    ) {
      // Re-disable if validation fails
      if (wasDepartmentDisabled) {
        this.department.disabled = true;
      }
      this.showError("Please fill in all required fields.");
      return;
    }

    // Check if a file is selected
    if (!this.selectedFile) {
      this.showError("Please attach a PDF file.");
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
          hasFile: !!this.selectedFile,
          errorMessage: null
        };
        
        // Close modal immediately and show loading state
        this.closeModal(true); // Keep data for error recovery
        this.showLoadingState();
        
        try {
          // Prepare form data for file upload
          const submitFormData = new FormData();
          submitFormData.append('action', 'save');
          
          // Convert date to DATETIME format for PHP
          // Since dateSubmission represents "today", use current date/time in MySQL format
          const now = new Date();
          const dateSubmissionValue = now.toISOString().slice(0, 19).replace('T', ' '); // Format: YYYY-MM-DD HH:MM:SS
          
          // Add all form fields with converted date
          Object.keys(data).forEach(key => {
            if (key === 'dateSubmission') {
              submitFormData.append('dateSubmission', dateSubmissionValue);
            } else {
              submitFormData.append(key, data[key]);
            }
          });
          
          // Add the selected file if it exists
          if (this.selectedFile) {
            submitFormData.append('reportFile', this.selectedFile);
            console.log("File attached:", this.selectedFile.name, "Size:", this.selectedFile.size);
          } else {
            console.error("No file selected!");
          }
          
          // Debug: Log form data (without file for security)
          console.log("Submitting report:", {
            reportId: data.reportId,
            dateSubmission: dateSubmissionValue,
            userId: data.userId,
            department: data.department,
            title: data.title,
            hasFile: !!this.selectedFile
          });
          
          const response = await fetch("./php_folder/manageAccomplishmentReports.php", {
            method: "POST",
            body: submitFormData
          });
          
          const responseText = await response.text();
          console.log("Server response:", responseText);
          
          // Better error handling for JSON parsing
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Response text:", responseText);
            throw new Error("Invalid server response. Please check server logs.");
          }

          if (result.success) {
            // Hide loading state first
            this.hideLoadingState();
            
            // Re-disable department field after successful submission
            if (wasDepartmentDisabled) {
              this.department.disabled = true;
            }

            // Dispatch event to parent
            this.dispatchEvent(
              new CustomEvent("report-saved", {
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
            successModal.setAttribute("message", "✅ Report Submitted Successfully!");
            document.body.appendChild(successModal);

            // Clean up - close modal completely
            this.closeModal();
          } else {
            // Re-disable department field on error
            if (wasDepartmentDisabled) {
              this.department.disabled = true;
            }
            
            // Hide loading state
            this.hideLoadingState();
            
            // Store error message and reopen modal
            this.savedFormData.errorMessage = result.message || "An error occurred while submitting.";
            
            // Reopen the modal with error displayed
            this.reopenModal();
          }
        } catch (err) {
          console.error("Submit error:", err);
          
          // Re-disable department field on error
          if (wasDepartmentDisabled) {
            this.department.disabled = true;
          }
          
          // Hide loading state
          this.hideLoadingState();
          
          // Store error message and reopen modal
          this.savedFormData.errorMessage = "Failed to submit. Check your internet or server.";
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
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          height: 100%;
        }
        .form-section { display: flex; flex-direction: column; }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .file-section { display: flex; flex-direction: column; justify-content: flex-start; }
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
        .form-control.textarea { resize: none; font-family: inherit; background-color: white !important; }
        input.form-control, textarea.form-control, select.form-control { background-color: white !important; }
        input.form-control:focus, textarea.form-control:focus, select.form-control:focus { background-color: white !important; }
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
        .file-input { position: absolute; left: -9999px; opacity: 0; pointer-events: none; }
      </style>
      <div id="addReportModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 id="addReportTitle" class="modal-title">Add Accomplishment Report</h5>
              <button type="button" id="closeAddModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div id="addReportError" class="alert alert-danger"></div>
              <form id="addReportForm">
                <div class="modal-content-wrapper">
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
                        <input type="text" id="userId" name="userId" class="form-control" placeholder="Enter user ID..." required readonly>
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
                      <input type="text" id="title" name="title" class="form-control" placeholder="Enter report title..." required>
                    </div>
                    <div class="form-group">
                      <label for="content" class="form-label">Content</label>
                      <textarea id="content" name="content" class="form-control textarea" rows="8" placeholder="Enter report content..." required></textarea>
                    </div>
                  </div>
                  <div class="file-section">
                    <div class="file-upload-section">
                      <label for="filePathInput" class="file-upload-label">Attach PDF File</label>
                      <div class="file-input-container">
                        <input type="text" id="filePathInput" name="filePathInput" class="file-path-input" readonly placeholder="No file selected">
                        <button type="button" id="attachFileBtn" class="attach-file-btn">Attach File</button>
                      </div>
                      <input type="file" id="reportFile" name="reportFile" accept="application/pdf" class="file-input">
                      <iframe id="pdfPreview" class="pdf-preview" style="display: none;"></iframe>
                      <div id="newPdfPreview" class="new-pdf-preview" style="display: none;"></div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" id="submitReportBtn" class="btn btn-primary" form="addReportForm">Submit Report</button>
              <button type="button" id="cancelAddBtn" class="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

customElements.define("add-accomplishment-report-modal", AddAccomplishmentReportModal)

