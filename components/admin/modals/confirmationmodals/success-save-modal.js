class SuccessModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.getElementById("okBtn").addEventListener("click", () => {
      this.closeModal();
    });
    document.body.style.overflow = "hidden";
  }

  static get observedAttributes() {
    return ['message'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'message' && oldValue !== newValue) {
      this.render();
    }
  }

  closeModal() {
    this.remove();
    document.body.style.overflow = "";
  }

  render() {
    const message = this.getAttribute('message') || '✅ Successfully Saved!';
    this.shadowRoot.innerHTML = `
      <style>
        .modal {
          display: flex;
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.5);
          align-items: center;
          justify-content: center;
          z-index: 1070;
        }
        .modal-content {
          background: white;
          border-radius: 6px;
          padding: 1.5rem;
          border: 2px solid #ea580c;
          box-shadow: 0 4px 6px rgba(226, 158, 69, 0.1);
          text-align: center;
        }
        .modal-content h2 {
          color: #ea580c;
          margin-bottom: 1rem;
        }
        .btn {
          padding: 0.5rem 1.5rem;
          border: none;
          background: #ea580c;
          color: white;
          font-weight: bold;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn:hover {
          background: #c2410c;
        }
      </style>
      <div class="modal">
        <div class="modal-content">
          <h2>${message}</h2>
          <button id="okBtn" class="btn">OK</button>
        </div>
      </div>
    `;
  }
}

customElements.define("success-save-modal", SuccessModal);
