class AboutUs extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.keyOfficials = [
      { id: 1, title: "Head Officials", department: "Executive Office" },
      { id: 2, title: "Child and Youth Welfare", department: "CYW Department" },
      { id: 3, title: "Family and Community", department: "FC Department" },
      { id: 4, title: "Emergency Welfare", department: "Emergency Services" },
      { id: 5, title: "Sectoral Welfare", department: "Sectoral Services" },
      { id: 6, title: "Administrative Services", department: "Admin Department" },
    ]
  }

  connectedCallback() {
    console.log("AboutUs component connected");
    this.render()
    this.setupEventListeners()
    console.log("AboutUs component fully initialized");
  }

  setupEventListeners() {
    console.log("Setting up event listeners for AboutUs");
    // Event delegation for all buttons
    this.shadowRoot.addEventListener("click", (e) => {
      console.log("Click detected on:", e.target);
      if (e.target.classList.contains("edit-header-btn")) {
        console.log("Edit header button clicked");
        this.handleButtonClick("editHeader")
      } else if (e.target.classList.contains("edit-mission-btn")) {
        console.log("Edit mission button clicked");
        this.handleButtonClick("editMission")
      } else if (e.target.classList.contains("edit-org-btn")) {
        console.log("Edit org button clicked");
        this.handleButtonClick("editOrg")
      } else if (e.target.classList.contains("view-list-btn")) {
        const officialId = e.target.dataset.officialId
        const officialType = e.target.dataset.officialType
        console.log("View list button clicked:", officialType, officialId);
        this.handleButtonClick(`view${officialType}List`, officialId)
      }
    })
  }

  handleButtonClick(action, data = null) {
    console.log(`AboutUs button action: ${action}`, data);
    switch (action) {
      case "editHeader":
        console.log("Executing editHeader");
        this.editHeaderContent()
        break
      case "editMission":
        console.log("Executing editMission");
        this.editMissionContent()
        break
      case "editOrg":
        console.log("Executing editOrg");
        this.editOrgStructure()
        break
      case "viewOfficialList":
        console.log("Executing viewOfficialList");
        this.loadComponent("about-us-head-officials", data)
        break
      case "viewCYWList":
        console.log("Executing viewCYWList");
        this.loadComponent("about-us-cw-officials", data)
        break
      case "viewFCList":
        console.log("Executing viewFCList");
        this.loadComponent("about-us-fc-officials", data)
        break
      case "viewEmergencyList":
        console.log("Executing viewEmergencyList");
        this.loadComponent("about-us-em-officials", data)
        break
      case "viewSectoralList":
        console.log("Executing viewSectoralList");
        this.loadComponent("about-us-sec-officials", data)
        break
      case "viewAdminList":
        console.log("Executing viewAdminList");
        this.loadComponent("about-us-admin-officials", data)
        break
      default:
        console.warn(`Unknown button action: ${action}`)
        break
    }
  }

  editHeaderContent() {
    this.showNotification("Header edit functionality", "info")
  }

  editMissionContent() {
    this.showNotification("Mission/Vision/Goals edit functionality", "info")
  }

  editOrgStructure() {
    this.showNotification("Organizational Structure edit functionality", "info")
  }

  loadComponent(componentName, data = null) {
    try {
      // Use the sidebar's navigation system
      const event = new CustomEvent('navigate-to', {
        detail: {
          view: componentName,
          title: this.getComponentTitle(componentName),
          component: componentName,
          data: data
        },
        bubbles: true,
        composed: true
      })
      
      this.dispatchEvent(event)
      console.log(`Loading component: ${componentName}`, data)
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error)
      this.showNotification(`Failed to load ${componentName}`, "error")
    }
  }

  getComponentTitle(componentName) {
    const titleMap = {
      'about-us-head-officials': 'About Us',
      'about-us-cw-officials': 'About Us',
      'about-us-fc-officials': 'About Us',
      'about-us-emergency-officials': 'About Us',
      'about-us-sectoral-officials': 'About Us',
      'about-us-admin-officials': 'About Us'
    }
    return titleMap[componentName] || 'Officials'
  }

  showNotification(message, type) {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      ${
        type === "success" ? "background: #10b981;" : type === "error" ? "background: #ef4444;" : "background: #3b82f6;"
      }
    `
    document.body.appendChild(notification)
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
            
        .edit-header-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #d97706;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 17px;
          z-index: 4;
          width: 100px;
        }
        .edit-header-btn:hover {
          background: #b45309;
        }
                      
        .about-header {
          position: relative;
          height: 250px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          text-align: center;
        }
        .about-header-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .about-header-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
          z-index: 2;
        }
        .about-header-content {
          position: relative;
          z-index: 3;
          padding: 20px;
        }
        .about-title {
          font-size: 3rem;
          font-weight: bold;
          letter-spacing: 2px;
        }
        .about-description {
          max-width: 600px;
          font-size: 14px;
          line-height: 1.6;
        }

        /* Main content styles */
        .about-content {
          padding: 30px;
          background: #f8f9fa;
        }

        .info-card {
          background: #e9ecef;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .info-text {
          font-size: 1.1rem;
          color: #495057;
          margin: 0;
          font-weight: 500;
        }

        .edit-btn {
          background: #d97706;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          min-width: 80px;
        }

        .edit-btn:hover {
          background: #b45309;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: bold;
          color: #333;
          margin: 30px 0 20px 0;
        }

        /* Key Officials Grid */
        .officials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .official-card {
          background: #e9ecef;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 30px 20px;
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .official-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .official-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 15px 0;
        }

        .view-list-btn {
          background: #d97706;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          min-width: 100px;
        }

        .view-list-btn:hover {
          background: #b45309;
        }

        @media (max-width: 768px) {
          .about-title {
            font-size: 2rem;
          }
                    
          .about-content {
            padding: 20px;
          }

          .info-card {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .officials-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .official-card {
            padding: 20px 15px;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .officials-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1025px) {
          .officials-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      </style>
      
      <div class="about-container">
        <!-- Header Section -->
        <div id="aboutHeader" class="about-header">
          <!-- Background Image -->
          <img id="aboutHeaderImage" src="./imgs/home_bckgrnd.png" alt="About Us Background" class="about-header-image">
                    
          <!-- Dark Overlay -->
          <div id="aboutHeaderOverlay" class="about-header-overlay"></div>
                    
          <!-- Edit Button -->
          <button id="editHeaderBtn" class="edit-header-btn">✍🏻 Edit</button>
                    
          <!-- Header Content -->
          <div id="aboutHeaderContent" class="about-header-content">
            <h1 id="aboutTitle" class="about-title">Featured Stories</h1>
            <p id="aboutDescription" class="about-description">
              The City Social Welfare and Development Office in Pagadian City is mandated to provide social protective and social development services to poor, vulnerable and disadvantaged individuals, families, groups and communities.
            </p>
          </div>
        </div>

        <!-- Main Content -->
        <div class="about-content">
          <!-- Mission/Vision/Goals Card -->
          <div class="info-card">
            <p class="info-text">Mission | Vision | Goals</p>
            <button id="editMissionBtn" class="edit-btn edit-mission-btn">Edit</button>
          </div>

          <!-- Organizational Structure Card -->
          <div class="info-card">
            <p class="info-text">Organizational Structure</p>
            <button id="editOrgBtn" class="edit-btn edit-org-btn">Edit</button>
          </div>

          <!-- Key Officials Section -->
          <h2 class="section-title">Key Officials</h2>
          <div class="officials-grid">
            <div class="official-card">
              <h3 class="official-title">Head Officials</h3>
              <button class="view-list-btn" data-official-id="1" data-official-type="Official">View List</button>
            </div>
            <div class="official-card">
              <h3 class="official-title">Child and Youth Welfare</h3>
              <button class="view-list-btn" data-official-id="2" data-official-type="CYW">View List</button>
            </div>
            <div class="official-card">
              <h3 class="official-title">Family and Community</h3>
              <button class="view-list-btn" data-official-id="3" data-official-type="FC">View List</button>
            </div>
            <div class="official-card">
              <h3 class="official-title">Emergency Welfare</h3>
              <button class="view-list-btn" data-official-id="4" data-official-type="Emergency">View List</button>
            </div>
            <div class="official-card">
              <h3 class="official-title">Sectoral Welfare</h3>
              <button class="view-list-btn" data-official-id="5" data-official-type="Sectoral">View List</button>
            </div>
            <div class="official-card">
              <h3 class="official-title">Administrative Services</h3>
              <button class="view-list-btn" data-official-id="6" data-official-type="Admin">View List</button>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

customElements.define("about-us", AboutUs)
