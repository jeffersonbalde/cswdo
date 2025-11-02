// components/ordinances-display.js
class OrdinancesDisplay extends HTMLElement {
  static get observedAttributes() {
    return ['id', 'ordinance-no', 'title', 'date-enacted'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const readMoreBtn = this.shadowRoot.querySelector('.read-more-btn');
    if (readMoreBtn) {
      readMoreBtn.addEventListener('click', () => {
        this.openModal();
      });
    }
  }

  openModal() {
    // Placeholder function for modal functionality
    // This will be implemented later as requested
    console.log('Modal functionality will be implemented later');
    
    // Dispatch a custom event that can be listened to by parent components
    const modalEvent = new CustomEvent('openOrdinanceModal', {
      detail: {
        id: this.getAttribute('id'),
        ordinanceNo: this.getAttribute('ordinance-no'),
        title: this.getAttribute('title'),
        dateEnacted: this.getAttribute('date-enacted')
      },
      bubbles: true
    });
    this.dispatchEvent(modalEvent);
  }

  render() {
    const id = this.getAttribute('id') || '';
    const ordinanceNo = this.getAttribute('ordinance-no') || 'MC 000, S. 2024';
    const title = this.getAttribute('title') || 'Ordinance Title';
    const dateEnacted = this.getAttribute('date-enacted') || 'January 1, 2025';

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          background-color: #ffffff;
          text-align: center;
          transition: box-shadow 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          max-width: 300px;
          margin: 0 auto;
        }

        .card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .ordinance-no {
          font-size: 0.9rem;
          color: #000000;
          font-weight: normal;
          margin: 0 0 0.5rem 0;
          text-align: left;
        }

        .title {
          font-weight: bold;
          font-size: 1.2rem;
          margin: 0 0 1rem 0;
          color: #000000;
          line-height: 1.3;
        }

        .separator {
          width: 100%;
          height: 1px;
          background-color: #000000;
          margin: 0 0 1rem 0;
        }

        .date-enacted {
          font-size: 0.9rem;
          color: #000000;
          font-weight: normal;
          margin: 0 0 1.5rem 0;
        }

        .read-more-btn {
          background-color: #e67e22;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          font-weight: normal;
          cursor: pointer;
          transition: background-color 0.3s ease;
          width: 100%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .read-more-btn:hover {
          background-color: #d35400;
        }

        .read-more-btn:active {
          transform: translateY(1px);
        }
      </style>

      <div class="card" id="${id}">
        <div class="ordinance-no">${ordinanceNo}</div>
        <div class="title">${title}</div>
        <div class="separator"></div>
        <div class="date-enacted">${dateEnacted}</div>
        <button class="read-more-btn">Read More</button>
      </div>
    `;
  }
}

customElements.define('ordinances-display', OrdinancesDisplay);
