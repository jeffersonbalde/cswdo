// components/controls/indexes/services-display.js
class ServicesDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.services = [];
    this.displayedCount = 5; // Maximum services to display initially
    this.currentPage = 1;
    this.department = this.getAttribute('department') || '';
  }

  static get observedAttributes() {
    return ['department'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'department' && oldValue !== newValue) {
      this.department = newValue;
      this.loadServices();
    }
  }

  connectedCallback() {
    this.render();
    this.loadServices();
  }

  async loadServices() {
    try {
      const response = await fetch('./php_folder/manageService.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'fetchdata' })
      });

      const result = await response.json();
      
      if (result.success && result.services) {
        // Filter services by department if department attribute is provided
        if (this.department) {
          this.services = result.services.filter(service => 
            service.serviceDepartment.toLowerCase().includes(this.department.toLowerCase())
          );
        } else {
          this.services = result.services;
        }
        this.renderServices();
      } else {
        this.showNoServices();
      }
    } catch (error) {
      console.error('Error loading services:', error);
      this.showError();
    }
  }

  renderServices() {
    const container = this.shadowRoot.querySelector('#services-container');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Get services to display (most recent first, limited by displayedCount)
    const servicesToShow = this.services.slice(0, this.displayedCount);

    if (servicesToShow.length === 0) {
      this.showNoServices();
      return;
    }

    // Create service cards
    servicesToShow.forEach(service => {
      const serviceCard = this.createServiceCard(service);
      container.appendChild(serviceCard);
    });

    // Update Learn More button visibility
    this.updateLearnMoreButton();
  }

  createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
      <div class="card-image">
        <img src="${service.servicePicPath || './imgs/CSWDO.png'}" 
             alt="${service.serviceTitle}" 
             onerror="this.src='./imgs/CSWDO.png'">
      </div>
      <div class="card-content">
        <h3 class="card-title">${this.truncateTitle(service.serviceTitle, 10)}</h3>
        <p class="card-department">${service.serviceDepartment}</p>
        <p class="card-description">${this.truncateText(service.serviceDescription, 100)}</p>
        <button class="more-info-btn" data-service-id="${service.serviceId}">
          More info
        </button>
      </div>
    `;

    // Add click event for More Info button
    const moreInfoBtn = card.querySelector('.more-info-btn');
    moreInfoBtn.addEventListener('click', () => {
      this.showServiceModal(service);
    });

    return card;
  }

  showServiceModal(service) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'service-modal-overlay';
    modal.innerHTML = `
      <div class="service-modal">
        <div class="modal-header">
          <h2>${service.serviceTitle}</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-content">
          <div class="modal-image">
            <img src="${service.servicePicPath || './imgs/CSWDO.png'}" 
                 alt="${service.serviceTitle}"
                 onerror="this.src='./imgs/CSWDO.png'">
          </div>
          <div class="modal-details">
            <div class="detail-group">
              <h4>Department</h4>
              <p>${service.serviceDepartment}</p>
            </div>
            <div class="detail-group">
              <h4>Process Duration</h4>
              <p>${service.processDuration}</p>
            </div>
            <div class="detail-group">
              <h4>Description</h4>
              <p>${service.serviceDescription}</p>
            </div>
            <div class="detail-group">
              <h4>Requirements</h4>
              <p>${service.serviceRequirements}</p>
            </div>
            <div class="detail-group">
              <h4>Who Can Avail</h4>
              <p>${service.serviceWhoCanAvail}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.close-btn');
    const overlay = modal.querySelector('.service-modal-overlay');
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(modal);
      }
    });

    // Add escape key listener
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  updateLearnMoreButton() {
    const learnMoreBtn = this.shadowRoot.querySelector('#learn-more-btn');
    if (!learnMoreBtn) return;

    if (this.displayedCount >= this.services.length) {
      learnMoreBtn.style.display = 'none';
    } else {
      learnMoreBtn.style.display = 'block';
    }
  }

  showNoServices() {
    const container = this.shadowRoot.querySelector('#services-container');
    if (container) {
      const message = this.department 
        ? `No services available for this department at the moment.`
        : `No services available at the moment.`;
      container.innerHTML = `
        <div class="no-services">
          <p>${message}</p>
        </div>
      `;
    }
  }

  showError() {
    const container = this.shadowRoot.querySelector('#services-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>Failed to load services. Please try again later.</p>
        </div>
      `;
    }
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  truncateTitle(text, maxWords) {
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .services-display {
          width: 100%;
        }

        .services-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .service-card {
          background: white;
          border: 2px solid #8B4513;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .card-image {
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .service-card:hover .card-image img {
          transform: scale(1.05);
        }

        .card-content {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #333;
          margin: 0 0 0.5rem 0;
          line-height: 1.3;
          text-align: center;
        }

        .card-department {
          font-size: 0.9rem;
          color: #666;
          font-style: italic;
          margin: 0 0 1rem 0;
          text-align: center;
        }

        .card-description {
          font-size: 0.95rem;
          color: #555;
          line-height: 1.5;
          margin: 0 0 1.5rem 0;
          flex: 1;
        }

        .more-info-btn {
          background: #D2691E;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s ease;
          width: 100%;
          margin-top: auto;
        }

        .more-info-btn:hover {
          background: #B8860B;
          transform: translateY(-1px);
        }

        .learn-more-btn {
          color: black !important;
          background-color: orange !important;
          border: 1px solid black !important;
          transition: all 0.3s ease;
          display: block;
          margin: 0 auto;
          padding: 12px 24px;
          font-size: 16px;
          min-width: 150px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .learn-more-btn:hover,
        .learn-more-btn:focus,
        .learn-more-btn:active {
          color: white !important;
          background-color: #A8D5BA !important;
          border: 1px solid white !important;
          transform: translateY(-1px);
        }

        .no-services, .error-message {
          text-align: center;
          padding: 2rem;
          color: #666;
          font-style: italic;
        }

        /* Modal Styles */
        .service-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          padding: 1rem;
        }

        .service-modal {
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
          border-radius: 12px 12px 0 0;
        }

        .modal-header h2 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #333;
        }

        .modal-content {
          padding: 1.5rem;
        }

        .modal-image {
          width: 100%;
          height: 250px;
          margin-bottom: 1.5rem;
          border-radius: 8px;
          overflow: hidden;
        }

        .modal-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .detail-group h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .detail-group p {
          margin: 0;
          color: #555;
          line-height: 1.6;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .services-container {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .service-modal {
            margin: 1rem;
            max-height: 95vh;
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-content {
            padding: 1rem;
          }

          .modal-image {
            height: 200px;
          }
        }
      </style>

      <div class="services-display">
        <div id="services-container" class="services-container">
          <div class="loading">
            <p>Loading services...</p>
          </div>
        </div>
        <button id="learn-more-btn" class="learn-more-btn" style="display: none;">
          Learn More
        </button>
      </div>
    `;

    // Add event listener for Learn More button
    const learnMoreBtn = this.shadowRoot.querySelector('#learn-more-btn');
    if (learnMoreBtn) {
      learnMoreBtn.addEventListener('click', () => {
        this.displayedCount += 5;
        this.renderServices();
      });
    }
  }
}

customElements.define('services-display', ServicesDisplay);
