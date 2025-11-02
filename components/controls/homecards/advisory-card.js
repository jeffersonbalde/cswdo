class AdvisoryCard extends HTMLElement {
  static get observedAttributes() {
    return ['id', 'title', 'desc', 'date'];
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
  }

  render() {
    const id = this.getAttribute('id') || '';
    const title = this.getAttribute('title') || 'Advisory Title';
    const desc = this.getAttribute('desc') || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
    const date = this.getAttribute('date') || 'September 10, 2025';

    this.shadowRoot.innerHTML = `
      <style>
        .advisory-card {
          background-color: #F5F5F5;
          border: 1px solid #6B3E3E;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .advisory-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .advisory-title {
          font-weight: bold;
          font-size: 1.1rem;
          color: #000;
          margin-bottom: 0.75rem;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.3;
        }

        .advisory-description {
          font-size: 0.9rem;
          color: #000;
          line-height: 1.5;
          margin-bottom: 1rem;
          font-family: Arial, Helvetica, sans-serif;
        }

        .advisory-date {
          font-size: 0.8rem;
          color: #666;
          font-style: italic;
          text-align: right;
          font-family: Arial, Helvetica, sans-serif;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .advisory-card {
            padding: 1rem;
            margin-bottom: 0.75rem;
          }
          
          .advisory-title {
            font-size: 1rem;
          }
          
          .advisory-description {
            font-size: 0.85rem;
          }
          
          .advisory-date {
            font-size: 0.75rem;
          }
        }
      </style>

      <div class="advisory-card" id="${id}">
        <div class="advisory-title">${title}</div>
        <div class="advisory-description">${desc}</div>
        <div class="advisory-date">${date}</div>
      </div>
    `;
  }
}

customElements.define('advisory-card', AdvisoryCard);
