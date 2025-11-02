// components/newsupdate-display.js
class NewsUpdateDisplay extends HTMLElement {
  static get observedAttributes() {
    return ['id', 'img', 'title', 'date'];
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
    this.addClickEvent();
  }

  addClickEvent() {
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
    console.log('Modal functionality will be implemented here');
    
    // Get the news update data
    const id = this.getAttribute('id') || '';
    const img = this.getAttribute('img') || '';
    const title = this.getAttribute('title') || 'News Title';
    const date = this.getAttribute('date') || 'Upload Date';
    
    // For now, just log the data that would be passed to the modal
    console.log('News Update Data:', { id, img, title, date });
  }

  render() {
    const id = this.getAttribute('id') || '';
    const img = this.getAttribute('img') || '';
    const title = this.getAttribute('title') || 'News Title';
    const date = this.getAttribute('date') || 'Upload Date';

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

        .date {
          font-size: 0.85rem;
          opacity: 0.9;
        }
      </style>

      <div class="card" id="${id}">
        <div class="overlay">
          <div class="title">${title}</div>
          <div class="date">${date}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('newsupdate-display', NewsUpdateDisplay);
