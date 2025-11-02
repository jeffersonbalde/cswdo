class DashboardShell extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.sidebarCollapsed = false
    this.currentView = "admin-dashboard"
  }

  connectedCallback() {
    this.render()
    this.setupEventListeners()
    this.setupDateTime()
    // Load the default dashboard component
    this.loadDefaultComponent()
  }

  setupEventListeners() {
    // Listen for sidebar toggle events
    document.addEventListener("sidebar-toggle", (e) => {
      this.sidebarCollapsed = e.detail.collapsed
    })

    // Listen for navigation events from sidebar
    document.addEventListener("navigate-to", (e) => {
      this.loadComponent(e.detail.view, e.detail.title, e.detail.component)
    })
  }

  setupDateTime() {
    const dateTimeElem = this.shadowRoot.querySelector("#dateTime")
    const updateDateTime = () => {
      const now = new Date()
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
      dateTimeElem.textContent = now.toLocaleDateString("en-US", options)
    }
    updateDateTime()
    this._interval = setInterval(updateDateTime, 1000)
  }

  // Load the default component on startup
  loadDefaultComponent() {
    this.loadComponent("admin-dashboard", "Dashboard", "admin-dashboard")
  }

  // Main method to load components
  loadComponent(viewName, title, componentName) {
    const headerTitle = this.shadowRoot.querySelector(".header h1")
    const contentArea = this.shadowRoot.querySelector(".content-area")

    // Update header title
    headerTitle.textContent = title

    try {
      // Clear content and create new component instance
      contentArea.innerHTML = ""

      // Check if the component is registered
      if (customElements.get(componentName)) {
        const componentElement = document.createElement(componentName)
        contentArea.appendChild(componentElement)
        this.currentView = viewName
      } else {
        // Show error if component not found
        contentArea.innerHTML = `
          <div class="error">
            <h3>Component Not Found</h3>
            <p>The component "${componentName}" is not registered.</p>
            <p>Make sure the component file is loaded and the component is defined.</p>
          </div>
        `
      }
    } catch (error) {
      console.error("Error loading component:", error)
      contentArea.innerHTML = `
        <div class="error">
          <h3>Error Loading Content</h3>
          <p>Failed to load ${title}. Please try again.</p>
          <p>Error: ${error.message}</p>
        </div>
      `
    }
  }

  disconnectedCallback() {
    if (this._interval) {
      clearInterval(this._interval)
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100vh;
          flex: 1;
          overflow: hidden;
        }
        .main-content {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8f9fa;
          overflow: hidden;
        }
        .header {
          background: #d97706;
          color: white;
          padding: 15px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 5;
          flex-shrink: 0;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
        }
        .date-time {
          font-style: italic;
          font-size: 16px;
        }
        .content-area {
          flex: 1;
          overflow-y: auto;
          background: #f8f9fa;
          padding: 0px;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #666;
          font-size: 18px;
        }
        .loading::after {
          content: '';
          width: 20px;
          height: 20px;
          border: 2px solid #d97706;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 10px;
        }
        .error {
          padding: 30px;
          text-align: center;
          color: #dc2626;
          background: #fee2e2;
          border-radius: 8px;
          margin: 20px;
        }
        .error h3 {
          margin-bottom: 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .header {
            padding: 15px 20px;
          }
          .header h1 {
            font-size: 24px;
          }
          .date-time {
            font-size: 14px;
          }
          .content-area {
            padding: 15px;
          }
        }
      </style>
      <div class="main-content">
        <header class="header">
          <h1>Dashboard</h1>
          <div id="dateTime" class="date-time">Loading...</div>
        </header>
        <div class="content-area">
          <!-- Dynamic components will be loaded here -->
        </div>
      </div>
    `
  }
}

customElements.define("admin-mainshell", DashboardShell)
