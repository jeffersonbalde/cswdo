class WebAdminDashboardSidebar extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.isCollapsed = false
    this.activeItem = "admin-dashboard"

    // Fixed component mapping - matches the data-view attributes
    this.componentMap = {
      "admin-dashboard": {
        title: "Dashboard",
        component: "admin-dashboard",
      },
      "manage-services": {
        title: "Manage Services",
        component: "manage-services",
      },
      "manage-advisories": {
        title: "Manage Advisories",
        component: "manage-advisories",
      },
      "manage-ordinances": {
        title: "Manage Ordinances",
        component: "manage-ordinances",
      },
      "news-updates": {
        title: "News and Updates",
        component: "news-updates",
      },
      "featured-stories": {
        title: "Featured Stories",
        component: "featured-stories",
      },
      "feedbacks-view": {
        title: "Feedbacks",
        component: "feedbacks-view",
      },
      "about-us": {
        title: "About Us",
        component: "about-us",
      },
      "chatbot-interface": {
        title: "Chatbot",
        component: "chatbot-interface",
      },
    }
  }

  connectedCallback() {
    this.render()
    this.setupEventListeners()
    this.loadUserData()
  }

  setupEventListeners() {
    const toggleBtn = this.shadowRoot.querySelector(".toggle-btn")
    toggleBtn.addEventListener("click", () => this.toggleSidebar())

    // Add click listeners to nav items
    const navItems = this.shadowRoot.querySelectorAll(".nav-item[data-view]")
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const view = e.currentTarget.dataset.view
        this.navigateTo(view)
      })
    })

    // Add logout functionality
    const logoutBtn = this.shadowRoot.querySelector(".logout-btn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.showLogoutConfirmation())
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed
    const sidebar = this.shadowRoot.querySelector(".sidebar")
    sidebar.classList.toggle("collapsed", this.isCollapsed)

    this.dispatchEvent(
      new CustomEvent("sidebar-toggle", {
        detail: { collapsed: this.isCollapsed },
        bubbles: true,
      }),
    )
  }

  navigateTo(view) {
    // Update active state
    this.shadowRoot.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active")
    })
    this.shadowRoot.querySelector(`[data-view="${view}"]`)?.classList.add("active")
    this.activeItem = view

    // Get component info
    const componentInfo = this.componentMap[view]
    if (componentInfo) {
      // Dispatch navigation event
      this.dispatchEvent(
        new CustomEvent("navigate-to", {
          detail: {
            view: view,
            title: componentInfo.title,
            component: componentInfo.component,
          },
          bubbles: true,
        }),
      )
    }
  }

  loadUserData() {
    try {
      // Use injected user data from PHP
      if (window.userData) {
        // Update the admin role and name in the sidebar
        const adminRoleElement = this.shadowRoot.querySelector('.admin-role')
        const adminNameElement = this.shadowRoot.querySelector('.admin-name')

        if (adminRoleElement) {
          adminRoleElement.textContent = window.userData.user_type.toUpperCase()
        }
        if (adminNameElement) {
          adminNameElement.textContent = window.userData.user_handler
        }
        
        console.log('User data loaded from injection:', window.userData)
      } else {
        // Fallback to API call if injection not available
        this.loadUserDataFromAPI()
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      // Fallback to default values
      const adminRoleElement = this.shadowRoot.querySelector('.admin-role')
      const adminNameElement = this.shadowRoot.querySelector('.admin-name')
      
      if (adminRoleElement) {
        adminRoleElement.textContent = 'WEB-ADMIN'
      }
      if (adminNameElement) {
        adminNameElement.textContent = 'User Web Admin'
      }
    }
  }

  async loadUserDataFromAPI() {
    try {
      // Fetch user data from secure API endpoint
      const response = await fetch('/php_folder/get-user-data.php', {
        method: 'GET',
        credentials: 'same-origin' // Include session cookies
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the admin role and name in the sidebar
        const adminRoleElement = this.shadowRoot.querySelector('.admin-role')
        const adminNameElement = this.shadowRoot.querySelector('.admin-name')

        if (adminRoleElement) {
          adminRoleElement.textContent = result.data.user_type.toUpperCase()
        }
        if (adminNameElement) {
          adminNameElement.textContent = result.data.user_handler
        }
      } else {
        console.error('Failed to load user data:', result.message)
        // Fallback to default values
        const adminRoleElement = this.shadowRoot.querySelector('.admin-role')
        const adminNameElement = this.shadowRoot.querySelector('.admin-name')
        
        if (adminRoleElement) {
          adminRoleElement.textContent = 'WEB-ADMIN'
        }
        if (adminNameElement) {
          adminNameElement.textContent = 'User Web Admin'
        }
      }
    } catch (error) {
      console.error('Error loading user data from API:', error)
      // Fallback to default values
      const adminRoleElement = this.shadowRoot.querySelector('.admin-role')
      const adminNameElement = this.shadowRoot.querySelector('.admin-name')
      
      if (adminRoleElement) {
        adminRoleElement.textContent = 'WEB-ADMIN'
      }
      if (adminNameElement) {
        adminNameElement.textContent = 'User Web Admin'
      }
    }
  }

  showLogoutConfirmation() {
    // Create and show logout confirmation modal
    const logoutModal = document.createElement('logout-confirmation-modal');
    document.body.appendChild(logoutModal);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100vh;
          flex-shrink: 0;
        }
        .sidebar {
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #f4f4f4 0%, #e8e8e8 100%);
          border-right: 2px solid #d97706;
          transition: width 0.3s ease;
          position: relative;
          overflow: hidden;
          background: rgb(249, 249, 249);
          display: flex;
          flex-direction: column;
        }
        .sidebar.collapsed {
          width: 60px;
        }
        .toggle-btn {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 30px;
          background: #d97706;
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          font-size: 14px;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .sidebar.collapsed .toggle-btn {
          opacity: 1;
          visibility: visible;
        }
        .logo-section {
          background: rgb(252, 252, 252);
          padding: 50px;
          text-align: center;
          color: white;
          min-height: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          visibility: visible;
          transition: opacity 0.3s ease, visibility 0.3s ease;
          flex-shrink: 0;
        }
        .sidebar.collapsed .logo-section {
          opacity: 0;
          visibility: hidden;
          height: 0;
          padding: 0;
          overflow: hidden;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          padding-right: 40px;
          font-size: 12px;
        }
        .logo2 img {
          width: 1500px;
          height: 50px;
          padding-left: 70px;
        }
        .admin-section {
          padding: 20px;
          margin-top: -20px;
          text-align: center;
          border-bottom: 1px solid #ddd;
          transition: padding 0.3s ease;
          flex-shrink: 0;
        }
        .sidebar.collapsed .admin-section {
          padding: 10px 5px;
          margin-top: 60px;
        }
        .admin-avatar {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: width 0.3s ease, height 0.3s ease;
        }
        .sidebar.collapsed .admin-avatar {
          width: 40px;
          height: 40px;
          margin-bottom: 0;
        }
        .sidebar.collapsed .admin-avatar img {
          width: 40px;
          height: 40px;
        }
        .admin-info {
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        .sidebar.collapsed .admin-info {
          opacity: 0;
          visibility: hidden;
          height: 0;
          overflow: hidden;
        }
        .admin-role {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .admin-name {
          font-size: 14px;
          color: #666;
        }
        .nav-menu {
          padding: 20px 0;
          flex: 1;
          overflow-y: auto;
        }
        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-size: 14px;
        }
        .sidebar.collapsed .nav-item {
          padding: 12px 10px;
          justify-content: center;
        }
        .nav-item:hover {
          background-color: rgba(217, 119, 6, 0.1);
        }
        .nav-item.active {
          background-color: rgba(217, 119, 6, 0.2);
          border-right: 3px solid #d97706;
        }
        .sidebar.collapsed .nav-item.active {
          border-right: none;
          border-left: 3px solid #d97706;
        }
        .nav-icon {
          width: 20px;
          height: 20px;
          margin-right: 15px;
          flex-shrink: 0;
        }
        .sidebar.collapsed .nav-icon {
          margin-right: 0;
        }
        .nav-text {
          white-space: nowrap;
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        .sidebar.collapsed .nav-text {
          opacity: 0;
          visibility: hidden;
          width: 0;
          overflow: hidden;
        }
        .logout-section {
          padding: 20px 0;
          border-top: 1px solid #ddd;
          flex-shrink: 0;
        }
      </style>
      <div class="sidebar">
        <button class="toggle-btn">&#9776;</button>
        
        <div class="logo-section">
          <div class="logo"><img src="/imgs/CSWDO Pags Logo.png" alt="CSWDO-Pagadian Logo" /></div>
          <div class="logo logo2"><img src="/imgs/CSWDO.png" alt="Pagadian City Logo" /></div>
        </div>
        
        <div class="admin-section">
          <div class="admin-avatar"><img src="/imgs/Admin Avatar.png" alt="Admin Avatar" /></div>
          <div class="admin-info">
            <div class="admin-role">WEB-ADMIN</div>
            <div class="admin-name">User Web Admin</div>
          </div>
        </div>
        
        <nav class="nav-menu">
          <button class="nav-item active" data-view="admin-dashboard">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">DASHBOARD</span>
          </button>
          <button class="nav-item" data-view="manage-services">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">MANAGE SERVICES</span>
          </button>
          <button class="nav-item" data-view="manage-advisories">
            <span class="nav-icon">⚠️</span>
            <span class="nav-text">MANAGE ADVISORIES</span>
          </button>
          <button class="nav-item" data-view="manage-ordinances">
            <span class="nav-icon">📋</span>
            <span class="nav-text">MANAGE ORDINANCES</span>
          </button>
          <button class="nav-item" data-view="news-updates">
            <span class="nav-icon">📰</span>
            <span class="nav-text">NEWS AND UPDATES</span>
          </button>
          <button class="nav-item" data-view="featured-stories">
            <span class="nav-icon">📖</span>
            <span class="nav-text">FEATURED STORIES</span>
          </button>
          <button class="nav-item" data-view="feedbacks-view">
            <span class="nav-icon">💬</span>
            <span class="nav-text">FEEDBACKS</span>
          </button>
          <button class="nav-item" data-view="about-us">
            <span class="nav-icon">ℹ️</span>
            <span class="nav-text">ABOUT US</span>
          </button>
          </button>
          <button class="nav-item" data-view="chatbot-interface">
            <span class="nav-icon">🤖</span>
            <span class="nav-text">CHATBOT</span>
          </button>

        </nav>
        
                 <div class="logout-section">
           <button class="nav-item logout-btn">
             <span class="nav-icon">🚪</span>
             <span class="nav-text">LOG OUT</span>
           </button>
         </div>
      </div>
    `
  }
}

customElements.define("webadmin-sidebar", WebAdminDashboardSidebar)
