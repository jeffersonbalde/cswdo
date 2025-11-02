class ViewHeadOfficialsModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.originalData = {};
    this.selectedFile = null;
    this.uploadedImagePath = "";
    this.savedFormData = null; // Store form data for error recovery
    this.loadingState = null; // Reference to loading state component
  }

  async connectedCallback() {
    this.render();
    this.initializeElements();
    this.initEventListeners();
  }

  setOfficialId(officialId) {
    this.fetchOfficialDetails(officialId);
    this.openModal();
  }

  disconnectedCallback() {
    document.body.style.overflow = "";
  }

  initializeElements() {
    // Modal controls
    this.modal = this.shadowRoot.getElementById("viewHeadOfficialModal");
    this.form = this.shadowRoot.getElementById("viewHeadOfficialForm");
    this.closeBtn = this.shadowRoot.getElementById("closeViewModal");
    this.cancelBtn = this.shadowRoot.getElementById("closeViewBtn");
    this.saveBtn = this.shadowRoot.getElementById("saveChangeBtn");

    // Fields (replicating add modal fields but read-only)
    this.employeeId = this.shadowRoot.getElementById("employeeId");
    this.department = this.shadowRoot.getElementById("department");
    this.employeeName = this.shadowRoot.getElementById("employeeName");
    this.position = this.shadowRoot.getElementById("position");
    this.currentImage = this.shadowRoot.getElementById("currentImage");
    this.imageInput = this.shadowRoot.getElementById("officialImage");
    this.imagePreview = this.shadowRoot.getElementById("imagePreview");
    this.attachBtn = this.shadowRoot.getElementById("attachFileBtn");

    this.errorDiv = this.shadowRoot.getElementById("viewHeadOfficialError");
  }

  initEventListeners() {
    // Close modal buttons - use handleCloseAttempt to check for unsaved changes
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

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) {
        this.handleCloseAttempt();
      }
    });

    // Form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Input change detection to toggle Save
    ["employeeName", "position"].forEach((key) => {
      const input = this[key];
      if (input) {
        input.addEventListener("input", () => this.checkFormChanges());
      }
    });

    // Image upload handling
    if (this.imageInput) {
      this.imageInput.addEventListener("change", (e) => this.handleImageSelect(e));
    }
    if (this.attachBtn) {
      this.attachBtn.addEventListener("click", () => this.imageInput && this.imageInput.click());
    }
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
      this.selectedFile = null;
      this.uploadedImagePath = "";
      if (this.imagePreview) this.imagePreview.style.display = "none";
      if (this.currentImage) this.currentImage.style.display = "block";
      if (this.currentImage) this.currentImage.src = "";
      this.updateFilePath("");
      this.savedFormData = null;
    }
    document.body.style.overflow = "";
    // Remove the modal from DOM only if not keeping data (for error recovery)
    if (!keepData) {
      this.remove();
    }
  }

  reopenModal() {
    if (this.savedFormData) {
      // Restore form data
      if (this.savedFormData.employeeId) this.employeeId.value = this.savedFormData.employeeId;
      if (this.savedFormData.name) this.employeeName.value = this.savedFormData.name;
      if (this.savedFormData.position) this.position.value = this.savedFormData.position;
      if (this.savedFormData.dept) this.department.value = this.savedFormData.dept;
      
      // Restore image state
      if (this.savedFormData.hasImage && this.selectedFile) {
        this.updateFilePath(this.selectedFile.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (this.imagePreview) {
            this.imagePreview.src = e.target.result;
            this.imagePreview.style.display = "block";
          }
          if (this.currentImage) this.currentImage.style.display = "none";
        };
        reader.readAsDataURL(this.selectedFile);
      } else if (this.savedFormData.originalPicture) {
        // Restore original image
        if (this.currentImage) {
          this.currentImage.src = this.savedFormData.originalPicture;
          this.currentImage.style.display = "block";
        }
        if (this.imagePreview) this.imagePreview.style.display = "none";
        this.updateFilePath(this.extractFileName(this.savedFormData.originalPicture));
      }
      
      // Reopen modal (this will show it)
      this.modal.classList.add("show");
      document.body.style.overflow = "hidden";
      
      // Show error message after opening (so it's visible)
      if (this.savedFormData.errorMessage) {
        this.showError(this.savedFormData.errorMessage);
      }
      
      // Re-enable save button since there are changes
      if (this.saveBtn) this.saveBtn.disabled = false;
    }
  }

  showError(message, type = "error") {
    this.errorDiv.textContent = message;
    this.errorDiv.className = `alert ${type === "success" ? "alert-success" : "alert-danger"}`;
    this.errorDiv.classList.add("show");
  }

  clearError() {
    this.errorDiv.textContent = "";
    this.errorDiv.classList.remove("show");
  }

  showLoadingState() {
    // Remove existing loading state if any
    const existing = document.querySelector("loading-state");
    if (existing) existing.remove();
    
    this.loadingState = document.createElement("loading-state");
    this.loadingState.setAttribute("subheader", "Saving service entry");
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

  handleImageSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        this.showError("Please select a valid image file (JPG, PNG, or GIF).");
        this.imageInput.value = "";
        this.updateFilePath("");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showError("File size too large. Maximum size is 5MB.");
        this.imageInput.value = "";
        this.updateFilePath("");
        return;
      }
      this.selectedFile = file;
      this.updateFilePath(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.imagePreview) {
          this.imagePreview.src = e.target.result;
          this.imagePreview.style.display = "block";
        }
        if (this.currentImage) this.currentImage.style.display = "none";
      };
      reader.readAsDataURL(file);
      this.checkFormChanges();
    }
  }

  updateFilePath(fileName) {
    const filePathInput = this.shadowRoot.getElementById("filePathInput");
    if (filePathInput) filePathInput.value = fileName || "";
  }

  extractFileName(filePath) {
    if (!filePath) return "";
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1] || filePath;
  }

  async fetchOfficialDetails(officialId) {
    try {
      const form = new URLSearchParams();
      form.append("action", "getOfficialById");
      form.append("official_id", officialId);

      const res = await fetch("./php_folder/manageHeadOfficials.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        this.showError("Invalid server response.");
        return;
      }

      if (json.success && json.data) {
        const data = json.data;
        this.employeeId.value = data.employeeId ?? "";
        this.department.value = data.dept ?? "Head Official";
        this.employeeName.value = data.name ?? "";
        this.position.value = data.position ?? "";

        if (data.picture) {
          this.currentImage.src = data.picture;
          this.currentImage.style.display = "block";
        } else {
          this.currentImage.style.display = "none";
        }

        // Update the file path text input to show the current image file name
        this.updateFilePath(this.extractFileName(data.picture));

        this.originalData = { ...data };
        // Disable save initially
        if (this.saveBtn) this.saveBtn.disabled = true;
      } else {
        this.showError(json.message || "Official not found.");
      }
    } catch (err) {
      this.showError("Could not fetch official details.");
    }
  }

  hasUnsavedChanges() {
    // Check if originalData is empty (data not loaded yet)
    if (!this.originalData || Object.keys(this.originalData).length === 0) {
      return false;
    }

    const currentData = {
      employeeId: (this.employeeId.value || "").trim(),
      name: (this.employeeName.value || "").trim(),
      position: (this.position.value || "").trim(),
      dept: (this.department.value || "").trim()
    };

    // Compare fields against originalData
    for (const key of ["name", "position"]) {
      const orig = this.originalData[key] != null ? String(this.originalData[key]).trim() : "";
      const curr = currentData[key];
      if (curr !== orig) {
        return true;
      }
    }
    
    // Check if there is a newly selected file (image change)
    if (this.selectedFile) {
      return true;
    }
    
    return false;
  }

  checkFormChanges() {
    const currentData = {
      employeeId: (this.employeeId.value || "").trim(),
      name: (this.employeeName.value || "").trim(),
      position: (this.position.value || "").trim(),
      dept: (this.department.value || "").trim()
    };

    if (!this.saveBtn) return;
    this.saveBtn.disabled = true;

    // Compare fields against originalData
    for (const key of ["name", "position"]) {
      const orig = this.originalData[key] != null ? String(this.originalData[key]).trim() : "";
      const curr = currentData[key];
      if (curr !== orig) {
        this.saveBtn.disabled = false;
        return;
      }
    }
    // Enable save if there is a newly selected file
    if (this.selectedFile) {
      this.saveBtn.disabled = false;
      return;
    }
  }

  handleCloseAttempt() {
    // Check if user has made any changes
    if (this.hasUnsavedChanges()) {
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
        // Yes: dispose entries and close
        this.closeModal();
      } else {
        // No: keep modal open with current entries retained
        // User can continue editing
        // Focus on first editable field for better UX
        this.employeeName?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  async handleSubmit() {
    // Collect data
    const employeeId = (this.employeeId.value || "").trim();
    const name = (this.employeeName.value || "").trim();
    const position = (this.position.value || "").trim();
    const dept = (this.department.value || "").trim();

    if (!employeeId) { this.showError("Employee ID is required."); return; }
    if (!name) { this.showError("Name is required."); return; }
    if (!position) { this.showError("Position is required."); return; }

    // Show confirmation modal
    const existingConfirm = document.querySelector("sure-to-save-modal");
    if (existingConfirm) existingConfirm.remove();
    const confirmModal = document.createElement("sure-to-save-modal");
    document.body.appendChild(confirmModal);

    confirmModal.addEventListener("confirm-save", async (e) => {
      if (!e.detail.confirmed) return;
      
      // Close confirmation modal first
      confirmModal.remove();
      
      // Store form data for potential error recovery
      this.savedFormData = {
        employeeId,
        name,
        position,
        dept,
        hasImage: !!this.selectedFile,
        originalPicture: this.originalData.picture || "",
        errorMessage: null
      };
      
      // Close modal immediately and show loading state
      this.closeModal(true); // Keep data for error recovery
      this.showLoadingState();
      
      try {
        const submitFormData = new FormData();
        submitFormData.append("action", "update");
        // Backend expects official_id on update
        submitFormData.append("official_id", employeeId);
        submitFormData.append("employeeId", employeeId);
        submitFormData.append("name", name);
        submitFormData.append("position", position);
        submitFormData.append("dept", dept);
        // Always include existing picture path so backend doesn't blank it out
        submitFormData.append("picture", this.originalData.picture || "");
        if (this.selectedFile) {
          submitFormData.append("officialImage", this.selectedFile);
        }

        const response = await fetch("./php_folder/manageHeadOfficials.php", {
          method: "POST",
          body: submitFormData
        });

        const text = await response.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (err) {
          console.error("❌ Failed to parse JSON response:", err);
          // Hide loading and show error
          this.hideLoadingState();
          this.savedFormData.errorMessage = "Server returned invalid response. Check backend.";
          this.reopenModal();
          return;
        }

        if (result.success) {
          // Hide loading state first
          this.hideLoadingState();
          
          // Dispatch refresh event to parent component
          this.dispatchEvent(new CustomEvent("refresh-officials-table", { bubbles: true }));
          
          // Clean up - close modal completely
          this.closeModal();
          
          // Show success modal
          const existingSuccess = document.querySelector("success-save-modal");
          if (existingSuccess) existingSuccess.remove();
          const successModal = document.createElement("success-save-modal");
          successModal.setAttribute("message", "✅ Head Official Updated Successfully!");
          document.body.appendChild(successModal);
        } else {
          // Hide loading state
          this.hideLoadingState();
          
          // Store error message and reopen modal
          this.savedFormData.errorMessage = result.message || "An error occurred while updating.";
          
          // Reopen modal with error displayed
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
        .modal-dialog { max-width: 1200px; width: 100%; position: relative; }
        .modal-content {
          background-color: white;
          border: 2px solid #ea580c;
          border-radius: 5px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          width: 1200px;
        }
        .modal-bg-logo {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: url('./imgs/CSWDO Pags Logo.png') no-repeat center center;
          background-size: 60%; opacity: 0.08; z-index: 11; pointer-events: none;
        }
        .modal-header, .modal-body, .modal-footer {
          position: relative; z-index: 10; background-color: rgba(255,255,255,0.95);
        }
        .modal-header { padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; position: relative; }
        .modal-title { margin: 0; font-size: 1.125rem; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; flex: 1; }
        .btn-close { position: absolute; top: 50%; right: 1rem; transform: translateY(-50%); background: none; border: none; font-size: 1.5rem; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 2px; z-index: 20; }
        .btn-close:hover { background-color: #f3f4f6; }
        .modal-body { padding: 1rem; position: relative; z-index: 10; }
        .modal-content-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; height: 100%; }
        .form-section { display: flex; flex-direction: column; }
        .image-section { display: flex; flex-direction: column; justify-content: flex-start; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .form-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; }
        .form-control { width: 100%; padding: 0.5rem; border: 2px solid #ea580c; border-radius: 2px; font-size: 14px; color: black; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .form-control:read-only { background-color: #f9fafb !important; cursor: not-allowed; }
        .modal-footer { padding: 1rem; display: flex; gap: 0.75rem; position: relative; z-index: 10; }
        .btn { flex: 1; padding: 0.5rem 1rem; border-radius: 2px; font-weight: 500; cursor: pointer; border: none; font-size: 0.875rem; }
        .btn-secondary { background-color: transparent; color: #374151; border: 2px solid #9ca3af; }
        .btn-secondary:hover { background-color: #f9fafb; }
        .btn-primary { background-color: #ea580c; color: white; }
        .btn-primary:hover { background-color: #c2410c; }
        .btn-primary:disabled { background-color: #9ca3af; color: #6b7280; cursor: not-allowed; }
        .alert { padding: 0.75rem; margin-bottom: 1rem; border-radius: 2px; display: none; }
        .alert-danger { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .alert-success { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #059669; }
        .alert.show { display: block; }
        .image-upload-section { margin-bottom: 1rem; height: 100%; display: flex; flex-direction: column; max-height: 500px; }
        .image-upload-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; }
        .image-input-container { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
        .file-path-input { flex: 1; padding: 0.5rem; border: 2px solid #ea580c; border-radius: 2px; font-size: 14px; color: #6b7280; background-color: #f9fafb !important; cursor: not-allowed; }
        .file-path-input:read-only { background-color: #f9fafb !important; }
        .attach-file-btn { background-color: #ea580c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 2px; cursor: pointer; font-size: 0.875rem; white-space: nowrap; }
        .attach-file-btn:hover { background-color: #c2410c; }
        .image-preview { width: 100%; max-width: 100%; height: 400px; border: 2px solid #e5e7eb; border-radius: 4px; display: none; object-fit: contain; background-color: #f9fafb; flex: 1; max-height: 400px; object-position: center; }
        .current-image { width: 100%; max-width: 100%; height: 400px; border: 2px solid #e5e7eb; border-radius: 4px; object-fit: contain; background-color: #f9fafb; flex: 1; max-height: 400px; object-position: center; }
        .file-input { position: absolute; left: -99999px; opacity: 0; pointer-events: none; width: 0; height: 0; }
        input[type="file"].file-input { position: absolute; left: -99999px; opacity: 0; pointer-events: none; width: 0; height: 0; }
      </style>
      <div id="viewHeadOfficialModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 id="viewHeadOfficialTitle" class="modal-title">View Head Official</h5>
              <button type="button" id="closeViewModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div id="viewHeadOfficialError" class="alert alert-danger"></div>
              <form id="viewHeadOfficialForm">
                <div class="modal-content-wrapper">
                  <div class="form-section">
                    <div class="form-row">
                      <div class="form-group">
                        <label for="employeeId" class="form-label">Employee ID</label>
                        <input type="text" id="employeeId" name="employeeId" class="form-control" readonly>
                      </div>
                      <div class="form-group">
                        <label for="department" class="form-label">Department</label>
                        <input type="text" id="department" name="department" class="form-control" value="Head Official" readonly>
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="employeeName" class="form-label">Name</label>
                        <input type="text" id="employeeName" name="employeeName" class="form-control" placeholder="Input official name here...">
                      </div>
                      <div class="form-group">
                        <label for="position" class="form-label">Position</label>
                        <input type="text" id="position" name="position" class="form-control" placeholder="Input official position here...">
                      </div>
                    </div>
                  </div>
                  <div class="image-section">
                    <div class="image-upload-section">
                      <label for="filePathInput" class="image-upload-label">Official Image</label>
                      <div class="image-input-container">
                        <input type="text" id="filePathInput" name="filePathInput" class="file-path-input" readonly placeholder="No file selected">
                        <button type="button" id="attachFileBtn" class="attach-file-btn">Attach File</button>
                      </div>
                      <input type="file" id="officialImage" name="officialImage" accept="image/*" class="file-input">
                      <img id="currentImage" class="current-image" alt="Official Image">
                      <img id="imagePreview" class="image-preview" alt="Image Preview" style="display:none;">
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" id="saveChangeBtn" class="btn btn-primary" form="viewHeadOfficialForm" disabled>Save changes</button>
              <button type="button" id="closeViewBtn" class="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("view-head-officials-modal", ViewHeadOfficialsModal);


