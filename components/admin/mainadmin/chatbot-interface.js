// Chatbot Interface Component
class ChatbotInterface extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.services = []
    this.filteredServices = []
    this.isLoading = false
    this.isFiltering = false
    this.currentPage = 1
    this.rowsPerPage = 10
    this.filters = {
      category: "",
      status: "",
      search: "",
    }
    this.searchTimeout = null
  }

  connectedCallback() {
    this.render()
    this.setupEventListeners()
    this.loadSampleData()
  }

  loadSampleData() {
    this.services = [
      {
        id: 1,
        title: "Customer Support Bot",
        uploadDate: "2024-01-15",
        category: "Support",
        status: "Active",
      },
      {
        id: 2,
        title: "Sales Assistant",
        uploadDate: "2024-01-20",
        category: "Sales",
        status: "Active",
      },
      {
        id: 3,
        title: "FAQ Bot",
        uploadDate: "2024-02-01",
        category: "Support",
        status: "Inactive",
      },
      {
        id: 4,
        title: "Order Tracking Bot",
        uploadDate: "2024-02-10",
        category: "Orders",
        status: "Active",
      },
      {
        id: 5,
        title: "Booking Assistant",
        uploadDate: "2024-02-15",
        category: "Booking",
        status: "Active",
      },
      {
        id: 6,
        title: "Technical Support",
        uploadDate: "2024-02-20",
        category: "Support",
        status: "Maintenance",
      },
      {
        id: 7,
        title: "Product Advisor",
        uploadDate: "2024-03-01",
        category: "Sales",
        status: "Active",
      },
      {
        id: 8,
        title: "Feedback Collector",
        uploadDate: "2024-03-05",
        category: "Feedback",
        status: "Active",
      },
      {
        id: 9,
        title: "Appointment Scheduler",
        uploadDate: "2024-03-10",
        category: "Booking",
        status: "Active",
      },
      {
        id: 10,
        title: "Language Translator",
        uploadDate: "2024-03-15",
        category: "Utility",
        status: "Beta",
      },
      {
        id: 11,
        title: "Weather Assistant",
        uploadDate: "2024-03-20",
        category: "Utility",
        status: "Active",
      },
      {
        id: 12,
        title: "HR Assistant",
        uploadDate: "2024-03-25",
        category: "HR",
        status: "Active",
      },
    ]
    this.filteredServices = [...this.services]
    this.applyFilters()
  }

  setupEventListeners() {
    const addBtn = this.shadowRoot.querySelector("#addfeedbacksBtn")
    const searchInput = this.shadowRoot.querySelector("#searchInput")
    const categoryFilter = this.shadowRoot.querySelector("#categoryFilter")
    const statusFilter = this.shadowRoot.querySelector("#statusFilter")
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn")
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect")
    const refreshBtn = this.shadowRoot.querySelector("#refreshBtn")

    searchInput.addEventListener("input", (e) => {
      const searchValue = e.target.value.trim()

      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }

      this.searchTimeout = setTimeout(() => {
        this.filters.search = searchValue.toLowerCase()
        this.applyFilters()
      }, 300)
    })

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout)
        }
        const searchValue = e.target.value.trim()
        this.filters.search = searchValue.toLowerCase()
        this.applyFilters()
      }
    })

    categoryFilter.addEventListener("change", (e) => {
      this.filters.category = e.target.value
      this.applyFilters()
    })

    statusFilter.addEventListener("change", (e) => {
      this.filters.status = e.target.value
      this.applyFilters()
    })

    resetFiltersBtn.addEventListener("click", () => {
      this.resetFilters()
    })

    refreshBtn.addEventListener("click", () => {
      this.refreshTable()
    })

    rowsPerPageSelect.addEventListener("change", (e) => {
      this.rowsPerPage = Number.parseInt(e.target.value)
      this.currentPage = 1
      this.renderPaginatedTable()
    })

    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-view")) {
        const serviceId = e.target.dataset.serviceId
        this.viewService(serviceId)
      } else if (e.target.classList.contains("btn-edit")) {
        const serviceId = e.target.dataset.serviceId
        this.editService(serviceId)
      } else if (e.target.classList.contains("btn-delete")) {
        const serviceId = e.target.dataset.serviceId
        this.deleteService(serviceId)
      } else if (e.target.classList.contains("page-btn")) {
        const page = Number.parseInt(e.target.dataset.page)
        this.goToPage(page)
      } else if (e.target.classList.contains("prev-btn")) {
        this.goToPage(this.currentPage - 1)
      } else if (e.target.classList.contains("next-btn")) {
        this.goToPage(this.currentPage + 1)
      }
    })
  }

  async applyFilters() {
    if (this.services.length > 100) {
      this.setFilteringState(true)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    this.filteredServices = this.services.filter((service) => {
      const matchesSearch =
        !this.filters.search ||
        (service.title && service.title.toLowerCase().includes(this.filters.search)) ||
        (service.category && service.category.toLowerCase().includes(this.filters.search)) ||
        (service.status && service.status.toLowerCase().includes(this.filters.search)) ||
        (service.id && service.id.toString().toLowerCase().includes(this.filters.search))

      const matchesCategory = !this.filters.category || (service.category && service.category === this.filters.category)

      const matchesStatus = !this.filters.status || (service.status && service.status === this.filters.status)

      return matchesSearch && matchesCategory && matchesStatus
    })

    const categoryFilter = this.shadowRoot.querySelector("#categoryFilter")
    const statusFilter = this.shadowRoot.querySelector("#statusFilter")

    if (this.filters.category) {
      categoryFilter.classList.add("has-selection")
    } else {
      categoryFilter.classList.remove("has-selection")
    }

    if (this.filters.status) {
      statusFilter.classList.add("has-selection")
    } else {
      statusFilter.classList.remove("has-selection")
    }

    this.currentPage = 1
    this.setFilteringState(false)
    this.renderPaginatedTable()
    this.updateFilterDropdowns()
  }

  async resetFilters() {
    // Clear search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
    
    // Show filtering state
    this.setFilteringState(true)
    
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 150))
    
    this.filters = {
      category: "",
      status: "",
      search: "",
    }
    
    this.shadowRoot.querySelector("#searchInput").value = ""
    this.shadowRoot.querySelector("#categoryFilter").value = ""
    this.shadowRoot.querySelector("#statusFilter").value = ""
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#categoryFilter").classList.remove("has-selection")
    this.shadowRoot.querySelector("#statusFilter").classList.remove("has-selection")
    
    this.filteredServices = [...this.services]
    this.currentPage = 1
    this.setFilteringState(false)
    this.renderPaginatedTable()
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredServices.length / this.rowsPerPage)
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page
      this.renderPaginatedTable()
    }
  }

  renderPaginatedTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage
    const endIndex = startIndex + this.rowsPerPage
    const paginatedServices = this.filteredServices.slice(startIndex, endIndex)

    this.renderServicesToTable(paginatedServices)
    this.renderPagination()
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredServices.length / this.rowsPerPage)
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer")

    let paginationHTML = `
      <div class="pagination-info">
        ${this.getResultsInfo()}
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? "disabled" : ""}>‹</button>
    `

    if (this.filteredServices.length === 0) {
      // Show "1-0 of 0" with disabled page 1
      paginationHTML += `
        <button class="pagination-btn page-btn active" disabled>1</button>
        <button class="pagination-btn next-btn" disabled>›</button>
      `
    } else if (totalPages > 1) {
      // Multiple pages logic
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
          paginationHTML += `
            <button class="pagination-btn page-btn ${i === this.currentPage ? "active" : ""}" 
                    data-page="${i}">${i}</button>
          `
        } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
          paginationHTML += `<span class="pagination-ellipsis">...</span>`
        }
      }

      paginationHTML += `
          <button class="pagination-btn next-btn" ${this.currentPage === totalPages ? "disabled" : ""}>›</button>
      `
    } else {
      // Single page with data
      paginationHTML += `
        <button class="pagination-btn page-btn" disabled>1</button>
        <button class="pagination-btn next-btn" disabled>›</button>
      `
    }

    paginationHTML += `</div>`
    paginationContainer.innerHTML = paginationHTML
  }

  getResultsInfo() {
    if (this.filteredServices.length === 0) {
      return "1-0 of 0"
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1
    const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredServices.length)
    const total = this.filteredServices.length

    return `${startIndex}-${endIndex} of ${total}`
  }

  updateFilterDropdowns() {
    const categoryFilter = this.shadowRoot.querySelector("#categoryFilter")
    const statusFilter = this.shadowRoot.querySelector("#statusFilter")

    const currentCategory = categoryFilter.value
    const currentStatus = statusFilter.value

    const categories = [...new Set(this.services.map((s) => s.category))].filter(Boolean).sort()
    const statuses = [...new Set(this.services.map((s) => s.status))].filter(Boolean).sort()

    categoryFilter.innerHTML = '<option value="">All Categories</option>'
    categories.forEach((category) => {
      const selected = category === currentCategory ? "selected" : ""
      categoryFilter.innerHTML += `<option value="${category}" ${selected}>${category}</option>`
    })

    statusFilter.innerHTML = '<option value="">All Statuses</option>'
    statuses.forEach((status) => {
      const selected = status === currentStatus ? "selected" : ""
      statusFilter.innerHTML += `<option value="${status}" ${selected}>${status}</option>`
    })

    if (currentCategory) {
      categoryFilter.classList.add("has-selection")
    }
    if (currentStatus) {
      statusFilter.classList.add("has-selection")
    }
  }

  refreshTable() {
    this.loadSampleData()
  }

  setFilteringState(isFiltering) {
    this.isFiltering = isFiltering
    const tbody = this.shadowRoot.querySelector("#feedbacksTableBody")
    if (isFiltering) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 40px;">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <div class="loading-text">Applying filters...</div>
            </div>
          </td>
        </tr>
      `
    }
  }

  renderServicesToTable(services) {
    const tbody = this.shadowRoot.querySelector("#feedbacksTableBody")

    // Don't clear if we're in a loading state
    if (this.isLoading || this.isFiltering) {
      return
    }

    tbody.innerHTML = ""

    if (services.length === 0) {
      // Check if we have any active filters
      const hasActiveFilters = this.filters.search || this.filters.category || this.filters.status
      
      if (hasActiveFilters) {
        // No results found with filters applied
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">No Results Found</div>
                <div class="no-results-message">
                  No chatbots match your current filter criteria.<br>
                  Search term: "${this.filters.search || 'None'}"<br>
                  Try adjusting your filters or search terms.
                </div>
              </div>
            </td>
          </tr>
        `
      } else {
        // No data at all
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">📋</div>
                <div class="no-results-title">No Chatbots Available</div>
                <div class="no-results-message">
                  There are currently no chatbots to display.
                </div>
              </div>
            </td>
          </tr>
        `
      }
      return
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage
    services.forEach((service, index) => {
      const row = document.createElement("tr")
      
      row.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${startIndex + index + 1}</td>
        <td style="text-align: left; font-weight: 500;">${service.title || 'N/A'}</td>
        <td style="text-align: center;">${service.uploadDate || 'N/A'}</td>
        <td style="text-align: center;">
          <button class="btn-view" data-service-id="${service.id}">👁 View</button>
          <button class="btn-edit" data-service-id="${service.id}">✏️ Edit</button>
          <button class="btn-delete" data-service-id="${service.id}">🗑️ Delete</button>
        </td>
      `
      tbody.appendChild(row)
    })
  }

  viewService(serviceId) {
    console.log("Viewing service:", serviceId)
  }

  editService(serviceId) {
    console.log("Editing service:", serviceId)
  }

  deleteService(serviceId) {
    if (confirm("Are you sure you want to delete this chatbot?")) {
      this.services = this.services.filter((s) => s.id !== Number.parseInt(serviceId))
      this.applyFilters()
      this.showNotification("Chatbot deleted successfully", "success")
    }
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

  showError(message) {
    const tbody = this.shadowRoot.querySelector("#feedbacksTableBody")
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #ef4444;">${message}</td></tr>`
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
    
        .feedbacks-content {
          padding: 30px;
          max-width: 100%;
          margin: 0 auto;
        }
        
        .feedbacks-controls {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        /* Filters row styling */
        .filters-row {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          align-items: center;
          flex-wrap: wrap;
          padding: 15px 20px;
          background: #A8D5BA;
          border-radius: 8px;
          border: 1px solid #ea580c;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .filter-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          min-width: fit-content;
        }
        
        .filter-select {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          min-width: 150px;
          transition: font-weight 0.2s ease;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }
        
        .filter-select.has-selection {
          font-weight: 600;
        }
        
        .reset-filters-btn, .refresh-btn {
          padding: 8px 16px;
          border: 1px solid #ccc;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .reset-filters-btn {
          background: #dc2626;
          color: white;
          border: none;
        }
        
        .reset-filters-btn:hover {
          background: #b91c1c;
        }
        
        .refresh-btn {
          background: #059669;
          color: white;
          border: none;
        }
        
        .refresh-btn:hover {
          background: #047857;
        }
        
        .search-container {
          flex: 1;
          position: relative;
        }

        .left-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          pointer-events: none;
          z-index: 1;
        }

        .search-input {
          width: 90%;
          padding: 10px 15px 10px 35px; 
          border: 1px solid black;
          border-radius: 6px;
          font-size: 17px;
          background: white;
        }

        .search-input:focus {
          outline: none;
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }

        .feedback-report-btn {
          background: #d97706;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 17px;
          font-weight: 500;
          white-space: nowrap;
          width: 20%;
        }
        
        .feedback-report-btn:hover {
          background: #b45309;
        }

        .feedbacks-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ea580c;
          margin: 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-collapse: collapse;
        }

        .feedbacks-table th,
        .feedbacks-table td {
          padding: 15px;
          text-align: center;
          border-bottom: none;
        }

        .feedbacks-table th {
          background: #A8D5BA;
          border-bottom: 2px solid #ea580c;
          font-weight: 700;
          color: #1f2937;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 18px 15px;
          position: relative;
        }
        
        .feedbacks-table th:first-child {
          border-top-left-radius: 8px;
        }
        
        .feedbacks-table th:last-child {
          border-top-right-radius: 8px;
        }

        .feedbacks-table td {
          font-size: 16px;
          color: #374151;
          padding: 16px 15px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
        }
       
        .feedbacks-table tbody tr {
          transition: background-color 0.2s ease;
        }
        
        .feedbacks-table tbody tr:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .feedbacks-table tbody tr:last-child td {
          border-bottom: none;
        }

        .btn-view, .btn-edit, .btn-delete {
          padding: 6px 15px;
          border: 1px solid black;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
          font-size: 15px;
          font-weight: 500;
        }
        
        .btn-view {
          background: #d97706;
          color: white;
        }
        
        .btn-view:hover {
          background: #A8D5BA;
          color: white;
          border: none;
        }
        
        .btn-edit {
          background: #455A64;
          color: white;
        }
        
        .btn-edit:hover {
          background: #A8D5BA;
          color: white;
          border: none;
        }
        
        .btn-delete {
          background: rgb(252, 0, 0);
          color: white;
        }
        
        .btn-delete:hover {
          background: rgb(3, 3, 3);
          color: white;
          border: none;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #d97706;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: #666;
          font-size: 16px;
          font-weight: 500;
        }

        .no-results-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          color: #666;
        }

        .no-results-icon {
          font-size: 48px;
          opacity: 0.5;
        }

        .no-results-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }

        .no-results-message {
          font-size: 14px;
          text-align: center;
          line-height: 1.5;
          max-width: 400px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Pagination styling */
        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 15px 20px;
          background: #A8D5BA;
          border-radius: 8px;
          border: 1px solid #ea580c;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .rows-per-page {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        
        .rows-per-page select {
          padding: 6px 10px;
          border: 1px solid #666;
          border-radius: 4px;
          font-size: 14px;
          background: white;
          color: #333;
        }
        
        .rows-per-page select:focus {
          outline: none;
          border-color: #d97706;
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
        }
        
        .pagination-info {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          font-size: 14px;
          color: #333;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.9);
          padding: 4px 12px;
          border-radius: 4px;
          border: 1px solid #666;
        }
        
        .pagination-controls {
          display: flex;
          gap: 3px;
          align-items: center;
          margin-left: auto;
        }
        
        .pagination-btn {
          padding: 6px 10px;
          border: 1px solid #666;
          background: white;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
          min-width: 32px;
          text-align: center;
          color: #333;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .pagination-btn:hover:not(:disabled) {
          background: #f0f0f0;
          border-color: #d97706;
        }
        
        .pagination-btn.active {
          background: #d97706;
          color: white;
          border-color: #d97706;
          font-weight: 600;
        }
        
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f5f5f5;
        }
        
        .pagination-ellipsis {
          padding: 6px 4px;
          color: #333;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .feedbacks-controls {
            flex-direction: column;
            align-items: stretch;
          }
          
          .filters-row {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
            padding: 15px;
          }
          
          .filter-group {
            flex-direction: column;
            align-items: stretch;
            gap: 5px;
          }
          
          .filter-select {
            min-width: auto;
            width: 100%;
          }
          
          .reset-filters-btn,
          .refresh-btn {
            margin-left: 0;
            align-self: stretch;
          }
          
          .feedbacks-content {
            padding: 20px;
          }
          
          .feedbacks-table {
            font-size: 12px;
          }
          
          .feedbacks-table th,
          .feedbacks-table td {
            padding: 10px 8px;
          }
          
          .pagination-container {
            flex-direction: column;
            gap: 15px;
            position: static;
            padding: 15px;
          }
          
          .pagination-info {
            position: static;
            transform: none;
            order: 2;
            background: white;
          }
          
          .rows-per-page {
            order: 1;
          }
          
          .pagination-controls {
            order: 3;
            margin-left: 0;
            justify-content: center;
          }
        }
      </style>

      <!-- Main Content -->
      <div class="feedbacks-content">
        <!-- Controls Section -->
        <div id="feedbacksControls" class="feedbacks-controls">
          <div class="search-container">
            <span class="left-icon">🔍</span>
            <input 
              type="text" 
              id="searchInput" 
              class="search-input" 
              placeholder="Search chatbots..."
            >
          </div>
          <button id="feedbackReportBtn" class="feedback-report-btn">Generate Report</button>
        </div>
        
        <!-- Filters row -->
        <div class="filters-row">
          <div class="filter-group">
            <label class="filter-label">Category:</label>
            <select id="categoryFilter" class="filter-select">
              <option value="">All Categories</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Status:</label>
            <select id="statusFilter" class="filter-select">
              <option value="">All Statuses</option>
            </select>
          </div>
          <button id="resetFiltersBtn" class="reset-filters-btn">🔄 Reset Filters</button>
          <button id="refreshBtn" class="refresh-btn">🔃 Refresh</button>
        </div>
        
        <!-- Updated table headers for requested columns -->
        <table id="feedbacksTable" class="feedbacks-table">
          <thead>
            <tr>
              <th id="thNo">No.</th>
              <th id="thTitle">Title</th>
              <th id="thUploadDate">Upload Date</th>
              <th id="thAction">Action</th>
            </tr>
          </thead>
          <tbody id="feedbacksTableBody">
            <tr><td colspan="4" style="text-align: center; padding: 40px;">Loading chatbots...</td></tr>
          </tbody>
        </table>
        
        <!-- Pagination section -->
        <div class="pagination-container">
          <div class="rows-per-page">
            <label>Rows per page:</label>
            <select id="rowsPerPageSelect">
              <option value="5">5</option>
              <option value="10" selected>10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div id="paginationContainer"></div>
        </div>
      </div>
    `
  }
}

customElements.define("chatbot-interface", ChatbotInterface)