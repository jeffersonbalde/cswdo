class ViewAdvisoriesModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.originalData = {};
    this.savedFormData = null; // Store form data for error recovery
    this.loadingState = null; // Reference to loading state component
  }

  async connectedCallback() {
    this.render();
    this.initializeElements();
    this.initEventListeners();
  }

  setAdvisoryId(advisoryId) {
    this.fetchAdvisoryDetails(advisoryId);
    this.openModal();
  }

  disconnectedCallback() {
    document.body.style.overflow = "";
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("viewAdvisoryModal");
    this.form = this.shadowRoot.getElementById("viewAdvisoryForm");
    this.cancelBtn = this.shadowRoot.getElementById("closeViewBtn");
    this.closeBtn = this.shadowRoot.getElementById("closeViewModal");
    this.saveBtn = this.shadowRoot.getElementById("saveChangeBtn");
    
    // Form fields
    this.advisoryId = this.shadowRoot.getElementById("advisoryId");
    this.uploadDate = this.shadowRoot.getElementById("uploadDate");
    this.advisoryTitle = this.shadowRoot.getElementById("advisoryTitle");
    this.advisoryDesc = this.shadowRoot.getElementById("advisoryDescription");

    this.errorDiv = this.shadowRoot.getElementById("viewAdvisoryError");
  }

  initEventListeners() {
    // Close modal events
    this.cancelBtn.addEventListener("click", () => {
      this.handleCloseAttempt();
    });
    this.closeBtn.addEventListener("click", () => {
      this.handleCloseAttempt();
    });
    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.handleCloseAttempt();
      }
    });
    // Form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) {
        this.handleCloseAttempt();
      }
    });

    // Add change/input listeners to all form inputs for change detection
    [
      "advisoryTitle",
      "advisoryDescription"
    ].forEach((key) => {
      const input = this[key];
      if (input) {
        input.addEventListener("input", () => {
          console.log(`${key} field changed to:`, input.value);
          this.checkFormChanges();
        });
      }
    });

    // Direct click handler for save button as backup
    this.saveBtn.addEventListener("click", (e) => {
      if (!this.saveBtn.disabled) this.handleSubmit();
    });
  }

  openModal() {
    this.modal.classList.add("show");
    this.clearError();
    document.body.style.overflow = "hidden";
    if (this.saveBtn) this.saveBtn.disabled = true;
  }

  closeModal(keepData = false) {
    this.modal.classList.remove("show");
    if (!keepData) {
      this.form.reset();
      this.clearError();
      this.savedFormData = null;
    }
    document.body.style.overflow = "";
    // Remove the modal from DOM only if not keeping data (for error recovery)
    if (!keepData) {
      this.remove();
    }
  }

  reopenModal() {
    if (!this.savedFormData) return;
    // Reopen modal
    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";
    // Restore fields
    if (this.savedFormData.advisoryId) this.advisoryId.value = this.savedFormData.advisoryId;
    if (this.savedFormData.advisoryTitle) this.advisoryTitle.value = this.savedFormData.advisoryTitle;
    if (this.savedFormData.uploadDate) this.uploadDate.value = this.savedFormData.uploadDate;
    if (this.savedFormData.advisoryDescription) this.advisoryDesc.value = this.savedFormData.advisoryDescription;
    if (this.savedFormData.errorMessage) this.showError(this.savedFormData.errorMessage);
  }

  showLoadingState() {
    // Remove existing loading state if any
    const existing = document.querySelector("loading-state");
    if (existing) existing.remove();
    
    this.loadingState = document.createElement("loading-state");
    this.loadingState.setAttribute("subheader", "Saving advisory entry");
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

  showError(message, type = "error") {
    this.errorDiv.textContent = message;
    this.errorDiv.className = `alert ${
      type === "success" ? "alert-success" : "alert-danger"
    }`;
    this.errorDiv.classList.add("show");
  }

  clearError() {
    this.errorDiv.textContent = "";
    this.errorDiv.classList.remove("show");
  }

  async fetchAdvisoryDetails(advisoryId) {
    try {
      const res = await fetch("./php_folder/manageAdvisories.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getAdvisoryById", advisoryId }),
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        this.showError("Invalid server response.");
        return;
      }

      if (json.success && json.advisory) {
        const advisory = json.advisory;
        console.log('Advisory data loaded:', advisory);
        
        this.advisoryId.value = advisory.advisoryId;
        this.advisoryTitle.value = advisory.advisoryTitle;
        this.advisoryDesc.value = advisory.advisoryDescription;
        
        // Handle date display
        if (advisory.uploadDate) {
          const date = new Date(advisory.uploadDate);
          const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          const month = months[date.getMonth()];
          const day = date.getDate();
          const year = date.getFullYear();
          const displayDate = `${month} ${day}, ${year}`;
          
          const dateDisplay = this.shadowRoot.getElementById("dateDisplay");
          if (dateDisplay) {
            dateDisplay.textContent = displayDate;
          }
          
          // Set the hidden input value for form submission
          this.uploadDate.value = advisory.uploadDate;
        }
        
        // Store original data for change detection
        this.originalData = { ...advisory };
        console.log('Original data stored:', this.originalData);
      } else {
        this.showError("Advisory not found.");
      }
    } catch (err) {
      this.showError("Could not fetch advisory.");
    }
  }

  hasChanges() {
    // Check if there are any changes from the original data
    if (!this.originalData || Object.keys(this.originalData).length === 0) {
      return false; // No original data to compare against
    }

    const currentData = {
      advisoryId: this.advisoryId?.value.trim() || "",
      advisoryTitle: this.advisoryTitle?.value.trim() || "",
      uploadDate: this.uploadDate?.value || "",
      advisoryDescription: this.advisoryDesc?.value.trim() || "",
    };

    // Compare each field with original data
    for (const key in currentData) {
      const original = this.originalData[key] != null ? String(this.originalData[key]).trim() : "";
      const current = currentData[key];
      if (current !== original) {
        return true; // Found a change
      }
    }

    return false; // No changes detected
  }

  handleCloseAttempt() {
    // Check if user has made any changes
    if (this.hasChanges()) {
      // Show confirmation modal
      this.showCancelConfirmation();
    } else {
      // No changes, close directly
      this.closeModal();
    }
  }

  showCancelConfirmation() {
    // Remove existing instance if any
    const existing = document.querySelector("cancel-confimation-modal");
    if (existing) existing.remove();

    const cancelModal = document.createElement("cancel-confimation-modal");
    cancelModal.setAttribute("title", "Warning Action");
    cancelModal.setAttribute("message", "are you sure to cancel additional entries? Additional entries will not be saved");
    
    // Listen for user decision
    cancelModal.addEventListener("cancel-confirm", (e) => {
      if (e.detail?.confirmed) {
        // Yes: dispose changes and close
        // Reset form to original data
        this.resetToOriginalData();
        this.closeModal();
      } else {
        // No: keep modal open with current changes retained
        // User can continue editing
        this.advisoryTitle?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  resetToOriginalData() {
    // Reset form fields to original data
    if (this.originalData && Object.keys(this.originalData).length > 0) {
      if (this.advisoryId && this.originalData.advisoryId) this.advisoryId.value = this.originalData.advisoryId;
      if (this.advisoryTitle && this.originalData.advisoryTitle) this.advisoryTitle.value = this.originalData.advisoryTitle;
      if (this.advisoryDesc && this.originalData.advisoryDescription) this.advisoryDesc.value = this.originalData.advisoryDescription;
      if (this.uploadDate && this.originalData.uploadDate) this.uploadDate.value = this.originalData.uploadDate;
      
      // Reset date display
      if (this.originalData.uploadDate) {
        const date = new Date(this.originalData.uploadDate);
        const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        const displayDate = `${month} ${day}, ${year}`;
        
        const dateDisplay = this.shadowRoot.getElementById("dateDisplay");
        if (dateDisplay) {
          dateDisplay.textContent = displayDate;
        }
      }
    }

    // Update save button state
    this.checkFormChanges();
  }

  checkFormChanges() {
    const currentData = {
      advisoryId: this.advisoryId.value.trim(),
      advisoryTitle: this.advisoryTitle.value.trim(),
      uploadDate: this.uploadDate.value,
      advisoryDescription: this.advisoryDesc.value.trim(),
    };
    
    // Debug logging to help identify the issue
    console.log('Current form data:', currentData);
    console.log('Original data:', this.originalData);
    
    this.saveBtn.disabled = true;
    for (const key in currentData) {
      const original = this.originalData[key] != null ? String(this.originalData[key]).trim() : "";
      const current = currentData[key];
      console.log(`Comparing ${key}:`, { original, current, match: current === original });
      if (current !== original) {
        console.log(`Change detected in ${key}! Enabling save button.`);
        this.saveBtn.disabled = false;
        return;
      }
    }
    
    console.log('No changes detected, save button remains disabled');
  }

  async handleSubmit() {
    console.log("🔄 Starting form submission for update...");
    
    // Collect form data manually to ensure all fields are captured
    const data = {
      advisoryId: this.advisoryId.value.trim(),
      advisoryTitle: this.advisoryTitle.value.trim(),
      uploadDate: this.uploadDate.value,
      advisoryDescription: this.advisoryDesc.value.trim(),
    };
    
    // Debug logging to see what data is being collected
    console.log('Form data being submitted:', data);
    
    // Validate each field individually and show specific error messages
    if (!data.advisoryId) {
      this.showError("Advisory ID is required.");
      return;
    }
    if (!data.advisoryTitle) {
      this.showError("Advisory Title is required.");
      return;
    }
    if (!data.uploadDate) {
      this.showError("Upload Date is required.");
      return;
    }
    if (!data.advisoryDescription) {
      this.showError("Advisory Description is required.");
      return;
    }

    // Show confirmation modal first (check if one already exists)
    console.log("🔍 Showing confirmation modal...");
    const existingConfirmModal = document.querySelector("sure-to-save-modal");
    if (existingConfirmModal) {
      existingConfirmModal.remove();
    }
    const confirmModal = document.createElement("sure-to-save-modal");
    document.body.appendChild(confirmModal);
    
    // Listen for confirmation - use the correct event name
    console.log("👂 Setting up confirmation listener...");
    
    confirmModal.addEventListener("confirm-save", async (e) => {
      if (e.detail.confirmed) {
        // Close confirmation modal first
        confirmModal.remove();

        // Store form data for potential error recovery
        this.savedFormData = { ...data, errorMessage: null };

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
          
          console.log('Sending request to server with FormData');
          
          const response = await fetch("./php_folder/manageAdvisories.php", {
            method: "POST",
            body: submitFormData
          });
          
          // Handle response properly
          const text = await response.text();
          let result;
          try {
            result = JSON.parse(text);
          } catch (err) {
            console.error("Server did not return valid JSON:", text);
            // Hide loading and show error
            this.hideLoadingState();
            this.savedFormData.errorMessage = "Server returned invalid response. Check backend.";
            this.reopenModal();
            return;
          }
          console.log('Server response:', result);
          
          if (result.success) {
            console.log('🎉 Update successful!');
            
            // Hide loading state first
            this.hideLoadingState();
            
            // Dispatch event to parent
            console.log('Dispatching advisory-updated event with data:', data);
            this.dispatchEvent(
              new CustomEvent("advisory-updated", {
                detail: { advisory: data },
                bubbles: true,
              })
            );

            // Dispatch refresh event to parent component first
            this.dispatchEvent(
              new CustomEvent("refresh-advisories-table", {
                bubbles: true,
              })
            );

            // Show success modal (check if one already exists)
            console.log("🎊 Showing success modal...");
            const existingSuccessModal = document.querySelector("success-save-modal");
            if (existingSuccessModal) {
              existingSuccessModal.remove();
            }
            const successModal = document.createElement("success-save-modal");
            successModal.setAttribute("message", "✅ Advisory Updated Successfully!");
            document.body.appendChild(successModal);

            // Clean up - close modal completely
            this.closeModal();
          } else {
            console.log('Update failed:', result.message);
            // Hide loading state
            this.hideLoadingState();
            
            // Store error message and reopen modal
            this.savedFormData.errorMessage = result.message || "An error occurred while updating.";
            this.reopenModal();
          }
        } catch (err) {
          console.error("Update error:", err);
          // Hide loading state
          this.hideLoadingState();
          
          // Store error message and reopen modal
          this.savedFormData.errorMessage = "Failed to update. Check your internet or server.";
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
                .modal.show {
                    display: flex;
                }
                .modal-dialog {
                    max-width: 950px;
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
                    width: 950px;
                }
                .modal-bg-logo {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: url('./imgs/CSWDO Pags Logo.png') no-repeat center center; /* Using placeholder for logo */
                    background-size: 60%;
                    opacity: 0.08;
                    z-index: 11; /* Changed z-index to be behind content */
                    pointer-events: none;
                }
                .modal-header,
                .modal-body,
                .modal-footer {
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
                .btn-close:hover {
                    background-color: #f3f4f6;
                }
                .modal-body {
                    padding: 1rem;
                    position: relative;
                    z-index: 10;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }
                .form-group {
                    margin-bottom: 1rem;
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
                .form-control:read-only {
                    background-color: #f9fafb !important;
                    cursor: not-allowed;
                }
                
                #dateDisplay {
                    background-color: #f9fafb !important;
                    color: #6b7280;
                    cursor: not-allowed;
                    border: 2px solid #ea580c;
                    border-radius: 2px;
                    padding: 0.5rem;
                    font-size: 14px;
                }
                .form-control.textarea {
                    resize: none;
                    font-family: inherit;
                    background-color: white !important;
                }
                /* Ensure all input types have white background */
                input.form-control,
                textarea.form-control,
                select.form-control {
                    background-color: white !important;
                }
                input.form-control:focus,
                textarea.form-control:focus,
                select.form-control:focus {
                    background-color: white !important;
                }
                .modal-footer {
                    padding: 1rem;
                    display: flex;
                    gap: 0.75rem;
                    position: relative;
                    z-index: 10;
                }
                .btn {
                    flex: 1;
                    padding: 0.5rem 1rem;
                    border-radius: 2px;
                    font-weight: 500;
                    cursor: pointer;
                    border: none;
                    font-size: 0.875rem;
                }
                .btn-primary {
                    background-color: #ea580c;
                    color: white;
                }
                .btn-primary:hover {
                    background-color: #c2410c;
                }
                .btn-primary:disabled {
                    background-color: #9ca3af;
                    color: #6b7280;
                    cursor: not-allowed;
                }
                .btn-secondary {
                    background-color: transparent;
                    color: #374151;
                    border: 2px solid #9ca3af;
                }
                .btn-secondary:hover {
                    background-color: #f9fafb;
                }
                .alert {
                    padding: 0.75rem;
                    margin-bottom: 1rem;
                    border-radius: 2px;
                    display: none;
                }
                .alert-danger {
                    background-color: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #dc2626;
                }
                .alert-success {
                    background-color: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    color: #059669;
                }
                .alert.show {
                    display: block;
                }
            </style>
            <div id="viewAdvisoryModal" class="modal">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-bg-logo"></div>
                        <div class="modal-header">
                            <h5 id="viewAdvisoryTitle" class="modal-title">View Advisory</h5>
                            <button type="button" id="closeViewModal" class="btn-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div id="viewAdvisoryError" class="alert alert-danger"></div>
                            <form id="viewAdvisoryForm">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="advisoryId" class="form-label">Advisory ID</label>
                                        <input type="text" id="advisoryId" name="advisoryId" class="form-control" required readonly>
                                    </div>
                                    <div class="form-group">
                                        <label for="uploadDate" class="form-label">Upload Date</label>
                                        <div id="dateDisplay" class="form-control" style="background-color: #f9fafb; color: #6b7280; cursor: not-allowed;"></div>
                                        <input type="hidden" id="uploadDate" name="uploadDate" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="advisoryTitle" class="form-label">Advisory Title</label>
                                    <input type="text" id="advisoryTitle" name="advisoryTitle" class="form-control" placeholder="Input advisory title here..." required>
                                </div>
                                <div class="form-group">
                                    <label for="advisoryDescription" class="form-label">Description</label>
                                    <textarea id="advisoryDescription" name="advisoryDescription" class="form-control textarea" rows="4" placeholder="Enter advisory description..." required></textarea>
                                </div>
                             
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" id="saveChangeBtn" class="btn btn-primary" form="viewAdvisoryForm" disabled>Save Changes</button>
                            <button type="button" id="closeViewBtn" class="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `
  }
}
customElements.define("view-advisories-modal", ViewAdvisoriesModal)
