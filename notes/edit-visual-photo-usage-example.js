// Example usage of edit-visual-photo-modal in different components

// Example 1: Using in a component with existing data
class ExampleComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const editBtn = this.shadowRoot.querySelector("#editVisualBtn");
    editBtn.addEventListener("click", () => this.showEditVisualPhotoModal());
  }

  async showEditVisualPhotoModal() {
    const modal = document.createElement("edit-visual-photo-modal");
    
    // Listen for visual photo updates
    modal.addEventListener("visual-photo-updated", (e) => {
      this.handleVisualPhotoUpdate(e.detail);
    });
    
    document.body.appendChild(modal);
    
    // Set current data and query identifier
    const currentData = {
      visualPhoto: this.shadowRoot.querySelector("#currentImage")?.src,
      visualContent: this.shadowRoot.querySelector("#currentContent")?.textContent?.trim()
    };
    
    // Use a unique query identifier for this component
    modal.setData(this, currentData, "exampleComponent");
  }

  handleVisualPhotoUpdate(detail) {
    const { data, query, sourceComponent } = detail;
    
    if (query === "exampleComponent") {
      // Update the component with new data
      const imageElement = this.shadowRoot.querySelector("#currentImage");
      const contentElement = this.shadowRoot.querySelector("#currentContent");
      
      if (data.visualPhoto && imageElement) {
        imageElement.src = data.visualPhoto;
      }
      
      if (data.visualContent && contentElement) {
        contentElement.textContent = data.visualContent;
      }
      
      console.log("Visual photo updated successfully!");
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div>
        <img id="currentImage" src="./imgs/default-image.png" alt="Current Image">
        <div id="currentContent">Current content description</div>
        <button id="editVisualBtn">Edit Visual Photo</button>
      </div>
    `;
  }
}

// Example 2: Using with data fetched from PHP backend
class AnotherComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const editBtn = this.shadowRoot.querySelector("#editVisualBtn");
    editBtn.addEventListener("click", () => this.showEditVisualPhotoModal());
  }

  async showEditVisualPhotoModal() {
    const modal = document.createElement("edit-visual-photo-modal");
    
    // Listen for visual photo updates
    modal.addEventListener("visual-photo-updated", (e) => {
      this.handleVisualPhotoUpdate(e.detail);
    });
    
    document.body.appendChild(modal);
    
    // Fetch existing data from PHP backend
    const existingData = await this.fetchVisualData("anotherComponent");
    
    // Set data for the modal
    modal.setData(this, existingData, "anotherComponent");
  }

  async fetchVisualData(query) {
    try {
      const response = await fetch("./php_folder/visualPictures.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "getVisualData", 
          query: query 
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        console.error("Failed to fetch visual data:", result.message);
        return { visualPhoto: null, visualContent: "" };
      }
    } catch (err) {
      console.error("Error fetching visual data:", err);
      return { visualPhoto: null, visualContent: "" };
    }
  }

  handleVisualPhotoUpdate(detail) {
    const { data, query, sourceComponent } = detail;
    
    if (query === "anotherComponent") {
      // Update the component with new data
      const imageElement = this.shadowRoot.querySelector("#currentImage");
      const contentElement = this.shadowRoot.querySelector("#currentContent");
      
      if (data.visualPhoto && imageElement) {
        imageElement.src = data.visualPhoto;
      }
      
      if (data.visualContent && contentElement) {
        contentElement.textContent = data.visualContent;
      }
      
      console.log("Visual photo updated successfully!");
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div>
        <img id="currentImage" src="./imgs/default-image.png" alt="Current Image">
        <div id="currentContent">Current content description</div>
        <button id="editVisualBtn">Edit Visual Photo</button>
      </div>
    `;
  }
}

// Example 3: Using in a simple function
function showEditVisualPhotoModalForComponent(componentName, currentData = null) {
  const modal = document.createElement("edit-visual-photo-modal");
  
  // Listen for visual photo updates
  modal.addEventListener("visual-photo-updated", (e) => {
    const { data, query, sourceComponent } = e.detail;
    console.log(`Visual photo updated for ${query}:`, data);
    
    // You can dispatch a custom event to notify the parent component
    document.dispatchEvent(new CustomEvent(`${query}-visual-updated`, {
      detail: { data, sourceComponent }
    }));
  });
  
  document.body.appendChild(modal);
  
  // Set data for the modal
  modal.setData(null, currentData, componentName);
}

// Usage examples:
// showEditVisualPhotoModalForComponent("homePage", { visualPhoto: "./imgs/home.jpg", visualContent: "Home page description" });
// showEditVisualPhotoModalForComponent("aboutPage", { visualPhoto: "./imgs/about.jpg", visualContent: "About page description" });

// Register custom elements
customElements.define("example-component", ExampleComponent);
customElements.define("another-component", AnotherComponent);
