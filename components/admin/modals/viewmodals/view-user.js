class ViewUserModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    this.render();
    this.initializeElements();
    this.initEventListeners();
  }

  disconnectedCallback() {
    // Clean up when modal is removed
    document.body.style.overflow = "";
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("viewUserModal");
    this.closeBtn = this.shadowRoot.getElementById("closeViewModal");
    this.closeBtnFooter = this.shadowRoot.getElementById("closeViewBtn");
    
    // Readonly user fields
    this.userIdInput = this.shadowRoot.getElementById("viewUserId");
    this.userTypeInput = this.shadowRoot.getElementById("viewUserType");
    this.departmentInput = this.shadowRoot.getElementById("viewUserDepartment");
    this.usernameInput = this.shadowRoot.getElementById("viewUsername");
    this.handlerNameInput = this.shadowRoot.getElementById("viewHandlerName");
    this.errorDiv = this.shadowRoot.getElementById("viewUserError");
  }

  initEventListeners() {
    // Close button in header
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => {
        this.closeModal();
      });
    }
    
    // Close button in footer
    if (this.closeBtnFooter) {
      this.closeBtnFooter.addEventListener("click", () => {
        this.closeModal();
      });
    }
    
    // Close on backdrop click
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }
    
    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal && this.modal.classList.contains("show")) {
        this.closeModal();
      }
    });
  }

  openModal() {
    if (this.modal) {
      this.modal.classList.add("show");
      this.clearError();
      document.body.style.overflow = "hidden";
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove("show");
      this.clearError();
      document.body.style.overflow = "";
      this.remove();
    }
  }

  showError(message) {
    if (this.errorDiv) {
      this.errorDiv.textContent = message;
      this.errorDiv.classList.add("show");
    }
  }

  clearError() {
    if (this.errorDiv) {
      this.errorDiv.textContent = "";
      this.errorDiv.classList.remove("show");
    }
  }

  setUserId(userId) {
    this.fetchUserDetails(userId);
    this.openModal();
  }

  async fetchUserDetails(userId) {
    try {
      const response = await fetch('./php_folder/manageUsers.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getUserById', userId: userId })
      });
      
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        this.showError("Invalid server response.");
        return;
      }
      
      if (json.success && json.user) {
        const user = json.user;
        console.log('User data loaded:', user);
        
        // Populate form fields with user data (all readonly)
        if (this.userIdInput) {
          this.userIdInput.value = user.userId || '';
        }
        if (this.userTypeInput) {
          this.userTypeInput.value = user.userType || '';
        }
        if (this.departmentInput) {
          this.departmentInput.value = user.userDept || '';
        }
        if (this.usernameInput) {
          this.usernameInput.value = user.username || '';
        }
        if (this.handlerNameInput) {
          this.handlerNameInput.value = user.userHandler || '';
        }
      } else {
        this.showError(json.message || "User not found.");
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      this.showError("Could not fetch user details.");
    }
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
          background: url('./imgs/CSWDO Pags Logo.png') no-repeat center center;
          background-size: 60%;
          opacity: 0.08;
          z-index: 1;
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
        .modal-title-underline {
          width: 60px;
          height: 3px;
          background-color: #ea580c;
          margin: 0.5rem auto;
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
          color: #374151;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          background-color: #f9fafb !important;
          cursor: not-allowed;
        }
        .form-control:read-only {
          background-color: #f9fafb !important;
          cursor: not-allowed;
        }
        .form-control:disabled {
          background-color: #f9fafb !important;
          cursor: not-allowed;
        }
        input.form-control,
        select.form-control {
          background-color: #f9fafb !important;
        }
        .modal-footer {
          padding: 1rem;
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 10;
        }
        .btn-close-footer {
          padding: 0.5rem 2rem;
          border-radius: 2px;
          font-weight: 500;
          cursor: pointer;
          border: 2px solid #ea580c;
          font-size: 0.875rem;
          background-color: #ea580c;
          color: white;
          min-width: 120px;
        }
        .btn-close-footer:hover {
          background-color: #c2410c;
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
      <div id="viewUserModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <div style="flex: 1; text-align: center;">
                <h5 id="viewUserTitle" class="modal-title">User Details</h5>
                <div class="modal-title-underline"></div>
              </div>
              <button type="button" id="closeViewModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div id="viewUserError" class="alert alert-danger"></div>
              <form id="viewUserForm">
                <div class="form-row">
                  <div class="form-group">
                    <label for="viewUserId" class="form-label">User ID:</label>
                    <input type="text" id="viewUserId" name="userId" class="form-control" readonly>
                  </div>
                  <div class="form-group">
                    <label for="viewUserType" class="form-label">User Type:</label>
                    <input type="text" id="viewUserType" name="userType" class="form-control" readonly>
                  </div>
                </div>
                <div class="form-group">
                  <label for="viewUserDepartment" class="form-label">Department:</label>
                  <input type="text" id="viewUserDepartment" name="department" class="form-control" readonly>
                </div>
                <div class="form-group">
                  <label for="viewUsername" class="form-label">Username:</label>
                  <input type="text" id="viewUsername" name="username" class="form-control" readonly>
                </div>
                <div class="form-group">
                  <label for="viewHandlerName" class="form-label">Handler Name:</label>
                  <input type="text" id="viewHandlerName" name="handlerName" class="form-control" readonly>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" id="closeViewBtn" class="btn-close-footer">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("view-user-modal", ViewUserModal);

