// components/service-card.js
class ServiceCard extends HTMLElement {
  static get observedAttributes() {
    return ['img', 'title', 'id', 'department', 'description'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // Helper function to truncate text to specified word count with ellipses
  truncateText(text, maxWords) {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) {
      return text;
    }
    return words.slice(0, maxWords).join(' ') + '...';
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const img = this.getAttribute('img') || '';
    const title = this.getAttribute('title') || 'Service Title';
    const id = this.getAttribute('id') || '';
    const department = this.getAttribute('department') || '';
    const description = this.getAttribute('description') || '';

    // Apply word constraints
    const truncatedTitle = this.truncateText(title, 10);
    const truncatedDescription = this.truncateText(description, 15);

    this.shadowRoot.innerHTML = `
      <style>
        /* Mobile-first base styles */
        .card {
          border: 2px solid #90EE90;
          border-radius: 6px;
          padding: 0.8rem;
          margin: 0.5rem;
          text-align: center;
          background-color: white;
          transition: 0.3s ease-in-out;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          width: calc(100% - 1rem);
        }

        /* Tablet styles (768px and up) */
        @media (min-width: 768px) {
          .card {
            border: 3px solid #90EE90;
            border-radius: 8px;
            padding: 1rem;
            margin: 0.5rem;
          }
        }

        /* Desktop styles (992px and up) */
        @media (min-width: 992px) {
          .card {
            padding: 1.2rem;
            margin: 0.5rem;
          }
        }

        .card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .card h5 {
          margin: 0;
          font-weight: bold;
          font-size: 1rem;
          line-height: 1.3;
          color: #333;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 2.6rem;
        }

        .card .description {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #555;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .card .department {
          margin-top: 0.8rem;
          font-size: 0.85rem;
          color: #666;
          font-style: italic;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
      </style>

      <div class="card" id="${id}">
        <img src="${img}" alt="${truncatedTitle}" />
        <h5>${truncatedTitle}</h5>
        ${truncatedDescription ? `<div class="description">${truncatedDescription}</div>` : ''}
        ${department ? `<div class="department">${department}</div>` : ''}
      </div>
    `;
  }
}

customElements.define('service-card', ServiceCard);
