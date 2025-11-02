class ViewFeaturedstoriesModal extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.selectedFile = null;
      this.uploadedImagePath = "";
      this.originalData = {};
      this.savedFormData = null; // Store form data for error recovery
      this.loadingState = null; // Reference to loading state component
    }
  
    async connectedCallback() {
      this.render();
      this.initializeElements();
      this.initEventListeners();
    }
  
    setFeaturedstoriesId(featuredstoriesId) {
      this.fetchFeaturedstoriesDetails(featuredstoriesId);
      this.openModal();
    }
  
    disconnectedCallback() {
      document.body.style.overflow = "";
    }
  
        initializeElements() {
      // Initialize DOM elements after render
      this.modal = this.shadowRoot.getElementById("viewFeaturedstoriesModal");
      this.form = this.shadowRoot.getElementById("viewFeaturedstoriesForm");
      this.cancelBtn = this.shadowRoot.getElementById("closeViewBtn");
      this.closeBtn = this.shadowRoot.getElementById("closeViewModal");
      this.saveBtn = this.shadowRoot.getElementById("saveChangeBtn");
      
      // Form fields
      this.featuredstoriesId = this.shadowRoot.getElementById("featuredstoriesId");
      this.uploadDate = this.shadowRoot.getElementById("uploadDate");
      this.featuredstoriesTitle = this.shadowRoot.getElementById("featuredstoriesTitle");
      this.featuredstoriesDesc = this.shadowRoot.getElementById("featuredstoriesDescription");
      this.imageInput = this.shadowRoot.getElementById("featuredstoriesImage");
      this.imagePreview = this.shadowRoot.getElementById("imagePreview");
      this.attachBtn = this.shadowRoot.getElementById("attachFileBtn");
      this.currentImage = this.shadowRoot.getElementById("currentImage");

      this.errorDiv = this.shadowRoot.getElementById("viewFeaturedstoriesError");
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
      // Title field
      if (this.featuredstoriesTitle) {
        this.featuredstoriesTitle.addEventListener("input", () => {
          console.log('featuredstoriesTitle field changed to:', this.featuredstoriesTitle.value);
          this.checkFormChanges();
        });
      }
      
      // Description field (textarea)
      if (this.featuredstoriesDesc) {
        this.featuredstoriesDesc.addEventListener("input", () => {
          console.log('featuredstoriesDescription field changed to:', this.featuredstoriesDesc.value);
          this.checkFormChanges();
        });
        // Also listen for 'change' event on textarea as backup
        this.featuredstoriesDesc.addEventListener("change", () => {
          console.log('featuredstoriesDescription field changed (change event):', this.featuredstoriesDesc.value);
          this.checkFormChanges();
        });
      }
  
      // Direct click handler for save button as backup
      this.saveBtn.addEventListener("click", (e) => {
        if (!this.saveBtn.disabled) this.handleSubmit();
      });
  
      // Image upload handling
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
        // Validate file type
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
        ];
        if (!allowedTypes.includes(file.type)) {
          this.showError("Please select a valid image file (JPG, PNG, or GIF).");
          this.imageInput.value = "";
          this.updateFilePath("");
          return;
        }
  
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          this.showError("File size too large. Maximum size is 5MB.");
          this.imageInput.value = "";
          this.updateFilePath("");
          return;
        }
  
        this.selectedFile = file;
        this.updateFilePath(file.name);
  
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreview.src = e.target.result;
          this.imagePreview.style.display = "block";
          this.currentImage.style.display = "none";
        };
        reader.readAsDataURL(file);
        
        this.checkFormChanges();
      }
    }
  
    updateFilePath(fileName) {
      const filePathInput = this.shadowRoot.getElementById("filePathInput");
      if (filePathInput) {
        filePathInput.value = fileName || "";
      }
    }
  
    extractFileName(filePath) {
      if (!filePath) return '';
      // Extract filename from path (handle both forward and backward slashes)
      const parts = filePath.split(/[\/\\]/);
      return parts[parts.length - 1] || filePath;
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
        this.imagePreview.style.display = "none";
        this.currentImage.style.display = "block";
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
        if (this.savedFormData.featuredstoriesId) this.featuredstoriesId.value = this.savedFormData.featuredstoriesId;
        if (this.savedFormData.featuredstoriesTitle) this.featuredstoriesTitle.value = this.savedFormData.featuredstoriesTitle;
        if (this.savedFormData.uploadDate) {
          this.uploadDate.value = this.savedFormData.uploadDate;
          // Restore date display
          const date = new Date(this.savedFormData.uploadDate);
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
        if (this.savedFormData.featuredstoriesDescription) this.featuredstoriesDesc.value = this.savedFormData.featuredstoriesDescription;
        
        // Restore image if it was selected
        if (this.savedFormData.hasImage && this.selectedFile) {
          this.updateFilePath(this.selectedFile.name);
          const reader = new FileReader();
          reader.onload = (e) => {
            this.imagePreview.src = e.target.result;
            this.imagePreview.style.display = "block";
            this.currentImage.style.display = "none";
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
  
        async fetchFeaturedstoriesDetails(featuredstoriesId) {
      try {
        const res = await fetch("./php_folder/manageFeaturedStories.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getFeaturedstoriesById", featuredstoriesId }),
        });

        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch (err) {
          this.showError("Invalid server response.");
          return;
        }

        if (json.success && json.featuredstories) {
          const featuredstories = json.featuredstories;
          console.log('Featuredstories data loaded:', featuredstories);
          
          this.featuredstoriesId.value = featuredstories.featuredstoriesId;
          this.featuredstoriesTitle.value = featuredstories.featuredstoriesTitle;
          this.featuredstoriesDesc.value = featuredstories.featuredstoriesDescription;
          
          // Handle date display
          if (featuredstories.uploadDate) {
            const date = new Date(featuredstories.uploadDate);
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
            this.uploadDate.value = featuredstories.uploadDate;
          }
          
          // Handle image display
          if (featuredstories.featuredstoriesPicPath) {
            this.currentImage.src = featuredstories.featuredstoriesPicPath;
            this.currentImage.style.display = 'block';
            this.imagePreview.style.display = 'none';
            // Update the file path input to show the current image path
            this.updateFilePath(this.extractFileName(featuredstories.featuredstoriesPicPath));
          } else {
            this.currentImage.style.display = 'none';
            this.updateFilePath('');
          }
          
          // Store original data for change detection
          this.originalData = { ...featuredstories };
          console.log('Original data stored:', this.originalData);
        } else {
          this.showError("Featured story not found.");
        }
      } catch (err) {
        this.showError("Could not fetch featured story.");
      }
    }
  
    hasChanges() {
      // Check if there are any changes from the original data
      if (!this.originalData || Object.keys(this.originalData).length === 0) {
        return false; // No original data to compare against
      }

      const currentData = {
        featuredstoriesId: this.featuredstoriesId?.value.trim() || "",
        featuredstoriesTitle: this.featuredstoriesTitle?.value.trim() || "",
        uploadDate: this.uploadDate?.value || "",
        featuredstoriesDescription: this.featuredstoriesDesc?.value.trim() || "",
      };

      // Compare each field with original data
      for (const key in currentData) {
        const original = this.originalData[key] != null ? String(this.originalData[key]).trim() : "";
        const current = currentData[key];
        if (current !== original) {
          return true; // Found a change
        }
      }

      // Check if a new image was uploaded
      if (this.selectedFile) {
        return true; // New image was selected
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
          this.featuredstoriesTitle?.focus();
        }
      }, { once: true });

      document.body.appendChild(cancelModal);
    }

    resetToOriginalData() {
      // Reset form fields to original data
      if (this.originalData && Object.keys(this.originalData).length > 0) {
        if (this.featuredstoriesId && this.originalData.featuredstoriesId) this.featuredstoriesId.value = this.originalData.featuredstoriesId;
        if (this.featuredstoriesTitle && this.originalData.featuredstoriesTitle) this.featuredstoriesTitle.value = this.originalData.featuredstoriesTitle;
        if (this.featuredstoriesDesc && this.originalData.featuredstoriesDescription) this.featuredstoriesDesc.value = this.originalData.featuredstoriesDescription;
        if (this.uploadDate && this.originalData.uploadDate) {
          this.uploadDate.value = this.originalData.uploadDate;
          // Restore date display
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

      // Reset image to original
      this.selectedFile = null;
      this.imageInput.value = '';
      this.updateFilePath('');
      this.imagePreview.style.display = 'none';
      
      // Show original image if it exists
      if (this.originalData?.featuredstoriesPicPath) {
        this.currentImage.src = this.originalData.featuredstoriesPicPath;
        this.currentImage.style.display = 'block';
        this.updateFilePath(this.extractFileName(this.originalData.featuredstoriesPicPath));
      } else {
        this.currentImage.style.display = 'none';
      }

      // Update save button state
      this.checkFormChanges();
    }

    checkFormChanges() {
      // Ensure save button element exists
      if (!this.saveBtn) {
        console.warn('Save button not found');
        return;
      }

      const currentData = {
        featuredstoriesId: this.featuredstoriesId.value.trim(),
        featuredstoriesTitle: this.featuredstoriesTitle.value.trim(),
        uploadDate: this.uploadDate.value,
        featuredstoriesDescription: this.featuredstoriesDesc.value.trim(),
      };
      
      // Debug logging to help identify the issue
      console.log('Current form data:', currentData);
      console.log('Original data:', this.originalData);
      
      // Start with button disabled
      this.saveBtn.disabled = true;
      
      // Check if title changed
      const originalTitle = this.originalData.featuredstoriesTitle != null ? String(this.originalData.featuredstoriesTitle).trim() : "";
      const currentTitle = currentData.featuredstoriesTitle;
      if (currentTitle !== originalTitle) {
        console.log('Title changed - enabling save button');
        this.saveBtn.disabled = false;
        return;
      }
      
      // Check if description changed
      const originalDesc = this.originalData.featuredstoriesDescription != null ? String(this.originalData.featuredstoriesDescription).trim() : "";
      const currentDesc = currentData.featuredstoriesDescription;
      if (currentDesc !== originalDesc) {
        console.log('Description changed - enabling save button');
        this.saveBtn.disabled = false;
        return;
      }
      
      // Check if image was uploaded (new file selected)
      if (this.selectedFile) {
        console.log('New image selected - enabling save button');
        this.saveBtn.disabled = false;
        return;
      }
      
      // Check if original had an image but now it's removed (user cleared the file input)
      // This handles the case where user removes a previously selected file
      const originalHasImage = this.originalData.featuredstoriesPicPath != null && this.originalData.featuredstoriesPicPath.trim() !== '';
      const currentImageInput = this.imageInput?.value || '';
      if (originalHasImage && currentImageInput === '' && !this.selectedFile) {
        // User removed the original image - this is also a change
        console.log('Original image was removed - enabling save button');
        this.saveBtn.disabled = false;
        return;
      }
      
      // No changes detected
      console.log('No changes detected - save button remains disabled');
    }
  
    async handleSubmit() {
      console.log("🔄 Starting form submission for update...");
      
      // Collect form data manually to ensure all fields are captured
      const data = {
        featuredstoriesId: this.featuredstoriesId.value.trim(),
        featuredstoriesTitle: this.featuredstoriesTitle.value.trim(),
        uploadDate: this.uploadDate.value,
        featuredstoriesDescription: this.featuredstoriesDesc.value.trim(),
      };
      
      // Debug logging to see what data is being collected
      console.log('Form data being submitted:', data);
      
      // Validate each field individually and show specific error messages
      if (!data.featuredstoriesId) {
        this.showError("Featured Story ID is required.");
        return;
      }
      if (!data.featuredstoriesTitle) {
        this.showError("Featured Story Title is required.");
        return;
      }
      if (!data.uploadDate) {
        this.showError("Upload Date is required.");
        return;
      }
      if (!data.featuredstoriesDescription) {
        this.showError("Featured Story Description is required.");
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
            hasImage: !!this.selectedFile,
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
              submitFormData.append('featuredstoriesImage', this.selectedFile);
            }
            
            console.log('Sending request to server with FormData');
            
            const response = await fetch("./php_folder/manageFeaturedStories.php", {
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
              
              // Prepare the complete featuredstories data for the event
              const completeFeaturedstoriesData = {
                ...data,
                featuredstoriesPicPath: result.featuredstoriesPicPath || this.originalData.featuredstoriesPicPath // Use new path from server or keep original
              };
              
              // Dispatch event to parent
              console.log('Dispatching featuredstories-updated event with data:', completeFeaturedstoriesData);
              this.dispatchEvent(
                new CustomEvent("featuredstories-updated", {
                  detail: { featuredstories: completeFeaturedstoriesData },
                  bubbles: true,
                })
              );

              // Dispatch refresh event to parent component first
              this.dispatchEvent(
                new CustomEvent("refresh-featuredstories-table", {
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
              successModal.setAttribute("message", "✅ Featured Story Updated Successfully!");
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
        .image-section {
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
        .image-upload-section {
          margin-bottom: 1rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          max-height: 500px;
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
        .current-image {
          width: 100%;
          max-width: 100%;
          height: 400px;
          border: 2px solid #e5e7eb;
          border-radius: 4px;
          object-fit: contain;
          background-color: #f9fafb;
          flex: 1;
          max-height: 400px;
          object-position: center;
        }
        .file-input {
          position: absolute;
          left: -9999px;
          opacity: 0;
          pointer-events: none;
        }
      </style>
      <div id="viewFeaturedstoriesModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">  
              <h5 id="viewFeaturedstoriesTitle" class="modal-title">View Featured Stories</h5>
              <button type="button" id="closeViewModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div id="viewFeaturedstoriesError" class="alert alert-danger"></div>
              <form id="viewFeaturedstoriesForm">
                <div class="modal-content-wrapper">
                  <!-- Left Column - Form Fields -->
                  <div class="form-section">
                    <div class="form-row">
                      <div class="form-group">
                        <label for="featuredstoriesId" class="form-label">Featured Story ID</label>
                        <input type="text" id="featuredstoriesId" name="featuredstoriesId" class="form-control" required readonly>
                      </div>
                      <div class="form-group">
                        <label for="uploadDate" class="form-label">Upload Date</label>
                        <div id="dateDisplay" class="form-control" style="background-color: #f9fafb; color: #6b7280; cursor: not-allowed;"></div>
                        <input type="hidden" id="uploadDate" name="uploadDate" required>
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="featuredstoriesTitle" class="form-label">Title <span class="char-limit">*20 word characters</span></label>
                      <input type="text" id="featuredstoriesTitle" name="featuredstoriesTitle" class="form-control" placeholder="Input featured story title here..." required maxlength="20">
                    </div>
                    <div class="form-group">
                      <label for="featuredstoriesDescription" class="form-label">Description <span class="char-limit">*300 word characters</span></label>
                      <textarea id="featuredstoriesDescription" name="featuredstoriesDescription" class="form-control textarea" rows="8" placeholder="Enter featured story description..." required maxlength="300"></textarea>
                    </div>
                  </div>
                  
                  <!-- Right Column - Image Section -->
                  <div class="image-section">
                    <div class="image-upload-section">
                      <label for="filePathInput" class="image-upload-label">Featured Story Image</label>
                      <div class="image-input-container">
                        <input type="text" id="filePathInput" name="filePathInput" class="file-path-input" readonly placeholder="No file selected">
                        <button type="button" id="attachFileBtn" class="attach-file-btn">Attach File</button>
                      </div>
                      <input type="file" id="featuredstoriesImage" name="featuredstoriesImage" accept="image/*" class="file-input">
                      <img id="currentImage" class="current-image" alt="Current Featured Story Image">
                      <img id="imagePreview" class="image-preview" alt="Image Preview">
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" id="saveChangeBtn" class="btn btn-primary" form="viewFeaturedstoriesForm" disabled>Save Changes</button>
              <button type="button" id="closeViewBtn" class="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("view-featuredstories-modal", ViewFeaturedstoriesModal);
  