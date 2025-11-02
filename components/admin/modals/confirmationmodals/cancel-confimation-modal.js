class CancelConfirmationModal extends HTMLElement {
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
    this.modal = this.shadowRoot.getElementById("cancelConfirmModal");
    this.yesBtn = this.shadowRoot.getElementById("cancelYesBtn");
    this.noBtn = this.shadowRoot.getElementById("cancelNoBtn");
    this.closeBtn = this.shadowRoot.getElementById("closeCancelConfirmModal");
  }

  initEventListeners() {
    // No = resume halted process
    this.noBtn.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("cancel-confirm", {
          detail: { confirmed: false }, // resume
          bubbles: true,
        })
      );
      this.closeModal();
    });

    // Yes = dispose initial process
    this.yesBtn.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("cancel-confirm", {
          detail: { confirmed: true }, // dispose
          bubbles: true,
        })
      );
      this.closeModal();
    });

    // Close icon
    this.closeBtn.addEventListener("click", () => this.closeModal());

    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
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
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    this.modal.classList.remove("show");
    document.body.style.overflow = "";
    this.remove();
  }

  render() {
    // Optional custom text via attributes
    const title = this.getAttribute("title") || "Cancel Confirmation";
    const message =
      this.getAttribute("message") || "Do you want to cancel this operation?";

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
        .modal.show { display: flex; }
        .modal-dialog { max-width: 400px; width: 100%; position: relative; }
        .modal-content {
          background-color: white;
          border: 2px solid #ea580c;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        .modal-bg-logo {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: url('./imgs/CSWDO Pags Logo.png') no-repeat center center;
          background-size: 60%;
          opacity: 0.08; z-index: 11; pointer-events: none;
        }
        .modal-header, .modal-body, .modal-footer { position: relative; z-index: 10; background-color: rgba(255,255,255,0.95); }
        .modal-header { padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; position: relative; }
        .modal-title { margin: 0; font-size: 1.125rem; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: .05em; color: #374151; flex: 1; }
        .btn-close { position: absolute; top: 50%; right: 1rem; transform: translateY(-50%); background: none; border: none; font-size: 1.5rem; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 2px; z-index: 20; }
        .btn-close:hover { background-color: #f3f4f6; }
        .modal-body { padding: 1.5rem; text-align: center; }
        .confirm-icon { font-size: 3rem; margin-bottom: 1rem; color: #ea580c; }
        .confirm-message { font-size: 1.1rem; color: #374151; margin-bottom: 0; font-weight: 500; }
        .modal-footer { padding: 1rem; display: flex; gap: .75rem; }
        .btn { flex: 1; padding: .75rem 1rem; border-radius: 6px; font-weight: 500; cursor: pointer; border: none; font-size: .875rem; transition: all .2s ease; }
        .btn-primary { background-color: #ea580c; color: white; }
        .btn-primary:hover { background-color: #c2410c; }
        .btn-secondary { background-color: #6b7280; color: white; }
        .btn-secondary:hover { background-color: #4b5563; }
      </style>
      <div id="cancelConfirmModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" id="closeCancelConfirmModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <div class="confirm-icon">⚠️</div>
              <p class="confirm-message">${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" id="cancelNoBtn" class="btn btn-secondary">No</button>
              <button type="button" id="cancelYesBtn" class="btn btn-primary">Yes</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("cancel-confimation-modal", CancelConfirmationModal);


