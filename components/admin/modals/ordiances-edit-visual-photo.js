class EditVisualPhotoModal extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.currentData = null;
      this.sourceComponent = null;
    }
  
    async connectedCallback() {
      this.render();
      this.initializeElements();
      this.initEventListeners();
      this.openModal();
    }
  
    disconnectedCallback() {
      document.body.style.overflow = "";
    }
  
    initializeElements() {
      this.modal = this.shadowRoot.getElementById("editVisualPhotoModal");
      this.form = this.shadowRoot.getElementById("editVisualPhotoForm");
      this.cancelBtn = this.shadowRoot.getElementById("cancelEditBtn");
      this.closeBtn = this.shadowRoot.getElementById("closeEditModal");
      this.saveBtn = this.shadowRoot.getElementById("saveEditBtn");
      
      // Input elements
      this.visualPhotoInput = this.shadowRoot.getElementById("visualPhotoInput");
      this.visualPhotoPath = this.shadowRoot.getElementById("visualPhotoPath");
      this.visualPhotoPreview = this.shadowRoot.getElementById("visualPhotoPreview");
      this.visualContent = this.shadowRoot.getElementById("visualContent");
      this.attachFileBtn = this.shadowRoot.getElementById("attachFileBtn");
      this.timestampDisplay = this.shadowRoot.getElementById("timestampDisplay");
      
      this.errorDiv = this.shadowRoot.getElementById("editVisualPhotoError");
      
      // Track original values for change detection
      this.originalData = {
        visualContent: '',
        visualPhoto: null,
        hasPhoto: false
      };
    }
  
    initEventListeners() {
      // Close modal events
      this.cancelBtn.addEventListener("click", () => {
        this.closeModal();
      });
      this.closeBtn.addEventListener("click", () => {
        this.closeModal();
      });
  
      // Close on backdrop click
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
  
      // Form submission
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
  
      // File input change
      this.visualPhotoInput.addEventListener("change", (e) => {
        this.handleFileChange(e);
      });
  
      // Attach file button
      this.attachFileBtn.addEventListener("click", () => {
        this.visualPhotoInput.click();
      });
  
      // Track changes in visual content
      this.visualContent.addEventListener("input", () => {
        this.checkForChanges();
      });
  
      // ESC key to close
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.modal.classList.contains("show")) {
          this.closeModal();
        }
      });
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
      document.body.style.overflow = "";
      this.remove();
    }
  
    showError(message) {
      this.errorDiv.textContent = message;
      this.errorDiv.classList.add("show");
    }
  
    clearError() {
      this.errorDiv.textContent = "";
      this.errorDiv.classList.remove("show");
    }
  
    checkForChanges() {
      const currentContent = this.visualContent.value.trim();
      const hasNewPhoto = this.visualPhotoInput.files.length > 0;
      const contentChanged = currentContent !== this.originalData.visualContent;
      const photoChanged = hasNewPhoto;
      
      const hasChanges = contentChanged || photoChanged;
      
      if (hasChanges) {
        this.saveBtn.disabled = false;
        this.saveBtn.style.opacity = '1';
        this.saveBtn.style.cursor = 'pointer';
      } else {
        this.saveBtn.disabled = true;
        this.saveBtn.style.opacity = '0.5';
        this.saveBtn.style.cursor = 'not-allowed';
      }
    }
  
    // Method to set the source component and data
    setData(sourceComponent, data, query = null) {
      this.sourceComponent = sourceComponent;
      this.currentData = data;
      this.query = query;
      
      // Populate form with current data
      if (data) {
        if (data.visualPhoto) {
          this.visualPhotoPreview.src = data.visualPhoto;
          this.visualPhotoPreview.style.display = "block";
          // Set the path input with the photo path
          this.visualPhotoPath.value = data.visualPhoto.split('/').pop() || 'Photo attached';
          this.originalData.hasPhoto = true;
          this.originalData.visualPhoto = data.visualPhoto;
        }
        if (data.visualContent) {
          this.visualContent.value = data.visualContent;
          this.originalData.visualContent = data.visualContent;
        }
        if (data.upload_date) {
          this.timestampDisplay.value = data.upload_date;
        }
      }
      
      // Initially disable save button
      this.saveBtn.disabled = true;
      this.saveBtn.style.opacity = '0.5';
      this.saveBtn.style.cursor = 'not-allowed';
    }
  
    // Method to fetch data from PHP backend
    async fetchVisualData(query) {
      try {
        const response = await fetch("./php_folder/manageVisualServicePictures.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            action: "getVisualData", 
            query: query 
          }),
        });
  
        const result = await response.json();
        
        if (result.success) {
          return result.data;
        } else {
          this.showError(result.message || "Failed to fetch visual data.");
          return null;
        }
      } catch (err) {
        console.error("Error fetching visual data:", err);
        this.showError("Failed to fetch visual data. Check your connection.");
        return null;
      }
    }
  
    handleFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          this.showError("Please select a valid image file.");
          return;
        }
  
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.showError("Image size should be less than 5MB.");
          return;
        }
  
        // Update the path input with file name
        this.visualPhotoPath.value = file.name;
  
        // Set current timestamp
        const now = new Date();
        this.timestampDisplay.value = now.toLocaleString();
  
        // Preview the image
        const reader = new FileReader();
        reader.onload = (e) => {
          this.visualPhotoPreview.src = e.target.result;
          this.visualPhotoPreview.style.display = "block";
          // Check for changes after photo is loaded
          this.checkForChanges();
        };
        reader.readAsDataURL(file);
      }
    }
  
    async handleSubmit() {
      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData.entries());
  
      // Validate required fields
      if (!data.visualContent.trim()) {
        this.showError("Please enter visual content description.");
        return;
      }
  
      // Check if a new image was selected
      const fileInput = this.visualPhotoInput.files[0];
      if (fileInput) {
        data.visualPhoto = fileInput;
      } else if (this.currentData && this.currentData.visualPhoto) {
        // Keep existing image if no new one selected
        data.visualPhoto = this.currentData.visualPhoto;
      }
  
      // Show confirmation modal first
      const confirmModal = document.createElement("sure-to-save-modal");
      document.body.appendChild(confirmModal);
      
      // Listen for confirmation
      confirmModal.addEventListener("confirm-save", async (e) => {
        if (e.detail.confirmed) {
          try {
            // Prepare data for upload
            const uploadData = new FormData();
            uploadData.append("action", "updateVisualData");
            uploadData.append("visualContent", data.visualContent);
            
            if (fileInput) {
              uploadData.append("visualPhoto", fileInput);
            }
  
            // Send data to PHP script
            const response = await fetch("./php_folder/manageVisualServicePictures.php", {
              method: "POST",
              body: uploadData,
            });
  
            const result = await response.json();
  
            if (result.success) {
              // Determine success message based on whether a new photo was uploaded
              let successMessage = "✅ Visual Photo Updated Successfully!";
              if (fileInput) {
                successMessage = "✅ Visual Photo Saved Successfully!";
              } else if (result.message && result.message.includes("updated")) {
                successMessage = "✅ Visual Content Updated Successfully!";
              } else if (result.message && result.message.includes("saved")) {
                successMessage = "✅ Visual Content Saved Successfully!";
              }
  
              // Dispatch event to parent component
              this.dispatchEvent(
                new CustomEvent("visual-photo-updated", {
                  detail: { 
                    data: data,
                    sourceComponent: this.sourceComponent 
                  },
                  bubbles: true,
                })
              );
  
              // Show success modal
              const successModal = document.createElement("success-save-modal");
              successModal.setAttribute("message", successMessage);
              document.body.appendChild(successModal);
  
              // Close the form modal
              this.closeModal();
            } else {
              this.showError(result.message || "An error occurred while saving.");
            }
          } catch (err) {
            console.error("Save error:", err);
            this.showError("Failed to save. Check your internet or server.");
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
            max-width: 800px;
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
            width: 800px;
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
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-label {
            display: block;
            margin-bottom: 0.5rem;
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
          .form-control.textarea {
            resize: none;
            font-family: inherit;
            background-color: white !important;
            min-height: 120px;
          }
          .image-section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .file-input-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .file-path-input {
            flex: 1;
            background-color: #f9fafb;
            color: #6b7280;
            cursor: not-allowed;
          }
          .file-path-input:focus {
            border-color: #ea580c;
            box-shadow: 0 0 0 1px #ea580c;
          }
          .timestamp-input {
            background-color: #f9fafb;
            color: #6b7280;
            cursor: not-allowed;
            font-size: 0.875rem;
          }
          .timestamp-input:focus {
            border-color: #ea580c;
            box-shadow: 0 0 0 1px #ea580c;
          }
          .image-preview-container {
            width: 100%;
          }
          .image-preview {
            width: 100%;
            height: 300px;
            object-fit: cover;
            border: 2px solid #ea580c;
            border-radius: 4px;
            display: none;
          }
          .file-input-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .file-input {
            display: none;
          }
          .attach-file-btn {
            background-color: #ea580c;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.875rem;
            transition: background-color 0.2s;
          }
          .attach-file-btn:hover {
            background-color: #c2410c;
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
             cursor: not-allowed;
           }
           .btn-primary:disabled:hover {
             background-color: #9ca3af;
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
        </style>
        <div id="editVisualPhotoModal" class="modal">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-bg-logo"></div>
              <div class="modal-header">
                <h5 class="modal-title">Edit Visual Photo</h5>
                <button type="button" id="closeEditModal" class="btn-close">&times;</button>
              </div>
              <div class="modal-body">
                <div id="editVisualPhotoError" class="alert alert-danger"></div>
                <form id="editVisualPhotoForm">
                  <div class="form-group">
                    <label class="form-label">Visual Photo</label>
                    <div class="image-section">
                      <div class="file-input-row">
                        <input type="text" id="visualPhotoPath" class="form-control file-path-input" placeholder="No file selected" readonly>
                        <button type="button" id="attachFileBtn" class="attach-file-btn">Attach File</button>
                      </div>
                                           <div class="image-preview-container">
                         <img id="visualPhotoPreview" class="image-preview" alt="Visual Photo Preview">
                       </div>
                       <label class="form-label">Time Stamp</label>
                       <input type="text" id="timestampDisplay" class="form-control timestamp-input" placeholder="Upload timestamp will appear here" readonly>
                       <input type="file" id="visualPhotoInput" name="visualPhoto" class="file-input" accept="image/*">
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="visualContent" class="form-label">Visual Content</label>
                    <textarea id="visualContent" name="visualContent" class="form-control textarea" placeholder="Enter visual content description..." required></textarea>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="submit" id="saveEditBtn" class="btn btn-primary" form="editVisualPhotoForm">Save Changes</button>
                <button type="button" id="cancelEditBtn" class="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  customElements.define("ordinances-edit-visual-photo-modal", EditVisualPhotoModal);
  