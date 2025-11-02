class AddServiceModal extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.selectedFile = null;
    this.uploadedImagePath = '';
    this.savedFormData = null; // Store form data for error recovery
    this.loadingState = null; // Reference to loading state component
  }

async connectedCallback() {
  this.render();
  this.initializeElements();
  await this.fetchNewServiceId(); // 🆕 fetch from backend
  this.initEventListeners();
  this.openModal();
}
  disconnectedCallback() {
    // Clean up when modal is removed
    document.body.style.overflow = ""
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("addServiceModal")
    this.form = this.shadowRoot.getElementById("addServiceForm")
    this.cancelBtn = this.shadowRoot.getElementById("cancelAddBtn")
    this.closeBtn = this.shadowRoot.getElementById("closeAddModal")
    //Inputs
    this.serviceId = this.shadowRoot.getElementById("serviceId") // Added for Service ID
    this.serviceDept = this.shadowRoot.getElementById("serviceDepartment") 
    this.serviceTitle = this.shadowRoot.getElementById("serviceTitle")
    this.processDuration = this.shadowRoot.getElementById("processDuration") 
    this.serviceDesc = this.shadowRoot.getElementById("serviceDescription")
    this.serviceReq = this.shadowRoot.getElementById("serviceRequirements")
    this.canAvail = this.shadowRoot.getElementById("canAvail")
    this.imageInput = this.shadowRoot.getElementById("serviceImage")
    this.imagePreview = this.shadowRoot.getElementById("imagePreview")
    this.attachBtn = this.shadowRoot.getElementById("attachFileBtn")

    this.errorDiv = this.shadowRoot.getElementById("addServiceError")
    // Removed this.readableDate as its content is now in the dateInput
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

    // Image upload handling
    this.imageInput.addEventListener("change", (e) => {
      this.handleImageSelect(e);
    });

    this.attachBtn.addEventListener("click", () => {
      this.imageInput.click();
    });
  }

  hasUserInput() {
    // Service ID is auto-filled; ignore it for user input detection
    const titleHas = (this.serviceTitle?.value || "").trim().length > 0;
    const deptHas = (this.serviceDept?.value || "").trim().length > 0;
    const durationHas = (this.processDuration?.value || "").trim().length > 0;
    const descHas = (this.serviceDesc?.value || "").trim().length > 0;
    const reqHas = (this.serviceReq?.value || "").trim().length > 0;
    const availHas = (this.canAvail?.value || "").trim().length > 0;
    const imageHas = !!this.selectedFile;
    return titleHas || deptHas || durationHas || descHas || reqHas || availHas || imageHas;
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
        this.serviceTitle?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.showError('Please select a valid image file (JPG, PNG, or GIF).');
        this.imageInput.value = '';
        this.updateFilePath('');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.showError('File size too large. Maximum size is 5MB.');
        this.imageInput.value = '';
        this.updateFilePath('');
        return;
      }

      this.selectedFile = file;
      this.updateFilePath(file.name);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.src = e.target.result;
        this.imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
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
      this.uploadedImagePath = '';
      this.imagePreview.style.display = 'none';
      this.updateFilePath('');
      this.savedFormData = null;
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
      if (this.savedFormData.serviceId) this.serviceId.value = this.savedFormData.serviceId;
      if (this.savedFormData.serviceTitle) this.serviceTitle.value = this.savedFormData.serviceTitle;
      if (this.savedFormData.serviceDepartment) this.serviceDept.value = this.savedFormData.serviceDepartment;
      if (this.savedFormData.processDuration) this.processDuration.value = this.savedFormData.processDuration;
      if (this.savedFormData.serviceDescription) this.serviceDesc.value = this.savedFormData.serviceDescription;
      if (this.savedFormData.serviceRequirements) this.serviceReq.value = this.savedFormData.serviceRequirements;
      if (this.savedFormData.serviceWhoCanAvail) this.canAvail.value = this.savedFormData.serviceWhoCanAvail;
      
      // Restore image if it was selected
      if (this.savedFormData.hasImage && this.selectedFile) {
        this.updateFilePath(this.selectedFile.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreview.src = e.target.result;
          this.imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(this.selectedFile);
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

  showError(message, type = 'error') {
    this.errorDiv.textContent = message
    this.errorDiv.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'}`
    this.errorDiv.classList.add("show")
  }

  clearError() {
    this.errorDiv.textContent = ""
    this.errorDiv.classList.remove("show")
  }

//getnewID

async fetchNewServiceId() {
  try {
    const res = await fetch("./php_folder/manageService.php", {
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

    if (json.success) {
      this.serviceId.value = json.serviceId;
      this.serviceId.readOnly = true;
    } else {
      this.showError("Failed to load Service ID.");
    }
  } catch (err) {
    console.error("Error fetching ID:", err);
    this.showError("Could not get Service ID.");
  }
}


 async handleSubmit() {
  const formData = new FormData(this.form);
  
  // Add the selected file to formData if it exists
  if (this.selectedFile) {
    formData.append('serviceImage', this.selectedFile);
  }
  
  const data = Object.fromEntries(formData.entries());

  // Correct key names based on <input name="...">
  if (
    !data.serviceId ||
    !data.serviceTitle ||
    !data.serviceDepartment ||   // ✅ not serviceDept
    !data.processDuration ||
    !data.serviceDescription ||  // ✅ not serviceDesc
    !data.serviceRequirements || // ✅ not serviceReq
    !data.serviceWhoCanAvail     // ✅ not canAvail
  ) {
    this.showError("Please fill in all required fields.");
    return;
  }

  // Check if an image is selected
  if (!this.selectedFile) {
    this.showError("Please select a service image.");
    return;
  }

  // Show confirmation modal first
  const confirmModal = document.createElement("sure-to-save-modal");
  document.body.appendChild(confirmModal);
  
  // Listen for confirmation - use the correct event name
  confirmModal.addEventListener("confirm-save", async (e) => {
    if (e.detail.confirmed) {
      // Close confirmation modal first
      confirmModal.remove();
      
      // Store form data for potential error recovery
      this.savedFormData = {
        ...data,
        hasImage: !!this.selectedFile,
        errorMessage: null
      };
      
      // Close modal immediately and show loading state
      this.closeModal(true); // Keep data for error recovery
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
          submitFormData.append('serviceImage', this.selectedFile);
        }
        
        // Debug: Log what we're sending
        console.log("🔄 Sending form data:");
        for (let [key, value] of submitFormData.entries()) {
          console.log(`${key}: ${value}`);
        }
        
        // Send data to your PHP script
        const response = await fetch("./php_folder/manageService.php", {
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
          // Hide loading and show error
          this.hideLoadingState();
          this.savedFormData.errorMessage = "Server returned invalid response format.";
          this.reopenModal();
          return;
        }

        if (result.success) {
          // Hide loading state first
          this.hideLoadingState();
          
          // ✅ Dispatch event to parent
          this.dispatchEvent(
            new CustomEvent("service-saved", {
              detail: { service: data },
              bubbles: true,  
            })
          );

          // Dispatch refresh event to parent component
          this.dispatchEvent(
            new CustomEvent("refresh-services-table", {
              bubbles: true,
            })
          );

          // ✅ Show success modal
          const successModal = document.createElement("success-save-modal");
          successModal.setAttribute("message", "✅ Service Added Successfully!");
          document.body.appendChild(successModal);

          // Clean up - close modal completely
          this.closeModal();
        } else {
          // Hide loading state
          this.hideLoadingState();
          
          // Store error message and reopen modal
          this.savedFormData.errorMessage = result.message || "An error occurred while saving.";
          
          // Show error notice (you might want to create an error modal similar to success modal)
          // For now, we'll reopen the modal with error displayed
          this.reopenModal();
        }
      } catch (err) {
        console.error("Save error:", err);
        // Hide loading state
        this.hideLoadingState();
        
        // Store error message and reopen modal
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
                .image-section { display: flex; flex-direction: column; justify-content: flex-start; }
                .form-group { margin-bottom: 1rem; }
                .form-label {
                  display: block;
                  margin-bottom: 0.25rem;
                  font-size: 0.875rem;
                  font-weight: 500;
                  color: #374151;
                }
                .char-limit {
                  font-size: 0.75rem;
                  font-weight: 400;
                  color: #6b7280;
                  font-style: italic;
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
                .image-upload-section { margin-bottom: 1rem; height: 100%; display: flex; flex-direction: column; max-height: 500px; }
                .image-upload-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; }
                .image-input-container { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
                .file-path-input { flex: 1; padding: 0.5rem; border: 2px solid #ea580c; border-radius: 2px; font-size: 14px; color: #6b7280; background-color: #f9fafb !important; cursor: not-allowed; }
                .file-path-input:read-only { background-color: #f9fafb !important; }
                .attach-file-btn { background-color: #ea580c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 2px; cursor: pointer; font-size: 0.875rem; white-space: nowrap; }
                .attach-file-btn:hover { background-color: #c2410c; }
                .image-preview {
                  width: 100%;
                  max-width: 100%;
                  height: 400px;
                  border: 2px solid #e5e7eb;
                  border-radius: 4px;
                  display: none;
                  object-fit: contain;
                  background-color: #f9fafb;
                  flex: 1;
                  max-height: 400px;
                  object-position: center;
                }
                .file-input { position: absolute; left: -9999px; opacity: 0; pointer-events: none; }
            </style>
            <div id="addServiceModal" class="modal">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-bg-logo"></div>
                  <div class="modal-header">
                    <h5 id="addServiceTitle" class="modal-title">Add Program Services</h5>
                    <button type="button" id="closeAddModal" class="btn-close">&times;</button>
                  </div>
                  <div class="modal-body">
                    <div id="addServiceError" class="alert alert-danger"></div>
                    <form id="addServiceForm">
                      <div class="modal-content-wrapper">
                        <div class="form-section">
                          <div class="form-row">
                            <div class="form-group">
                              <label for="ServiceId" class="form-label">Service ID</label>
                              <input type="text" id="serviceId" name="serviceId" class="form-control" required readonly>
                            </div>
                            <div class="form-group">
                              <label for="addServiceDepartment" class="form-label">Department</label>
                              <select id="serviceDepartment" name="serviceDepartment" class="form-control" required>
                                <option value="">Select Department</option>
                                <option value="Child and Youth Welfare">Child and Youth Welfare</option>
                                <option value="Family and Community Based Welfare">Family and Community Based Welfare</option>
                                <option value="Emergency and Disaster Welfare">Emergency and Disaster Welfare</option>
                                <option value="Sectoral Welfare">Sectoral Welfare</option>
                              </select>
                            </div>
                          </div>
                          <div class="form-row">
                            <div class="form-group">
                              <label for="serviceTitle" class="form-label">Service Title</label>
                              <input type="text" id="serviceTitle" name="serviceTitle" class="form-control" placeholder="Input service title here..." required>
                            </div>
                            <div class="form-group">
                              <label for="processDuration" class="form-label">Process Duration</label>
                              <select id="processDuration" name="processDuration" class="form-control" required>
                                <option value="">Select Duration</option>
                                <option value="3 working days">3 working days</option>
                                <option value="5 working days">5 working days</option>
                                <option value="7 working days">7 working days</option>
                                <option value="14 working days">14 working days</option>
                              </select>
                            </div>
                          </div>
                          <div class="form-group">
                            <label for="serviceDescription" class="form-label">Description <span class="char-limit">*300 word characters</span></label>
                            <textarea id="serviceDescription" name="serviceDescription" class="form-control textarea" rows="6" placeholder="Enter service description..." required maxlength="300"></textarea>
                          </div>
                          <div class="form-row">
                            <div class="form-group">
                              <label for="serviceRequirements" class="form-label">Requirements <span class="char-limit">*150 word characters</span></label>
                              <textarea id="serviceRequirements" name="serviceRequirements" class="form-control textarea" rows="4" placeholder="ex. (PSA Certificate, Barangay Clearance, etc.)" required maxlength="150"></textarea>
                            </div>
                            <div class="form-group">
                              <label for="serviceWhoCanAvail" class="form-label">Who can Avail <span class="char-limit">*150 word characters</span></label>
                              <textarea id="canAvail" name="serviceWhoCanAvail" class="form-control textarea" rows="4" placeholder="ex. (Senior Citizens, Single Parents, etc.)" required maxlength="150"></textarea>
                            </div>
                          </div>
                        </div>
                        <div class="image-section">
                          <div class="image-upload-section">
                            <label for="filePathInput" class="image-upload-label">Service Image</label>
                            <div class="image-input-container">
                              <input type="text" id="filePathInput" name="filePathInput" class="file-path-input" readonly placeholder="No file selected">
                              <button type="button" id="attachFileBtn" class="attach-file-btn">Attach File</button>
                            </div>
                            <input type="file" id="serviceImage" name="serviceImage" accept="image/*" class="file-input">
                            <img id="imagePreview" class="image-preview" alt="Image Preview">
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div class="modal-footer">
                    <button type="submit" id="saveAddBtn" class="btn btn-primary" form="addServiceForm">Save Service</button>
                    <button type="button" id="cancelAddBtn" class="btn btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
        `
  }
}
customElements.define("add-service-modal", AddServiceModal)
