class GoogleMapEmbed extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const apiKey = this.getAttribute('api-key');
    const query = this.getAttribute('q') || 'Pagadian City, Philippines'; // Default query
    const width = this.getAttribute('width') || '100%';
    const height = this.getAttribute('height') || '300px'; // Default height for mobile-first

    if (!apiKey) {
      console.error('GoogleMapEmbed: "api-key" attribute is required.');
      this.shadowRoot.innerHTML = `<style>
        :host { display: block; width: ${width}; height: ${height}; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #888; text-align: center; }
      </style><div>Please provide a Google Maps API key.</div>`;
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('width', width);
    iframe.setAttribute('height', height);
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('title', `Google Map of ${query}`); // Accessibility
    iframe.src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}`;

    // Basic styling for the host element and iframe
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: ${width};
          height: ${height};
          overflow: hidden;
          border-radius: 0.5rem; /* Matches section-card border-radius */
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* Matches section-card shadow */
        }
        iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }
      </style>
    `;
    this.shadowRoot.appendChild(iframe);
  }

  // Optional: Observe changes to attributes if you want the map to update dynamically
  static get observedAttributes() {
    return ['api-key', 'q', 'width', 'height'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      // Re-render the map if attributes change
      this.connectedCallback();
    }
  }
}

customElements.define('google-map-embed', GoogleMapEmbed);