// components/ordinance-card.js
class OrdinanceCard extends HTMLElement {
  static get observedAttributes() {
    return ['id', 'ref', 'title', 'date'];
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
    const ref = this.getAttribute('ref') || 'ORD REF';
    const title = this.getAttribute('title') || 'Ordinance Title';
    const date = this.getAttribute('date') || 'January 1, 2025';

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          border: 2px solid #e67e22;
          border-radius: 6px;
          padding: 1rem;
          background-color: #f8f9fa;
          text-align: center;
          transition: box-shadow 0.3s;
        }

        .card:hover {
          box-shadow: 0 4px 8px rgba(230, 126, 34, 0.3);
          border-color: #d35400;
        }

        .ref {
          font-size: 0.95rem;
          color: #333;
          font-weight: 500;
        }

        .title {
          font-weight: bold;
          font-size: 1.1rem;
          margin: 0.5rem 0;
          color: #2c3e50;
          line-height: 1.3;
        }

        .date {
          font-size: 0.9rem;
          color: #555;
          font-weight: 500;
        }
      </style>

      <div class="card" id="${id}">
        <div class="ref">${ref}</div>
        <div class="title">${title}</div>
        <div class="date">${date}</div>
      </div>
    `;
  }
}

customElements.define('ordinance-card', OrdinanceCard);
