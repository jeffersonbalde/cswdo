// components/newsupdate-card.js
class NewsUpdateCard extends HTMLElement {
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

customElements.define('newsupdate-card', NewsUpdateCard);
