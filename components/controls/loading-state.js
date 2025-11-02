class LoadingState extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const subheader = this.getAttribute("subheader") || "Verifying credentials";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(139, 69, 19, 0.1);
          backdrop-filter: blur(5px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-container {
          background: white;
          border: 3px solid #8B4513;
          border-radius: 20px;
          padding: 3rem;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .logo {
          width: 120px;
          height: 120px;
          margin: 0 auto 2rem;
          background: url('/imgs/CSWDO Pags Logo.png') no-repeat center center;
          background-size: contain;
        }

        .header {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 1rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .subheader {
          font-size: 1rem;
          color: #666;
          margin-bottom: 2rem;
          font-style: italic;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .loading-animation {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 1rem;
        }

        .loading-circle {
          width: 60px;
          height: 60px;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #F57C00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #F57C00;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* Responsive design */
        @media (max-width: 480px) {
          .loading-container {
            padding: 2rem;
            margin: 1rem;
          }

          .logo {
            width: 100px;
            height: 100px;
            margin-bottom: 1.5rem;
          }

          .header {
            font-size: 1.5rem;
          }

          .subheader {
            font-size: 0.9rem;
          }

          .loading-circle {
            width: 50px;
            height: 50px;
          }
        }
      </style>

      <div class="loading-container">
        <div class="logo"></div>
        <div class="header">Loading...</div>
        <div class="subheader">${subheader}</div>
        <div class="loading-animation">
          <div class="loading-circle"></div>
        </div>
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
  }

  // Method to show the loading state
  show() {
    this.style.display = 'flex';
  }

  // Method to hide the loading state
  hide() {
    this.style.display = 'none';
  }
}

customElements.define("loading-state", LoadingState);
