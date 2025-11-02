class AddOrdinancesModal extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.selectedFile = null;
    this.uploadedFilePath = '';
    this.savedFormData = null; // Store form data for error recovery
    this.loadingState = null; // Reference to loading state component
  }

  async connectedCallback() {
    this.render();
    this.initializeElements();
    await this.fetchNewOrdinanceId(); // 🆕 fetch from backend
    this.initEventListeners();
    this.openModal();
  }

  disconnectedCallback() {
    // Clean up when modal is removed
    document.body.style.overflow = ""
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("addOrdinanceModal")
    this.form = this.shadowRoot.getElementById("addOrdinanceForm")
    this.ordinanceId = this.shadowRoot.getElementById("ordinanceId") // Added for Ordinance ID
    this.dateEnacted = this.shadowRoot.getElementById("dateEnacted") 
    this.ordinanceNo = this.shadowRoot.getElementById("ordinanceNo")
    this.ordinanceDescription = this.shadowRoot.getElementById("ordinanceDescription")
    this.pdfInput = this.shadowRoot.getElementById("ordinancePdf")
    this.attachBtn = this.shadowRoot.getElementById("attachFileBtn")

    this.errorDiv = this.shadowRoot.getElementById("addOrdinanceError")
  }

  initEventListeners() {
    // Close modal events
    this.cancelBtn = this.shadowRoot.getElementById("cancelAddBtn");
    this.closeBtn = this.shadowRoot.getElementById("closeAddModal");
    
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

    // PDF upload handling
    this.pdfInput.addEventListener("change", (e) => {
      this.handlePdfSelect(e);
    });

    this.attachBtn.addEventListener("click", () => {
      this.pdfInput.click();
    });

    // Ordinance number validation - only allow numbers and dashes
    this.ordinanceNo.addEventListener("input", (e) => {
      const value = e.target.value;
      const filteredValue = value.replace(/[^0-9\-]/g, '');
      if (value !== filteredValue) {
        e.target.value = filteredValue;
      }
    });
  }

  hasUserInput() {
    // Ordinance ID is auto-filled; ignore it for user input detection
    const dateHas = (this.dateEnacted?.value || "").trim().length > 0;
    const ordinanceNoHas = (this.ordinanceNo?.value || "").trim().length > 0;
    const descHas = (this.ordinanceDescription?.value || "").trim().length > 0;
    const pdfHas = !!this.selectedFile;
    return dateHas || ordinanceNoHas || descHas || pdfHas;
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
        this.dateEnacted?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  handlePdfSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.showError('Please select a valid PDF file.');
        this.pdfInput.value = '';
        this.updateFilePath('');
        this.hidePdfPreview();
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.showError('File size too large. Maximum size is 10MB.');
        this.pdfInput.value = '';
        this.updateFilePath('');
        this.hidePdfPreview();
        return;
      }

      this.selectedFile = file;
      this.updateFilePath(file.name);
      this.showPdfPreview(file);
    }
  }

  updateFilePath(fileName) {
    const filePathInput = this.shadowRoot.getElementById("filePathInput");
    if (filePathInput) {
      filePathInput.value = fileName || '';
    }
  }

  extractFileName(filePath) {
    if (!filePath) return '';
    // Extract filename from path (handle both forward and backward slashes)
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1] || filePath;
  }

  showPdfPreview(file) {
    const newPdfPreview = this.shadowRoot.getElementById("newPdfPreview");
    const pdfPreview = this.shadowRoot.getElementById("pdfPreview");
    
    if (newPdfPreview && pdfPreview) {
      // Update the file path input to show the new file name
      this.updateFilePath(file.name);
      
      // Show PDF preview in iframe
      const url = URL.createObjectURL(file);
      pdfPreview.src = url;
      pdfPreview.style.display = "block";
      
      // Also show a clickable link for the new PDF preview
      newPdfPreview.innerHTML = `<a href="#" class="new-pdf-preview-link">${file.name}</a>`;
      newPdfPreview.style.display = "block";
      
      // Add click event to open the file
      const link = newPdfPreview.querySelector('.new-pdf-preview-link');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.selectedFile) {
          const url = URL.createObjectURL(this.selectedFile);
          window.open(url, '_blank');
        }
      });
    }
  }

  hidePdfPreview() {
    const newPdfPreview = this.shadowRoot.getElementById("newPdfPreview");
    const pdfPreview = this.shadowRoot.getElementById("pdfPreview");
    
    if (newPdfPreview) {
      newPdfPreview.style.display = "none";
      newPdfPreview.textContent = "";
    }
    
    if (pdfPreview) {
      pdfPreview.style.display = "none";
      pdfPreview.src = "";
      // Revoke object URL to prevent memory leaks
      if (pdfPreview.src && pdfPreview.src.startsWith('blob:')) {
        URL.revokeObjectURL(pdfPreview.src);
      }
    }
    
    // Clear the input field
    this.updateFilePath('');
  }

  async fetchNewOrdinanceId() {
    try {
      console.log("🔄 Fetching next ordinance ID...");
      const res = await fetch("./php_folder/manageOrdinances.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getNextID" }),
      });

      const text = await res.text();
      console.log("🪵 Raw response from PHP:", text);

      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error("⛔ Server did not return valid JSON:", text);
        this.showError("Server returned invalid response. Check backend.");
        return;
      }

      console.log("📋 Parsed JSON:", json);

      if (json.success) {
        console.log("✅ Next ID received:", json.ordinanceId);
        this.ordinanceId.value = json.ordinanceId;
        this.ordinanceId.readOnly = true;
      } else {
        console.error("❌ Failed to get next ID:", json.message);
        this.showError("Failed to load Ordinance ID: " + (json.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error fetching ID:", err);
      this.showError("Could not get Ordinance ID: " + err.message);
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
      this.updateFilePath('');
      this.hidePdfPreview();
      this.savedFormData = null;
    }
    document.body.style.overflow = ""
    // Remove the modal from DOM only if not keeping data (for error recovery)
    if (!keepData) {
      this.remove()
    }
  }

  reopenModal() {
    if (!this.savedFormData) return;
    // Restore field values
    if (this.savedFormData.ordinanceId) this.ordinanceId.value = this.savedFormData.ordinanceId;
    if (this.savedFormData.dateEnacted) this.dateEnacted.value = this.savedFormData.dateEnacted;
    if (this.savedFormData.ordinanceNo) this.ordinanceNo.value = this.savedFormData.ordinanceNo;
    if (this.savedFormData.ordinanceDescription) this.ordinanceDescription.value = this.savedFormData.ordinanceDescription;
    
      // Restore PDF preview if any
      if (this.savedFormData.hasPdf && this.selectedFile) {
        this.updateFilePath(this.selectedFile.name);
        this.showPdfPreview(this.selectedFile);
      }
    
    // Show the modal again
    this.modal.classList.add("show")
    document.body.style.overflow = "hidden"
    
    // Show error after opening
    if (this.savedFormData.errorMessage) {
      this.showError(this.savedFormData.errorMessage)
    }
  }

  // Loading state helpers
  showLoadingState() {
    const existing = document.querySelector("loading-state");
    if (existing) existing.remove();
    this.loadingState = document.createElement("loading-state");
    this.loadingState.setAttribute("subheader", "Saving ordinance entry");
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

  showError(message) {
    this.errorDiv.textContent = message
    this.errorDiv.classList.add("show")
  }

  clearError() {
    this.errorDiv.textContent = ""
    this.errorDiv.classList.remove("show")
  }

  async handleSubmit() {
    const formData = new FormData(this.form);
    
    // Add the selected file to formData if it exists
    if (this.selectedFile) {
      formData.append('ordinancePdf', this.selectedFile);
    }
    
    const data = Object.fromEntries(formData.entries());

    // Correct key names based on <input name="...">
    if (
      !data.ordinanceId ||
      !data.dateEnacted ||
      !data.ordinanceNo ||  
      !data.ordinanceDescription     
    ) {
      this.showError("Please fill in all required fields.");
      return;
    }

    // Check if a PDF is selected
    if (!this.selectedFile) {
      this.showError("Please select a PDF file.");
      return;
    }

    // Show confirmation modal first
    const confirmModal = document.createElement("sure-to-save-modal");
    document.body.appendChild(confirmModal);
    
    // Listen for confirmation - use the correct event name
    confirmModal.addEventListener("confirm-save", async (e) => {
      if (e.detail.confirmed) {
        // Close confirmation modal
        confirmModal.remove();

        // Store data for potential error recovery
        this.savedFormData = {
          ...data,
          hasPdf: !!this.selectedFile,
          errorMessage: null
        };

        // Close the form modal view and show loading state
        this.closeModal(true); // keepData
        this.showLoadingState();
        try {
          // Prepare form data for file upload
          const submitFormData = new FormData();
          submitFormData.append('action', 'save');
          
          // Add all form fields
          Object.keys(data).forEach(key => {
            submitFormData.append(key, data[key]);
          });
          
          // Add the selected file if it exists
          if (this.selectedFile) {
            submitFormData.append('ordinancePdf', this.selectedFile);
          }
          
          // Debug: Log what we're sending
          console.log("🔄 Sending form data:");
          for (let [key, value] of submitFormData.entries()) {
            console.log(`${key}: ${value}`);
          }
          
          // Send data to your PHP script
          const response = await fetch("./php_folder/manageOrdinances.php", {
            method: "POST",
            body: submitFormData
          });
          
          // Debug: Log the raw response
          const responseText = await response.text();
          console.log("📥 Raw response from server:", responseText);
          
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (e) {
            console.error("❌ Failed to parse JSON response:", e);
            this.hideLoadingState();
            this.savedFormData.errorMessage = "Server returned invalid response format.";
            this.reopenModal();
            return;
          }

          if (result.success) {
            this.hideLoadingState();
            // ✅ Dispatch event to parent
            this.dispatchEvent(
              new CustomEvent("ordinance-saved", {
                detail: { ordinance: data },
                bubbles: true,  
              })
            );

            // ✅ Show success modal
            const successModal = document.createElement("success-save-modal");
            successModal.setAttribute("message", "✅ Ordinance Added Successfully!");
            document.body.appendChild(successModal);

            // Dispatch refresh event to parent component first
            this.dispatchEvent(
              new CustomEvent("refresh-ordinances-table", {
                bubbles: true,
              })
            );

            // ✅ Fully close the form modal
            this.closeModal();
          } else {
            // Server responded but something went wrong
            this.hideLoadingState();
            this.savedFormData.errorMessage = result.message || "An error occurred while saving.";
            this.reopenModal();
          }
        } catch (err) {
          console.error("Save error:", err);
          this.hideLoadingState();
          this.savedFormData.errorMessage = "Failed to save. Check your internet or server.";
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
                    max-width: 1605px;
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
                    width: 1605px;
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
                .modal-content-wrapper {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    height: 100%;
                }
                .form-section {
                    display: flex;
                    flex-direction: column;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }
                .pdf-section {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
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
                .alert.show {
                    display: block;
                }
                .pdf-upload-section {
                    margin-bottom: 1rem;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    max-height: 800px;
                }
                .pdf-upload-label {
                    display: block;
                    margin-bottom: 0.25rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                }
                .pdf-input-container {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .file-path-input {
                    flex: 1;
                    padding: 0.5rem;
                    border: 2px solid #ea580c;
                    border-radius: 2px;
                    font-size: 14px;
                    color: #6b7280;
                    background-color: #f9fafb !important;
                    cursor: not-allowed;
                }
                .file-path-input:read-only {
                    background-color: #f9fafb !important;
                }
                .attach-file-btn {
                    background-color: #ea580c;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    white-space: nowrap;
                }
                .attach-file-btn:hover {
                    background-color: #c2410c;
                }
                .file-input {
                    position: absolute;
                    left: -9999px;
                    opacity: 0;
                    pointer-events: none;
                }
                .pdf-preview {
                    width: 100%;
                    height: 700px;
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
            </style>
            <div id="addOrdinanceModal" class="modal">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-bg-logo"></div>
                        <div class="modal-header">
                            <h5 id="addOrdinanceTitle" class="modal-title">Add Ordinance</h5>
                            <button type="button" id="closeAddModal" class="btn-close">&times;</button>
                        </div>  
                        <div class="modal-body">
                            <div id="addOrdinanceError" class="alert alert-danger"></div>
                            <form id="addOrdinanceForm">
                                <div class="modal-content-wrapper">
                                    <!-- Left Column - Form Fields -->
                                    <div class="form-section">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="ordinanceId" class="form-label">ID</label>
                                                <input type="text" id="ordinanceId" name="ordinanceId" class="form-control" required readonly>
                                            </div>
                                            <div class="form-group">
                                                <label for="dateEnacted" class="form-label">Date Approved/Enacted</label>
                                                <input type="date" id="dateEnacted" name="dateEnacted" class="form-control" required>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label for="ordinanceNo" class="form-label">Ordinances No.</label>
                                            <input type="text" id="ordinanceNo" name="ordinanceNo" class="form-control" placeholder="e.g., Ordinance No. 2024-001" required pattern="[0-9\-]+" title="Only numbers and dashes are allowed">
                                        </div>
                                        <div class="form-group">
                                            <label for="ordinanceDescription" class="form-label">Description</label>
                                            <textarea id="ordinanceDescription" name="ordinanceDescription" class="form-control textarea" rows="8" placeholder="Enter ordinance description..." required></textarea>
                                        </div>
                                    </div>
                                    
                                    <!-- Right Column - PDF Section -->
                                    <div class="pdf-section">
                                        <div class="pdf-upload-section">
                                            <label for="filePathInput" class="pdf-upload-label">PDF File</label>
                                            <div class="pdf-input-container">
                                                <input type="text" id="filePathInput" name="filePathInput" class="file-path-input" readonly placeholder="No file selected">
                                                <button type="button" id="attachFileBtn" class="attach-file-btn">Attach File</button>
                                            </div>
                                            <input type="file" id="ordinancePdf" name="ordinancePdf" accept=".pdf" class="file-input">
                                            <iframe id="pdfPreview" class="pdf-preview" style="display: none;"></iframe>
                                            <div id="newPdfPreview" class="new-pdf-preview" style="display: none;"></div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" id="saveAddBtn" class="btn btn-primary" form="addOrdinanceForm">Save Ordinance</button>
                            <button type="button" id="cancelAddBtn" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `
  }
}
customElements.define("add-ordinances-modal", AddOrdinancesModal)
