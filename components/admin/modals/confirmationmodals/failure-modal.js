class FailureModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.getElementById("tryAgainBtn").addEventListener("click", () => {
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
    const message = this.getAttribute('message') || '❌ Login Failure. Try Again';
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
          border: 2px solid #dc2626;
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.1);
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        .modal-content h2 {
          color: #dc2626;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }
        .btn {
          padding: 0.5rem 1.5rem;
          border: none;
          background: #dc2626;
          color: white;
          font-weight: bold;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .btn:hover {
          background: #b91c1c;
        }
        .icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
      </style>
      <div class="modal">
        <div class="modal-content">
          <div class="icon">❌</div>
          <h2>${message}</h2>
          <button id="tryAgainBtn" class="btn">Try Again</button>
        </div>
      </div>
    `;
  }
}

customElements.define("failure-modal", FailureModal);
