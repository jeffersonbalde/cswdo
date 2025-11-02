class LogoutConfirmationModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.initializeElements();
    this.initEventListeners();
    this.openModal();
  }

  disconnectedCallback() {
    document.body.style.overflow = "";
  }

  initializeElements() {
    this.modal = this.shadowRoot.getElementById("logoutConfirmModal");
    this.yesBtn = this.shadowRoot.getElementById("confirmYesBtn");
    this.noBtn = this.shadowRoot.getElementById("confirmNoBtn");
    this.closeBtn = this.shadowRoot.getElementById("closeLogoutModal");
  }

  initEventListeners() {
    // Close modal events
    this.noBtn.addEventListener("click", () => this.closeModal());
    this.closeBtn.addEventListener("click", () => this.closeModal());
    
    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    // Yes button - perform logout
    this.yesBtn.addEventListener("click", () => {
      this.performLogout();
    });

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) {
        this.closeModal();
      }
    });
  }

  async performLogout() {
    try {
      // Destroy session security instance if it exists
      if (window.sessionSecurity) {
        window.sessionSecurity.destroy();
      }

      // Call logout endpoint
      const response = await fetch('/php_folder/logout.php', {
        method: 'POST',
        credentials: 'same-origin'
      });

      if (response.ok) {
        // Redirect to login page
        window.location.href = '/login.html';
      } else {
        // If logout fails, still redirect to login
        window.location.href = '/login.html';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect to login
      window.location.href = '/login.html';
    }
  }

  openModal() {
    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    this.modal.classList.remove("show");
    document.body.style.overflow = "";
    this.remove();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        .modal {
          display: none;
          position: fixed;
          z-index: 1060;
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
          max-width: 400px;
          width: 100%;
          position: relative;
        }
        .modal-content {
          background-color: white;
          border: 2px solid #dc2626;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
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
          padding: 1.5rem;
          text-align: center;
          position: relative;
          z-index: 10;
        }
        .confirm-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #dc2626;
        }
        .confirm-message {
          font-size: 1.1rem;
          color: #374151;
          margin-bottom: 0;
          font-weight: 500;
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
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }
        .btn-primary {
          background-color: #dc2626;
          color: white;
        }
        .btn-primary:hover {
          background-color: #b91c1c;
        }
        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }
        .btn-secondary:hover {
          background-color: #4b5563;
        }
      </style>
      <div id="logoutConfirmModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 class="modal-title">Confirm Logout</h5>
              <button type="button" id="closeLogoutModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div class="confirm-icon">🚪</div>
              <p class="confirm-message">Are you sure to Log out?</p>
            </div>
            <div class="modal-footer">
              <button type="button" id="confirmNoBtn" class="btn btn-secondary">No</button>
              <button type="button" id="confirmYesBtn" class="btn btn-primary">Yes</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("logout-confirmation-modal", LogoutConfirmationModal);
