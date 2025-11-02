class AddFamComOfficialsModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.selectedFile = null;
    this.uploadedImagePath = "";
    this.loadingState = null; // Reference to loading state component
  }

  async connectedCallback() {
    this.render();
    this.initializeElements();
    await this.fetchNewEmployeeId();
    this.initEventListeners();
    this.openModal();
  }

  disconnectedCallback() {
    document.body.style.overflow = "";
  }

  initializeElements() {
    this.modal = this.shadowRoot.getElementById("addFamComOfficialsModal");
    this.form = this.shadowRoot.getElementById("addFamComOfficialsForm");
    this.cancelBtn = this.shadowRoot.getElementById("cancelAddBtn");
    this.closeBtn = this.shadowRoot.getElementById("closeAddModal");
    this.employeeId = this.shadowRoot.getElementById("employeeId");
    this.employeeName = this.shadowRoot.getElementById("employeeName");
    this.position = this.shadowRoot.getElementById("position");
    this.department = this.shadowRoot.getElementById("department");
    this.imageInput = this.shadowRoot.getElementById("officialImage");
    this.imagePreview = this.shadowRoot.getElementById("imagePreview");
    this.attachBtn = this.shadowRoot.getElementById("attachFileBtn");
    this.errorDiv = this.shadowRoot.getElementById("addFamComOfficialsError");
  }

  initEventListeners() {
    // Close modal events - use handleCloseAttempt to check for user input
    this.cancelBtn.addEventListener("click", () => {
      this.handleCloseAttempt();
    });
    this.closeBtn.addEventListener("click", () => {
      this.handleCloseAttempt();
    });
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.handleCloseAttempt();
      }
    });
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) {
        this.handleCloseAttempt();
      }
    });
    this.imageInput.addEventListener("change", (e) => {
      this.handleImageSelect(e);
    });
    this.attachBtn.addEventListener("click", () => {
      this.imageInput.click();
    });
  }

  handleImageSelect(event) {
    const file = event.target.files[0];
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
        this.imagePreview.src = e.target.result;
        this.imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  }

  updateFilePath(fileName) {
    const filePathInput = this.shadowRoot.getElementById("filePathInput");
    if (filePathInput) filePathInput.value = fileName || "";
  }

  openModal() {
    this.modal.classList.add("show");
    this.clearError();
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    this.modal.classList.remove("show");
    this.form.reset();
    this.clearError();
    this.selectedFile = null;
    this.uploadedImagePath = "";
    this.imagePreview.style.display = "none";
    this.updateFilePath("");
    document.body.style.overflow = "";
    this.remove();
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

  hasUserInput() {
    // Employee ID is auto-filled; ignore it for user input detection
    // Department is auto-filled to "fc"; ignore it for user input detection
    const nameHas = (this.employeeName?.value || "").trim().length > 0;
    const positionHas = (this.position?.value || "").trim().length > 0;
    const imageHas = !!this.selectedFile;
    return nameHas || positionHas || imageHas;
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
        this.closeModal();
      } else {
        // No: keep modal open with current entries retained
        // User can continue inputting
        // Focus on first input field for better UX
        this.employeeName?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  async fetchNewEmployeeId() {
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'getNextEmployeeId');
      formData.append('dept', 'fc');
      const response = await fetch('./php_folder/manageFamComOfficials.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      const text = await response.text();
      console.log("🪵 Raw response from PHP (FC):", text);
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error("⛔ Server did not return valid JSON:", text);
        this.showError("Server returned invalid response. Check backend.");
        return;
      }
      if (json.success) {
        this.employeeId.value = json.employeeId;
        this.employeeId.readOnly = true;
        console.log("✅ Loaded next Employee ID (FC):", json.employeeId);
      } else {
        this.employeeId.value = 1;
        this.employeeId.readOnly = true;
        this.showError("Failed to load Employee ID. Using default ID.");
      }
    } catch (err) {
      console.error("Error fetching ID:", err);
      this.employeeId.value = 1;
      this.employeeId.readOnly = true;
      this.showError("Could not fetch Employee ID. Using default ID.");
    }
  }

  async handleSubmit() {
    const formData = new FormData(this.form);
    if (this.selectedFile) {
      formData.append("officialImage", this.selectedFile);
    }
    const data = Object.fromEntries(formData.entries());
    if (!data.employeeId || !data.employeeName || !data.position || !data.department) {
      this.showError("Please fill in all required fields.");
      return;
    }
    if (!this.selectedFile) {
      this.showError("Please select an official image.");
      return;
    }
    const confirmModal = document.createElement("sure-to-save-modal");
    document.body.appendChild(confirmModal);
    confirmModal.addEventListener("confirm-save", async (e) => {
      if (e.detail.confirmed) {
        // Close confirmation modal first
        confirmModal.remove();
        
        // Close modal immediately and show loading state
        this.closeModal();
        this.showLoadingState();
        
        try {
          const submitFormData = new FormData();
          submitFormData.append("action", "save");
          submitFormData.append("employeeId", data.employeeId);
          submitFormData.append("name", data.employeeName);
          submitFormData.append("position", data.position);
          submitFormData.append("dept", data.department);
          if (this.selectedFile) {
            submitFormData.append("officialImage", this.selectedFile);
          }
          console.log("🔄 Sending FC form data:");
          for (let [key, value] of submitFormData.entries()) {
            console.log(`${key}: ${value}`);
          }
          const response = await fetch("./php_folder/manageFamComOfficials.php", {
            method: "POST",
            body: submitFormData,
          });
          const responseText = await response.text();
          console.log("📥 Raw response from server (FC):", responseText);
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (e) {
            console.error("❌ Failed to parse JSON response:", e);
            // Hide loading and show error
            this.hideLoadingState();
            // Show error via failure modal since main modal is closed
            const failureModal = document.createElement("failure-modal");
            failureModal.setAttribute("message", "Server returned invalid response format.");
            document.body.appendChild(failureModal);
            return;
          }
          if (result.success) {
            // Hide loading state first
            this.hideLoadingState();
            
            this.dispatchEvent(new CustomEvent("official-saved", { detail: { official: data }, bubbles: true }));
            const successModal = document.createElement("success-save-modal");
            successModal.setAttribute("message", "✅ Official Added Successfully!");
            document.body.appendChild(successModal);
            this.dispatchEvent(new CustomEvent("refresh-officials-table", { bubbles: true }));
          } else {
            // Hide loading state
            this.hideLoadingState();
            
            // Show error via failure modal since main modal is closed
            const failureModal = document.createElement("failure-modal");
            failureModal.setAttribute("message", result.message || "An error occurred while saving.");
            document.body.appendChild(failureModal);
          }
        } catch (err) {
          console.error("Save error:", err);
          // Hide loading state
          this.hideLoadingState();
          
          // Show error via failure modal since main modal is closed
          const failureModal = document.createElement("failure-modal");
          failureModal.setAttribute("message", "Failed to save. Check your internet or server.");
          document.body.appendChild(failureModal);
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
                  .modal-dialog { max-width: 1200px; width: 100%; position: relative; }
                  .modal-content { background-color: white; border: 2px solid #ea580c; border-radius: 5px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden; width: 1200px; }
                  .modal-bg-logo { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('./imgs/CSWDO Pags Logo.png') no-repeat center center; background-size: 60%; opacity: 0.08; z-index: 11; pointer-events: none; }
                  .modal-header, .modal-body, .modal-footer { position: relative; z-index: 10; background-color: rgba(255, 255, 255, 0.95); }
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
                  .form-control:focus { outline: none; border-color: #c2410c; box-shadow: 0 0 0 1px #c2410c; background-color: white !important; }
                  .form-control:read-only { background-color: #f9fafb !important; cursor: not-allowed; }
                  .form-control.textarea { resize: none; font-family: inherit; background-color: white !important; }
                  input.form-control, textarea.form-control, select.form-control { background-color: white !important; }
                  input.form-control:focus, textarea.form-control:focus, select.form-control:focus { background-color: white !important; }
                  .modal-footer { padding: 1rem; display: flex; gap: 0.75rem; position: relative; z-index: 10; }
                  .btn { flex: 1; padding: 0.5rem 1rem; border-radius: 2px; font-weight: 500; cursor: pointer; border: none; font-size: 0.875rem; }
                  .btn-primary { background-color: #ea580c; color: white; }
                  .btn-primary:hover { background-color: #c2410c; }
                  .btn-secondary { background-color: transparent; color: #374151; border: 2px solid #9ca3af; }
                  .btn-secondary:hover { background-color: #f9fafb; }
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
                  .file-input { position: absolute; left: -9999px; opacity: 0; pointer-events: none; }
              </style>
              <div id="addFamComOfficialsModal" class="modal">
                  <div class="modal-dialog">
                      <div class="modal-content">
                          <div class="modal-bg-logo"></div>
                          <div class="modal-header">  
                              <h5 id="addFamComOfficialsTitle" class="modal-title">Add Family and Community Official</h5>
                              <button type="button" id="closeAddModal" class="btn-close">&times;</button>
                          </div>
                          <div class="modal-body">
                              <div id="addFamComOfficialsError" class="alert alert-danger"></div>
                              <form id="addFamComOfficialsForm">
                                  <div class="modal-content-wrapper">
                                      <div class="form-section">
                                          <div class="form-row">
                                              <div class="form-group">
                                                  <label for="employeeId" class="form-label">Employee ID</label>
                                                  <input type="text" id="employeeId" name="employeeId" class="form-control" required readonly>
                                              </div>
                                              <div class="form-group">
                                                  <label for="department" class="form-label">Department</label>
                                                  <input type="text" id="department" name="department" class="form-control" value="fc" required readonly>
                                              </div>
                                          </div>
                                          <div class="form-row">
                                              <div class="form-group">
                                                  <label for="employeeName" class="form-label">Name</label>
                                                  <input type="text" id="employeeName" name="employeeName" class="form-control" placeholder="Input official name here..." required>
                                              </div>
                                              <div class="form-group">
                                                  <label for="position" class="form-label">Position</label>
                                                  <input type="text" id="position" name="position" class="form-control" placeholder="Input official position here..." required>
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
                                              <img id="imagePreview" class="image-preview" alt="Image Preview">
                                          </div>
                                      </div>
                                  </div>
                              </form>
                          </div>
                          <div class="modal-footer">
                              <button type="submit" id="saveAddBtn" class="btn btn-primary" form="addFamComOfficialsForm">Save Official</button>
                              <button type="button" id="cancelAddBtn" class="btn btn-secondary">Cancel</button>
                          </div>
                      </div>
                  </div>
              </div>
          `;
  }
}
customElements.define("add-famcom-officials-modal", AddFamComOfficialsModal);


