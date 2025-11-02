class AddUser extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.loadingState = null; // Reference to loading state component
    this.savedFormData = null; // Store form data for error recovery
  }

  connectedCallback() {
    this.render()
    this.initializeElements()
    this.initEventListeners()
    this.fetchNextUserId() // Fetch next user ID before opening modal
    this.openModal() // Automatically open the modal when the component is created
  }

  disconnectedCallback() {
    // Clean up when modal is removed
    document.body.style.overflow = ""
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("addUserModal")
    this.form = this.shadowRoot.getElementById("addUserForm")
    this.userIdInput = this.shadowRoot.getElementById("addUserId")
    this.userTypeInput = this.shadowRoot.getElementById("addUserType")
    this.departmentInput = this.shadowRoot.getElementById("addUserDepartment")
    this.usernameInput = this.shadowRoot.getElementById("addUsername")
    this.handlerNameInput = this.shadowRoot.getElementById("addHandlerName")
    this.passwordInput = this.shadowRoot.getElementById("addPassword")
    this.errorDiv = this.shadowRoot.getElementById("addUserError")
  }

  initEventListeners() {
    // Close modal events - use handleCloseAttempt to check for user input
    this.shadowRoot.getElementById("closeAddModal").addEventListener("click", () => {
      this.handleCloseAttempt()
    })
    this.shadowRoot.getElementById("cancelAddBtn").addEventListener("click", () => {
      this.handleCloseAttempt()
    })
    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.handleCloseAttempt()
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
        this.handleCloseAttempt()
      }
    })
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
      if (this.savedFormData.userId) this.userIdInput.value = this.savedFormData.userId;
      if (this.savedFormData.userType) this.userTypeInput.value = this.savedFormData.userType;
      if (this.savedFormData.department) this.departmentInput.value = this.savedFormData.department;
      if (this.savedFormData.username) this.usernameInput.value = this.savedFormData.username;
      if (this.savedFormData.handlerName) this.handlerNameInput.value = this.savedFormData.handlerName;
      if (this.savedFormData.password) this.passwordInput.value = this.savedFormData.password;
      
      // Reopen modal (this will show it)
      this.modal.classList.add("show");
      document.body.style.overflow = "hidden";
      
      // Show error message after opening (so it's visible)
      if (this.savedFormData.errorMessage) {
        this.showError(this.savedFormData.errorMessage);
      }
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

  hasUserInput() {
    // Check if user has entered any data (excluding auto-generated User ID)
    const userTypeHas = (this.userTypeInput?.value || "").trim().length > 0;
    const departmentHas = (this.departmentInput?.value || "").trim().length > 0;
    const usernameHas = (this.usernameInput?.value || "").trim().length > 0;
    const handlerNameHas = (this.handlerNameInput?.value || "").trim().length > 0;
    const passwordHas = (this.passwordInput?.value || "").trim().length > 0;
    return userTypeHas || departmentHas || usernameHas || handlerNameHas || passwordHas;
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
    cancelModal.setAttribute("message", "are you sure to cancel entries? Entries will not be saved");
    
    // Listen for user decision
    cancelModal.addEventListener("cancel-confirm", (e) => {
      if (e.detail?.confirmed) {
        // Yes: dispose entries and close
        this.closeModal();
      } else {
        // No: keep modal open with current entries retained
        // User can continue inputting
        this.usernameInput?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  showLoadingState() {
    // Remove existing loading state if any
    const existing = document.querySelector("loading-state");
    if (existing) existing.remove();
    
    this.loadingState = document.createElement("loading-state");
    this.loadingState.setAttribute("subheader", "Saving New System User");
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

  async fetchNextUserId() {
    try {
      const response = await fetch('/php_folder/manageUsers.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getNextID'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Set the user ID field with the next available ID
        if (this.userIdInput) {
          this.userIdInput.value = data.userId
          this.userIdInput.readOnly = true // Make it read-only since it's auto-generated
        }
      } else {
        console.error('Failed to fetch next user ID:', data.message)
        this.showError('Failed to fetch next user ID. Please try again.')
      }
    } catch (error) {
      console.error('Error fetching next user ID:', error)
      this.showError('Error fetching next user ID. Please try again.')
    }
  }

  async handleSubmit() {
    const formData = new FormData(this.form)
    const data = Object.fromEntries(formData.entries())

    // Basic validation for all required fields
    if (!data.userId || !data.userType || !data.department || !data.username || !data.handlerName || !data.password) {
      this.showError("Please fill in all required fields.")
      return
    }

    // Username validation: must contain @gmail.com
    if (!data.username.includes("@gmail.com")) {
      this.showError("Username must be a valid Gmail address (e.g., user@gmail.com).")
      return
    }

    // Password validation: must be at least 6 characters long
    if (data.password.length < 6) {
      this.showError("Password must be at least 6 characters long.")
      return
    }

    // Show confirmation modal first (like add-service-modal.js)
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
          errorMessage: null
        };
        
        // Close modal immediately and show loading state
        this.closeModal(true); // Keep data for error recovery
        this.showLoadingState();
        
        try {
          // Create FormData for the API call (similar to manageService.php)
          const submitFormData = new FormData()
          submitFormData.append('action', 'save')
          submitFormData.append('userId', data.userId)
          submitFormData.append('userType', data.userType)
          submitFormData.append('department', data.department)
          submitFormData.append('username', data.username)
          submitFormData.append('handlerName', data.handlerName)
          submitFormData.append('password', data.password)

          const response = await fetch('/php_folder/manageUsers.php', {
            method: 'POST',
            body: submitFormData
          })

          const responseText = await response.text();
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseErr) {
            console.error("❌ Failed to parse JSON response:", parseErr);
            // Hide loading and show error
            this.hideLoadingState();
            this.savedFormData.errorMessage = "Server returned invalid response format.";
            this.reopenModal();
            return;
          }

          if (result.success) {
            // Hide loading state first
            this.hideLoadingState();
            
            // Dispatch custom event to notify parent component
            this.dispatchEvent(
              new CustomEvent("user-saved", {
                detail: { user: data },
                bubbles: true,
              }),
            )

            // Show success modal (like add-service-modal.js)
            const successModal = document.createElement("success-save-modal");
            successModal.setAttribute("message", "✅ User Saved Successfully!");
            document.body.appendChild(successModal);

            // Clean up - close modal completely
            this.closeModal();
          } else {
            // Hide loading state
            this.hideLoadingState();
            
            // Store error message and reopen modal
            this.savedFormData.errorMessage = result.message || "An error occurred while saving user.";
            
            // Reopen the modal with error displayed
            this.reopenModal();
          }
        } catch (error) {
          console.error('Error saving user:', error)
          
          // Hide loading state
          this.hideLoadingState();
          
          // Store error message and reopen modal
          this.savedFormData.errorMessage = "Failed to save user. Check your internet or server.";
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
          background: url('/imgs/CSWDO Pags Logo.png') no-repeat center center; /* Using provided logo */
          background-size: 60%;
          opacity: 0.08;
          z-index: 1; /* Behind content */
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
        .form-row { /* Renamed from form-grid as it's now a single column layout */
          display: grid;
          grid-template-columns: 1fr 1fr; /* Two columns for User ID, User Type, Department */
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
      <div id="addUserModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 id="addOrdinancesTitle" class="modal-title">Add User</h5>
              <button type="button" id="closeAddModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div id="addUserError" class="alert alert-danger"></div>
              <form id="addUserForm">
                <div class="form-row">
                  <div class="form-group">
                    <label for="addUserId" class="form-label">User ID (Auto-generated)</label>
                    <input type="text" id="addUserId" name="userId" class="form-control" required readonly>
                  </div>
                  <div class="form-group">
                    <label for="addUserType" class="form-label">User Type</label>
                    <select id="addUserType" name="userType" class="form-control" required>
                      <option value="">Select User Type</option>
                      <option value="Administrator">Administrator</option>
                      <option value="WebAdministrator">Web-Administrator</option>
                      <option value="DepartmentAdmin">Department Admin</option>
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label for="addUserDepartment" class="form-label">Department</label>
                  <select id="addUserDepartment" name="department" class="form-control" required>
                    <option value="">Select Department</option>
                    <option value="Social Welfare">Social Welfare</option>
                    <option value="Health Services">Health Services</option>
                    <option value="Education">Education</option>
                    <option value="Community Development">Community Development</option>
                    <option value="Youth Affairs">Youth Affairs</option>
                    <option value="Environmental Services">Environmental Services</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="addUsername" class="form-label">Username</label>
                  <input type="text" id="addUsername" name="username" class="form-control" placeholder="Enter username" required>
                </div>
                <div class="form-group">
                  <label for="addHandlerName" class="form-label">Handler Name</label>
                  <input type="text" id="addHandlerName" name="handlerName" class="form-control" placeholder="Enter handler name" required>
                </div>
                <div class="form-group">
                  <label for="addPassword" class="form-label">Password</label>
                  <input type="password" id="addPassword" name="password" class="form-control" placeholder="Enter password" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" id="saveAddBtn" class="btn btn-primary" form="addUserForm">Save User</button>
              <button type="button" id="cancelAddBtn" class="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `
  }
}
customElements.define("add-user", AddUser)
