class ResidentFooter extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <style>
        /* Custom styles for the footer as per screenshot */
        .site-footer {
          background-color: #f8f9fa; /* Light background for the footer content area */
          padding-top: 2rem;
          border: 1px solid #e0e0e0;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          margin-top: 2rem;
          margin-bottom: 0; /* Remove any bottom margin */
        }

        .footer-bottom-bar {
          background-color: #e67e22; /* Brownish-orange color from screenshot */
          color: white;
          padding: 1rem 0;
          text-align: center;
          margin-top: 2rem; /* Space between main footer content and bottom bar */
          margin-bottom: 0; /* Remove any bottom margin */
          border-radius: 0; /* Remove border radius to make it flush with edges */
          position: relative;
          width: 100vw;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
        }

        /* Ensure the footer extends to the very bottom */
        resident-footer {
          display: block;
          margin-bottom: 0;
          padding-bottom: 0;
          width: 100%;
        }

        .footer-section h5 {
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .footer-logos img {
          max-height: 80px; /* Adjust as needed */
          margin: 0 10px;
        }

        /* Responsive adjustments for footer */
        @media (max-width: 767.98px) {
          .footer-section {
            margin-bottom: 1.5rem;
            text-align: center;
          }
          .footer-logos {
            display: flex;
            justify-content: center;
            margin-top: 1rem;
          }
        }
      </style>
      <footer class="site-footer">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-12 col-md-10">
              <!-- Google Map Embed Component -->
              <google-map-embed api-key="YOUR_GOOGLE_MAPS_API_KEY" q="CSWDO Pagadian City, Philippines" height="300px"></google-map-embed>
            </div>
          </div>
          <div class="row mt-4">
            <div class="col-12 col-md-4 footer-section">
              <h5>CONTACT US</h5>
              <p>Cel No.: 0977 832 9668</p>
              <p>Email Address: cswdopagadian@gmail.com</p>
              <p>Facebook: cswdo.fbpge</p>
            </div>
            <div class="col-12 col-md-4 footer-section">
              <h5>VISIT US</h5>
              <p>CSWDO, Pagadian City, Philippines</p>
              <div class="footer-logos mt-3">
                <img src="/imgs/CSWDO.png" alt="Logo 1" style="max-height: 80px; width: auto;">
                <img src="/imgs/CSWDO Pags Logo.png" alt="Logo 2" style="max-height: 80px; width: auto;">
                <img src="/imgs/Pagadian.png" alt="Logo 3" style="max-height: 80px; width: auto;">
              </div>
            </div>
            <div class="col-12 col-md-4 footer-section">
              <h5>REPUBLIC OF THE PHILIPPINES</h5>
              <p>All content is in the public domain unless otherwise stated.</p>
            </div>
          </div>
        </div>
        <div class="footer-bottom-bar">
          @2025.CSWDO Pagadian / AsensoPagadian, All Rights Reserved.
        </div>
      </footer>
    `;
  }
}

// Register the custom element
customElements.define('resident-footer', ResidentFooter);
