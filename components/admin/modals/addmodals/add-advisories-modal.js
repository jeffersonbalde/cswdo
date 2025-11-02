class AddAdvisoriesModal extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.savedFormData = null; // Store form data for error recovery
    this.loadingState = null; // Reference to loading state component
  }

  async connectedCallback() {
    this.render();
    this.initializeElements();
    await this.fetchNewAdvisoryId(); // 🆕 fetch from backend
    this.initEventListeners();
    this.openModal();
  }

  disconnectedCallback() {
    // Clean up when modal is removed
    document.body.style.overflow = ""
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("addAdvisoryModal")
    this.form = this.shadowRoot.getElementById("addAdvisoryForm")
    this.cancelBtn = this.shadowRoot.getElementById("cancelAddBtn")
    this.closeBtn = this.shadowRoot.getElementById("closeAddModal")
    //Inputs
    this.advisoryId = this.shadowRoot.getElementById("advisoryId") // Added for Advisory ID
    this.advisoryTitle = this.shadowRoot.getElementById("advisoryTitle")
    this.uploadDate = this.shadowRoot.getElementById("uploadDate") // Upload date in realtime
    this.advisoryDesc = this.shadowRoot.getElementById("advisoryDescription")

    this.errorDiv = this.shadowRoot.getElementById("addAdvisoryError")
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


  }

  hasUserInput() {
    // Advisory ID is auto-filled; ignore it for user input detection
    const titleHas = (this.advisoryTitle?.value || "").trim().length > 0;
    const descHas = (this.advisoryDesc?.value || "").trim().length > 0;
    // Upload date is auto-filled, but we check if it exists
    return titleHas || descHas;
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
        this.advisoryTitle?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }



  openModal() {
    this.modal.classList.add("show")
    this.clearError()
    document.body.style.overflow = "hidden"
    // Set current date and time for upload date
    this.setCurrentDateTime();
  }

  closeModal() {
    this.modal.classList.remove("show")
    this.form.reset()
    this.clearError()
    document.body.style.overflow = ""
    // Remove the modal from DOM
    this.remove()
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

  // Loading state helpers
  showLoadingState() {
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

  // Reopen after an error to preserve entered values
  reopenModal() {
    this.modal.classList.add("show")
    document.body.style.overflow = "hidden"
    if (!this.savedFormData) return;
    if (this.savedFormData.advisoryId) this.advisoryId.value = this.savedFormData.advisoryId;
    if (this.savedFormData.advisoryTitle) this.advisoryTitle.value = this.savedFormData.advisoryTitle;
    if (this.savedFormData.uploadDate) this.uploadDate.value = this.savedFormData.uploadDate;
    if (this.savedFormData.advisoryDescription) this.advisoryDesc.value = this.savedFormData.advisoryDescription;
    if (this.savedFormData.errorMessage) this.showError(this.savedFormData.errorMessage);
  }

  setCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Save full datetime to database but only display date to user
    const dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    this.uploadDate.value = dateTimeString;
    this.uploadDate.readOnly = true;
    
    // Format date display to match view-advisories modal format: "January 15, 2024"
    const dateDisplay = this.shadowRoot.getElementById("dateDisplay");
    if (dateDisplay) {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = months[now.getMonth()];
      const displayDate = `${monthName} ${now.getDate()}, ${year}`;
      dateDisplay.textContent = displayDate;
    }
  }

  //getnewID
  async fetchNewAdvisoryId() {
    try {
      const res = await fetch("./php_folder/manageAdvisories.php", {
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
        this.advisoryId.value = json.advisoryId;
        this.advisoryId.readOnly = true;
      } else {
        this.showError("Failed to load Advisory ID.");
      }
    } catch (err) {
      console.error("Error fetching ID:", err);
      this.showError("Could not get Advisory ID.");
    }
  }

  async handleSubmit() {
    const formData = new FormData(this.form);
    
    const data = Object.fromEntries(formData.entries());

    // Correct key names based on <input name="...">
    if (
      !data.advisoryId ||
      !data.advisoryTitle ||
      !data.uploadDate ||
      !data.advisoryDescription
    ) {
      this.showError("Please fill in all required fields.");
      return;
    }

    // Show confirmation modal first
    const confirmModal = document.createElement("sure-to-save-modal");
    document.body.appendChild(confirmModal);
    
    // Listen for confirmation - use the correct event name
    confirmModal.addEventListener("confirm-save", async (e) => {
      if (e.detail.confirmed) {
        // Close the confirmation modal
        confirmModal.remove();

        // Save current data for potential error recovery
        this.savedFormData = { ...data, errorMessage: null };

        // Close the form modal and show loading state
        this.modal.classList.remove("show")
        document.body.style.overflow = ""
        this.showLoadingState();
        try {
          // Prepare form data
          const submitFormData = new FormData();
          submitFormData.append('action', 'save');
          
          // Add all form fields
          Object.keys(data).forEach(key => {
            submitFormData.append(key, data[key]);
          });
          
          // Debug: Log what we're sending
          console.log("🔄 Sending form data:");
          for (let [key, value] of submitFormData.entries()) {
            console.log(`${key}: ${value}`);
          }
          
          // Send data to your PHP script
          const response = await fetch("./php_folder/manageAdvisories.php", {
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
              new CustomEvent("advisory-saved", {
                detail: { advisory: data },
                bubbles: true,  
              })
            );

            // ✅ Show success modal
            const successModal = document.createElement("success-save-modal");
            successModal.setAttribute("message", "✅ Advisory Added Successfully!");
            document.body.appendChild(successModal);

            // Dispatch refresh event to parent component first
            this.dispatchEvent(
              new CustomEvent("refresh-advisories-table", {
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
                .image-upload-section {
                    margin-bottom: 1rem;
                }
                .image-upload-label {
                    display: block;
                    margin-bottom: 0.25rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                }
                .image-input-container {
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
                .image-preview {
                    width: 100%;
                    max-width: 100%;
                    height: 200px;
                    border: 2px solid #e5e7eb;
                    border-radius: 4px;
                    display: none;
                    object-fit: cover;
                    background-color: #f9fafb;
                }
                .file-input {
                    position: absolute;
                    left: -9999px;
                    opacity: 0;
                    pointer-events: none;
                }
            </style>
            <div id="addAdvisoryModal" class="modal">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-bg-logo"></div>
                        <div class="modal-header">
                            <h5 id="addAdvisoryTitle" class="modal-title">Add Advisory</h5>
                            <button type="button" id="closeAddModal" class="btn-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div id="addAdvisoryError" class="alert alert-danger"></div>
                            <form id="addAdvisoryForm">
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
                            <button type="submit" id="saveAddBtn" class="btn btn-primary" form="addAdvisoryForm">Save Advisory</button>
                            <button type="button" id="cancelAddBtn" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `
  }
}
customElements.define("add-advisories-modal", AddAdvisoriesModal)
