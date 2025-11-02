class ViewOrdinancesModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.selectedFile = null;
    this.uploadedFilePath = '';
    this.savedFormData = null; // Store form data for error recovery
    this.loadingState = null; // Reference to loading state component
  }

  async connectedCallback() {
    this.render();
    this.initializeElements();
    this.initEventListeners();
    this.originalData = {};
  }

  setOrdinanceId(ordinanceId) {
    this.fetchOrdinanceDetails(ordinanceId);
    this.openModal();
  }

  disconnectedCallback() {
    document.body.style.overflow = "";
  }

  initializeElements() {
    // Always use the same property names as the HTML id/name
    this.modal = this.shadowRoot.getElementById("ViewOrdinanceModal");
    this.form = this.shadowRoot.getElementById("viewOrdinanceForm");
    this.closeBtn2 = this.shadowRoot.getElementById("closeViewBtn");
    this.closeBtn1 = this.shadowRoot.getElementById("closeViewModal");
    this.saveBtn = this.shadowRoot.getElementById("saveChangeBtn");
    this.errorDiv = this.shadowRoot.getElementById("viewOrdinanceError");
    
    // Form fields - matching the actual database structure
    this.ordinanceId = this.shadowRoot.getElementById("ordinanceId");
    this.dateEnacted = this.shadowRoot.getElementById("dateEnacted");
    this.ordinanceNo = this.shadowRoot.getElementById("ordinanceNo");
    this.ordinanceDescription = this.shadowRoot.getElementById("ordinanceDescription");
    this.pdfInput = this.shadowRoot.getElementById("ordinancePdf");
    this.uploadBtn = this.shadowRoot.getElementById("uploadPdfBtn");
    this.currentPdf = this.shadowRoot.getElementById("currentPdf");
    this.currentPdfLink = this.shadowRoot.getElementById("currentPdfLink");
    this.pdfPreview = this.shadowRoot.getElementById("pdfPreview");
    
    // Debug: Check if all elements are found
    console.log("Form elements initialized:", {
      modal: !!this.modal,
      form: !!this.form,
      ordinanceId: !!this.ordinanceId,
      dateEnacted: !!this.dateEnacted,
      ordinanceNo: !!this.ordinanceNo,
      ordinanceDescription: !!this.ordinanceDescription,
      pdfInput: !!this.pdfInput,
      uploadBtn: !!this.uploadBtn,
      currentPdf: !!this.currentPdf
    });
  }

  initEventListeners() {
    // Close modal events
    this.closeBtn2.addEventListener("click", () => this.handleCloseAttempt());
    this.closeBtn1.addEventListener("click", () => this.handleCloseAttempt());
    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.handleCloseAttempt();
    });
    // Form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) this.handleCloseAttempt();
    });
    
    // Add change/input listeners to all form inputs
    [
      "dateEnacted",
      "ordinanceNo",
      "ordinanceDescription"
    ].forEach((key) => {
      const input = this[key];
      if (input) {
        // For select elements, use 'change' event; for others, use 'input' event
        const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(eventType, () => {
          console.log(`${key} field changed to:`, input.value);
          this.checkFormChanges();
        });
      }
    });
    
    // Direct click handler for save button as backup
    this.saveBtn.addEventListener("click", (e) => {
      if (!this.saveBtn.disabled) this.handleSubmit();
    });

    // PDF upload handling
    this.pdfInput.addEventListener("change", (e) => {
      this.handlePdfSelect(e);
    });

    this.uploadBtn.addEventListener("click", () => {
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

  handlePdfSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.showError('Please select a valid PDF file.');
        this.pdfInput.value = '';
        this.updateFilePath('');
        this.hideNewPdfPreview();
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.showError('File size too large. Maximum size is 10MB.');
        this.pdfInput.value = '';
        this.updateFilePath('');
        this.hideNewPdfPreview();
        return;
      }

      this.selectedFile = file;
      this.updateFilePath(file.name);
      this.showNewPdfPreview(file);
      
      this.checkFormChanges();
    }
  }

  updateFilePath(fileName) {
    const filePathInput = this.shadowRoot.getElementById("filePathInput");
    if (filePathInput) {
      // Always show the selected file name, not the original path
      filePathInput.value = fileName || '';
    }
  }

  extractFileName(filePath) {
    if (!filePath) return '';
    // Extract filename from path (handle both forward and backward slashes)
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1] || filePath;
  }

  showNewPdfPreview(file) {
    const newPdfPreview = this.shadowRoot.getElementById("newPdfPreview");
    const currentPdf = this.shadowRoot.getElementById("currentPdf");
    const currentPdfLink = this.shadowRoot.getElementById("currentPdfLink");
    const pdfPreview = this.shadowRoot.getElementById("pdfPreview");
    
    if (newPdfPreview && pdfPreview) {
      // Hide the current PDF when showing new preview
      if (currentPdf) {
        currentPdf.style.display = "none";
      }
      if (currentPdfLink) {
        currentPdfLink.style.display = "none";
      }
      
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

  hideNewPdfPreview() {
    const newPdfPreview = this.shadowRoot.getElementById("newPdfPreview");
    const currentPdf = this.shadowRoot.getElementById("currentPdf");
    const currentPdfLink = this.shadowRoot.getElementById("currentPdfLink");
    const pdfPreview = this.shadowRoot.getElementById("pdfPreview");
    
    if (newPdfPreview) {
      newPdfPreview.style.display = "none";
      newPdfPreview.textContent = "";
    }
    
    if (pdfPreview) {
      pdfPreview.style.display = "none";
      pdfPreview.src = "";
    }
    
    // Show the current PDF again if it exists and restore original filename in input
    if (this.originalData && this.originalData.pdfPath) {
      if (currentPdf) {
        currentPdf.src = this.originalData.pdfPath;
        currentPdf.style.display = "block";
      }
      if (currentPdfLink) {
        currentPdfLink.href = this.originalData.pdfPath;
        currentPdfLink.style.display = "block";
      }
      // Restore the original filename in the input field
      this.updateFilePath(this.extractFileName(this.originalData.pdfPath));
    } else {
      // If no original PDF, clear the input field
      this.updateFilePath('');
    }
  }

  openModal() {
    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";
    if (this.saveBtn) this.saveBtn.disabled = true;
  }

  closeModal(keepData = false) {
    this.modal.classList.remove("show");
    if (!keepData) {
      this.form.reset();
      this.selectedFile = null;
      this.uploadedFilePath = '';
      this.updateFilePath('');
      this.hideNewPdfPreview();
      // Reset PDF preview elements
      if (this.pdfPreview) {
        this.pdfPreview.style.display = 'none';
        this.pdfPreview.src = '';
      }
      if (this.currentPdf) {
        this.currentPdf.style.display = 'none';
        this.currentPdf.src = '';
      }
      if (this.currentPdfLink) {
        this.currentPdfLink.style.display = 'none';
      }
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
      if (this.savedFormData.ordinanceId) this.ordinanceId.value = this.savedFormData.ordinanceId;
      if (this.savedFormData.dateEnacted) this.dateEnacted.value = this.savedFormData.dateEnacted;
      if (this.savedFormData.ordinanceNo) this.ordinanceNo.value = this.savedFormData.ordinanceNo;
      if (this.savedFormData.ordinanceDescription) this.ordinanceDescription.value = this.savedFormData.ordinanceDescription;
      
      // Restore PDF if it was selected
      if (this.savedFormData.hasPdf && this.selectedFile) {
        this.updateFilePath(this.selectedFile.name);
        this.showNewPdfPreview(this.selectedFile);
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

  showError(message, type = 'error') {
    this.errorDiv.textContent = message;
    this.errorDiv.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'}`;
    this.errorDiv.classList.add("show");
  }

  async fetchOrdinanceDetails(ordinanceId) {
    try {
      const res = await fetch("./php_folder/manageOrdinances.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getOrdinanceById", ordinanceId }),
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        this.showError("Invalid server response.");
        return;
      }
      if (json.success && json.ordinance) {
        const ordinance = json.ordinance;
        console.log('Ordinance data loaded:', ordinance);
        
        this.ordinanceId.value = ordinance.ordinanceId;
        this.dateEnacted.value = ordinance.dateEnacted;
        this.ordinanceNo.value = ordinance.ordinanceNo;
        this.ordinanceDescription.value = ordinance.description;
        
        // Handle PDF display
        if (ordinance.pdfPath) {
          // Set iframe source for PDF preview
          this.currentPdf.src = ordinance.pdfPath;
          this.currentPdf.style.display = 'block';
          
          // Set link for opening PDF in new tab
          this.currentPdfLink.href = ordinance.pdfPath;
          this.currentPdfLink.textContent = `View ${this.extractFileName(ordinance.pdfPath)}`;
          this.currentPdfLink.style.display = 'block';
          
          // Show the current PDF filename in the input field initially
          this.updateFilePath(this.extractFileName(ordinance.pdfPath));
        } else {
          this.currentPdf.style.display = 'none';
          this.currentPdfLink.style.display = 'none';
          this.updateFilePath('');
        }
        
        // Store original data for change detection
        this.originalData = { ...ordinance };
        console.log('Original data stored:', this.originalData);
      } else {
        this.showError("Ordinance not found.");
      }
    } catch (err) {
      this.showError("Could not fetch ordinance.");
    }
  }

  hasChanges() {
    // Check if there are any changes from the original data
    if (!this.originalData || Object.keys(this.originalData).length === 0) {
      return false; // No original data to compare against
    }

    const currentData = {
      ordinanceId: this.ordinanceId?.value.trim() || "",
      dateEnacted: this.dateEnacted?.value || "",
      ordinanceNo: this.ordinanceNo?.value.trim() || "",
      // Note: originalData uses "description" not "ordinanceDescription"
      ordinanceDescription: this.ordinanceDescription?.value.trim() || "",
    };

    // Compare each field with original data
    // Note: originalData.description maps to ordinanceDescription in form
    if (currentData.ordinanceId !== (this.originalData.ordinanceId != null ? String(this.originalData.ordinanceId).trim() : "")) {
      return true;
    }
    if (currentData.dateEnacted !== (this.originalData.dateEnacted != null ? String(this.originalData.dateEnacted) : "")) {
      return true;
    }
    if (currentData.ordinanceNo !== (this.originalData.ordinanceNo != null ? String(this.originalData.ordinanceNo).trim() : "")) {
      return true;
    }
    // Compare description field (originalData uses "description")
    if (currentData.ordinanceDescription !== (this.originalData.description != null ? String(this.originalData.description).trim() : "")) {
      return true;
    }

    // Check if a new PDF was uploaded
    if (this.selectedFile) {
      return true; // New PDF was selected
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
        this.dateEnacted?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  resetToOriginalData() {
    // Reset form fields to original data
    if (this.originalData && Object.keys(this.originalData).length > 0) {
      if (this.ordinanceId && this.originalData.ordinanceId) this.ordinanceId.value = this.originalData.ordinanceId;
      if (this.dateEnacted && this.originalData.dateEnacted) this.dateEnacted.value = this.originalData.dateEnacted;
      if (this.ordinanceNo && this.originalData.ordinanceNo) this.ordinanceNo.value = this.originalData.ordinanceNo;
      // Note: originalData uses "description" not "ordinanceDescription"
      if (this.ordinanceDescription && this.originalData.description) this.ordinanceDescription.value = this.originalData.description;
    }

    // Reset PDF to original
    this.selectedFile = null;
    this.pdfInput.value = '';
    this.hideNewPdfPreview();
    
    // Restore original PDF display if it exists
    if (this.originalData?.pdfPath) {
      const currentPdf = this.shadowRoot.getElementById("currentPdf");
      const currentPdfLink = this.shadowRoot.getElementById("currentPdfLink");
      
      if (currentPdf) {
        currentPdf.src = this.originalData.pdfPath;
        currentPdf.style.display = 'block';
      }
      if (currentPdfLink) {
        currentPdfLink.href = this.originalData.pdfPath;
        currentPdfLink.textContent = `View ${this.extractFileName(this.originalData.pdfPath)}`;
        currentPdfLink.style.display = 'block';
      }
      this.updateFilePath(this.extractFileName(this.originalData.pdfPath));
    } else {
      const currentPdf = this.shadowRoot.getElementById("currentPdf");
      const currentPdfLink = this.shadowRoot.getElementById("currentPdfLink");
      
      if (currentPdf) {
        currentPdf.style.display = 'none';
      }
      if (currentPdfLink) {
        currentPdfLink.style.display = 'none';
      }
      this.updateFilePath('');
    }

    // Hide new PDF preview if it was shown
    const pdfPreview = this.shadowRoot.getElementById("pdfPreview");
    const newPdfPreview = this.shadowRoot.getElementById("newPdfPreview");
    if (pdfPreview) {
      pdfPreview.style.display = 'none';
      pdfPreview.src = '';
    }
    if (newPdfPreview) {
      newPdfPreview.style.display = 'none';
      newPdfPreview.textContent = '';
    }

    // Update save button state
    this.checkFormChanges();
  }

  checkFormChanges() {
    const currentData = {
      ordinanceId: this.ordinanceId.value.trim(),
      dateEnacted: this.dateEnacted.value,
      ordinanceNo: this.ordinanceNo.value.trim(),
      ordinanceDescription: this.ordinanceDescription.value.trim(),
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
        this.saveBtn.disabled = false;
        return;
      }
    }
    
    // Check if PDF was uploaded
    if (this.selectedFile) {
      this.saveBtn.disabled = false;
      return;
    }
  }

  async handleSubmit() {
    console.log("🔄 Starting form submission for update...");
    
    // Collect form data manually to ensure all fields are captured
    const data = {
      ordinanceId: this.ordinanceId.value.trim(),
      dateEnacted: this.dateEnacted.value,
      ordinanceNo: this.ordinanceNo.value.trim(),
      ordinanceDescription: this.ordinanceDescription.value.trim(),
    };
    
    // Debug logging to see what data is being collected
    console.log('Form data being submitted:', data);
    
    // Validate each field individually and show specific error messages
    if (!data.ordinanceId) {
      this.showError("Ordinance ID is required.");
      return;
    }
    if (!data.dateEnacted) {
      this.showError("Date Enacted is required.");
      return;
    }
    if (!data.ordinanceNo) {
      this.showError("Ordinance Number is required.");
      return;
    }
    if (!data.ordinanceDescription) {
      this.showError("Ordinance Description is required.");
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
        this.savedFormData = {
          ...data,
          hasPdf: !!this.selectedFile,
          errorMessage: null
        };
        
        // Close modal immediately and show loading state
        this.closeModal(true); // Keep data for error recovery
        this.showLoadingState();
        
        try {
          // Prepare form data for file upload
          const submitFormData = new FormData();
          submitFormData.append('action', 'update');
          
          // Add all form fields
          Object.keys(data).forEach(key => {
            submitFormData.append(key, data[key]);
          });
          
          // Add the selected file if it exists
          if (this.selectedFile) {
            submitFormData.append('ordinancePdf', this.selectedFile);
          }
          
          console.log('Sending request to server with FormData');
          
          const response = await fetch("./php_folder/manageOrdinances.php", {
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
            
            // Prepare the complete ordinance data for the event
            const completeOrdinanceData = {
              ...data,
              pdfPath: result.pdfPath || this.originalData.pdfPath // Use new path from server or keep original
            };
            
            // Dispatch event to parent
            console.log('Dispatching ordinance-updated event with data:', completeOrdinanceData);
            this.dispatchEvent(
              new CustomEvent("ordinance-updated", {
                detail: { ordinance: completeOrdinanceData },
                bubbles: true,
              })
            );

            // Dispatch refresh event to parent component
            this.dispatchEvent(
              new CustomEvent("refresh-ordinances-table", {
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
            successModal.setAttribute("message", "✅ Ordinance Updated Successfully!");
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
          background: url('./imgs/CSWDO Pags Logo.png') no-repeat center center;
          background-size: 60%;
          opacity: 0.08;
          z-index: 11;
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
        .form-control:read-only {
          background-color: #f9fafb !important;
          cursor: not-allowed;
        }
        .form-control.textarea {
          resize: none;
          font-family: inherit;
          background-color: white !important;
        }
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
        .pdf-preview {
          width: 100%;
          height: 700px;
          border: 2px solid #e5e7eb;
          border-radius: 4px;
          display: none;
          background-color: #f9fafb;
          flex: 1;
        }
        .current-pdf {
          width: 100%;
          height: 700px;
          border: 2px solid #e5e7eb;
          border-radius: 4px;
          background-color: #f9fafb;
          flex: 1;
          display: none;
        }
        .current-pdf-link {
          display: block;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          color: #ea580c;
          text-decoration: none;
          font-weight: 500;
          text-align: center;
        }
        .current-pdf-link:hover {
          background-color: #e5e7eb;
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
        .file-input {
          position: absolute;
          left: -9999px;
          opacity: 0;
          pointer-events: none;
        }
      </style>
      <div id="ViewOrdinanceModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 id="viewOrdinanceTitle" class="modal-title">View Ordinance</h5>
              <button type="button" id="closeViewModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div id="viewOrdinanceError" class="alert alert-danger"></div>
              <form id="viewOrdinanceForm">
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
                      <label for="ordinanceDescription" class="form-label">Description <span class="char-limit">*300 word characters</span></label>
                      <textarea id="ordinanceDescription" name="ordinanceDescription" class="form-control textarea" rows="8" placeholder="Enter ordinance description..." required maxlength="300"></textarea>
                    </div>
                  </div>
                  
                  <!-- Right Column - PDF Section -->
                  <div class="pdf-section">
                    <div class="pdf-upload-section">
                      <label for="filePathInput" class="pdf-upload-label">PDF File</label>
                      <div class="pdf-input-container">
                        <input type="text" id="filePathInput" name="filePathInput" class="file-path-input" readonly placeholder="No file selected">
                        <button type="button" id="uploadPdfBtn" class="attach-file-btn">Attach File</button>
                      </div>
                      <input type="file" id="ordinancePdf" name="ordinancePdf" accept=".pdf" class="file-input">
                      <iframe id="currentPdf" class="current-pdf" style="display: none;"></iframe>
                      <a id="currentPdfLink" class="current-pdf-link" target="_blank" style="display: none;">View Current PDF</a>
                      <iframe id="pdfPreview" class="pdf-preview" style="display: none;"></iframe>
                      <div id="newPdfPreview" class="new-pdf-preview" style="display: none;"></div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" id="saveChangeBtn" class="btn btn-primary" form="viewOrdinanceForm" disabled>Save Changes</button>
              <button type="button" id="closeViewBtn" class="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define("view-ordinances-modal", ViewOrdinancesModal);
  