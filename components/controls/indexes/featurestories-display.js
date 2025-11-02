class FeatureStoriesDisplay extends HTMLElement {
  static get observedAttributes() {
    return ['id', 'img', 'title', 'desc'];
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
    this.addEventListeners();
  }

  addEventListeners() {
    const card = this.shadowRoot.querySelector('.card');
    if (card) {
      card.addEventListener('click', () => {
        this.openModal();
      });
    }
  }

  openModal() {
    // Placeholder function for modal functionality
    // This will be implemented later as requested
    console.log('Modal functionality will be implemented later');
    
    // You can add your modal opening logic here when ready
    // For example:
    // - Dispatch a custom event
    // - Call a global modal function
    // - Show a specific modal based on the feature story ID
  }

  render() {
    const id = this.getAttribute('id') || '';
    const img = this.getAttribute('img') || '';
    const title = this.getAttribute('title') || 'Featured Story';
    const desc = this.getAttribute('desc') || 'Upload Date';

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          position: relative;
          width: 100%;
          height: 100%;
          aspect-ratio: 4/3;
          background-image: url('${img}');
          background-size: cover;
          background-position: center;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          transition: transform 0.3s;
          cursor: pointer;
        }

        .card:hover {
          transform: scale(1.01);
        }

        .overlay {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
          color: #fff;
          font-size: 0.95rem;
        }

        .title {
          font-weight: bold;
          font-size: 1rem;
        }

        .desc {
          font-size: 0.85rem;
          opacity: 0.9;
        }
      </style>

      <div class="card" id="${id}">
        <div class="overlay">
          <div class="title">${title}</div>
          <div class="desc">${desc}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('featurestories-display', FeatureStoriesDisplay);
