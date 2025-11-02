class AccomplishmentReports extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.reports = []
    this.filteredReports = []
    this.isLoading = false
    this.isFiltering = false
    this.currentPage = 1
    this.rowsPerPage = 10
    this.filters = {
      status: '',
      department: '',
      search: ''
    }
    this.searchTimeout = null
    // Counts ready to be bound from database queries
    this.pendingCount = 0
    this.approvedCount = 0
    this.declinedCount = 0
  }

  connectedCallback() {
    this.render()
    this.setupEventListeners()
    this.fetchAndRenderReports()
  }

  setupEventListeners() {
    const addReportBtn = this.shadowRoot.querySelector("#addReportBtn")
    const searchInput = this.shadowRoot.querySelector("#searchInput")
    const statusFilter = this.shadowRoot.querySelector("#statusFilter")
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter")
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn")
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect")

    // Add Report button
    addReportBtn.addEventListener("click", () => this.showAddReportModal())

    // Search functionality with improved debounce
    searchInput.addEventListener("input", (e) => {
      const searchValue = e.target.value.trim()
      console.log("Search input:", searchValue)
      
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      // Set new timeout
      this.searchTimeout = setTimeout(() => {
        console.log("Applying search filter:", searchValue)
        this.filters.search = searchValue.toLowerCase()
        this.applyFilters()
      }, 300)
    })

    // Also handle immediate search on Enter key
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout)
        }
        const searchValue = e.target.value.trim()
        console.log("Enter key search:", searchValue)
        this.filters.search = searchValue.toLowerCase()
        this.applyFilters()
      }
    })

    // Filter functionality
    statusFilter.addEventListener("change", (e) => {
      this.filters.status = e.target.value
      this.applyFilters()
    })

    departmentFilter.addEventListener("change", (e) => {
      this.filters.department = e.target.value
      this.applyFilters()
    })

    // Reset filters
    resetFiltersBtn.addEventListener("click", () => {
      this.resetFilters()
    })

    // Add refresh button event listener
    const refreshBtn = this.shadowRoot.querySelector("#refreshBtn")
    refreshBtn.addEventListener("click", () => {
      this.refreshTable()
    })

    // Rows per page
    rowsPerPageSelect.addEventListener("change", (e) => {
      this.rowsPerPage = parseInt(e.target.value)
      this.currentPage = 1
      this.renderPaginatedTable()
    })

    // Event delegation for action buttons and pagination
    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-view")) {
        const reportId = e.target.dataset.reportId
        this.viewReport(reportId)
      } else if (e.target.classList.contains("btn-edit")) {
        const reportId = e.target.dataset.reportId
        this.editReport(reportId)
      } else if (e.target.classList.contains("btn-delete")) {
        const reportId = e.target.dataset.reportId
        this.deleteReport(reportId)
      } else if (e.target.classList.contains("page-btn")) {
        const page = parseInt(e.target.dataset.page)
        this.goToPage(page)
      } else if (e.target.classList.contains("prev-btn")) {
        this.goToPage(this.currentPage - 1)
      } else if (e.target.classList.contains("next-btn")) {
        this.goToPage(this.currentPage + 1)
      }
    })

    // Listen for refresh events from modals
    document.addEventListener("refresh-reports-table", () => {
      console.log("Refresh event received from modal")
      this.refreshTable()
    })
  }

  setLoadingState(loading, message = "Loading reports...") {
    this.isLoading = loading
    const tableBody = this.shadowRoot.getElementById("reportsTableBody")
    
    if (loading) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px;">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <div class="loading-text">${message}</div>
            </div>
          </td>
        </tr>
      `
    }
  }

  setFilteringState(filtering) {
    this.isFiltering = filtering
    const tableBody = this.shadowRoot.getElementById("reportsTableBody")
    
    if (filtering) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px;">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <div class="loading-text">Applying filters...</div>
            </div>
          </td>
        </tr>
      `
    }
  }

  async applyFilters() {
    console.log("Applying filters with:", this.filters)
    
    // Show filtering state only if we have a significant operation
    if (this.reports.length > 100) {
      this.setFilteringState(true)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    this.filteredReports = this.reports.filter(report => {
      // Search filter - check multiple fields
      const matchesSearch = !this.filters.search || 
        (report.id && report.id.toString().toLowerCase().includes(this.filters.search)) ||
        (report.title && report.title.toLowerCase().includes(this.filters.search)) ||
        (report.dateSubmitted && report.dateSubmitted.toLowerCase().includes(this.filters.search)) ||
        (report.dateApproved && report.dateApproved.toLowerCase().includes(this.filters.search)) ||
        (report.department && report.department.toLowerCase().includes(this.filters.search))
      
      // Status filter
      const matchesStatus = !this.filters.status || 
        (report.status && report.status === this.filters.status)
      
      // Department filter (replaced type filter)
      const matchesDepartment = !this.filters.department || 
        (report.department && report.department === this.filters.department)

      const matches = matchesSearch && matchesStatus && matchesDepartment
      
      return matches
    })

    console.log(`Filtered ${this.filteredReports.length} reports from ${this.reports.length} total`)

    // Add visual feedback for selected filters
    const statusFilter = this.shadowRoot.querySelector("#statusFilter")
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter")
    
    if (this.filters.status) {
      statusFilter.classList.add('has-selection')
    } else {
      statusFilter.classList.remove('has-selection')
    }
    
    if (this.filters.department) {
      departmentFilter.classList.add('has-selection')
    } else {
      departmentFilter.classList.remove('has-selection')
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
      status: '',
      department: '',
      search: ''
    }
    
    this.shadowRoot.querySelector("#searchInput").value = ''
    this.shadowRoot.querySelector("#statusFilter").value = ''
    this.shadowRoot.querySelector("#departmentFilter").value = ''
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#statusFilter").classList.remove('has-selection')
    this.shadowRoot.querySelector("#departmentFilter").classList.remove('has-selection')
    
    this.filteredReports = [...this.reports]
    this.currentPage = 1
    this.setFilteringState(false)
    this.renderPaginatedTable()
  }

  refreshTable() {
    console.log("Refreshing table data...")
    this.fetchAndRenderReports()
  }

  updateFilterDropdowns() {
    const statusFilter = this.shadowRoot.querySelector("#statusFilter")
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter")
    
    // Store current selections
    const currentStatus = statusFilter.value
    const currentDepartment = departmentFilter.value
    
    // Get unique statuses and departments
    const statuses = [...new Set(this.reports.map(r => r.status))].filter(Boolean).sort()
    const departments = [...new Set(this.reports.map(r => r.department))].filter(Boolean).sort()
    
    // Update status dropdown
    statusFilter.innerHTML = '<option value="">All Status</option>'
    statuses.forEach(status => {
      const selected = status === currentStatus ? 'selected' : ''
      statusFilter.innerHTML += `<option value="${status}" ${selected}>${status}</option>`
    })
    
    // Update department dropdown
    departmentFilter.innerHTML = '<option value="">All Departments</option>'
    departments.forEach(department => {
      const selected = department === currentDepartment ? 'selected' : ''
      departmentFilter.innerHTML += `<option value="${department}" ${selected}>${department}</option>`
    })
    
    // Restore visual feedback
    if (currentStatus) {
      statusFilter.classList.add('has-selection')
    }
    if (currentDepartment) {
      departmentFilter.classList.add('has-selection')
    }
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredReports.length / this.rowsPerPage)
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page
      this.renderPaginatedTable()
    }
  }

  renderPaginatedTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage
    const endIndex = startIndex + this.rowsPerPage
    const paginatedReports = this.filteredReports.slice(startIndex, endIndex)
    
    this.renderReportsToTable(paginatedReports)
    this.renderPagination()
  }

  renderReportsToTable(reports) {
    const tableBody = this.shadowRoot.getElementById("reportsTableBody")
    
    // Don't clear if we're in a loading state
    if (this.isLoading || this.isFiltering) {
      return
    }
    
    tableBody.innerHTML = ""
    
    if (reports.length === 0) {
      // Check if we have any active filters
      const hasActiveFilters = this.filters.search || this.filters.status || this.filters.department
      
      if (hasActiveFilters) {
        // No results found with filters applied
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">No Results Found</div>
                <div class="no-results-message">
                  No reports match your current filter criteria.<br>
                  Search term: "${this.filters.search || 'None'}"<br>
                  Try adjusting your filters or search terms.
                </div>
              </div>
            </td>
          </tr>
        `
      } else {
        // No data at all
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">📋</div>
                <div class="no-results-title">No Reports Available</div>
                <div class="no-results-message">
                  There are currently no reports to display.
                </div>
              </div>
            </td>
          </tr>
        `
      }
      return
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage
    reports.forEach((report, index) => {
      const row = document.createElement("tr")
      
      const rowNumber = startIndex + index + 1
      
      // Determine status and date approved display
      const status = report.status || 'Pending';
      const isPending = status === 'Pending' || !status || status === 'N/A';
      
      // Date Approved column: Show "Pending" if pending, otherwise show actual date
      let dateApprovedDisplay = '';
      if (isPending) {
        dateApprovedDisplay = '<span class="status-badge status-pending">Pending</span>';
      } else {
        dateApprovedDisplay = report.dateApproved || 'N/A';
      }
      
      // Status column: Show colored badge based on status
      let statusDisplay = '';
      if (status.toLowerCase() === 'pending' || isPending) {
        statusDisplay = '<span class="status-badge status-pending">Pending</span>';
      } else if (status.toLowerCase() === 'approved') {
        statusDisplay = '<span class="status-badge status-approved">Approved</span>';
      } else if (status.toLowerCase() === 'declined') {
        statusDisplay = '<span class="status-badge status-declined">Declined</span>';
      } else {
        statusDisplay = '<span class="status-badge status-pending">' + status + '</span>';
      }
      
      row.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${report.id || report.reportId || rowNumber}</td>
        <td style="text-align: center;">${report.dateSubmitted || 'N/A'}</td>
        <td style="text-align: center;">${dateApprovedDisplay}</td>
        <td style="text-align: center;">${report.department || 'N/A'}</td>
        <td style="text-align: left; font-weight: 500;">${report.title || report.contentTitle || 'N/A'}</td>
        <td style="text-align: center;">${statusDisplay}</td>
        <td style="text-align: center;">
          <button class="btn-view" data-report-id="${report.id || report.reportId}">👁 View</button>
        </td>
      `
      tableBody.appendChild(row)
    })
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredReports.length / this.rowsPerPage)
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer")
    
    let paginationHTML = `
      <div class="pagination-info">
        ${this.getResultsInfo()}
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
    `

    if (this.filteredReports.length === 0) {
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
            <button class="pagination-btn page-btn ${i === this.currentPage ? 'active' : ''}" 
                    data-page="${i}">${i}</button>
          `
        } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
          paginationHTML += `<span class="pagination-ellipsis">...</span>`
        }
      }
      
      paginationHTML += `
          <button class="pagination-btn next-btn" ${this.currentPage === totalPages ? 'disabled' : ''}>›</button>
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
    if (this.filteredReports.length === 0) {
      return "1-0 of 0"
    }
    
    const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1
    const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredReports.length)
    const total = this.filteredReports.length
    
    return `${startIndex}-${endIndex} of ${total}`
  }

  async fetchAndRenderReports() {
    this.setLoadingState(true, "Loading reports...")
    
    try {
      const formData = new FormData()
      formData.append('action', 'fetchdata')
      
      const response = await fetch('./php_folder/manageAccomplishmentReports.php', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result && result.success) {
        this.reports = Array.isArray(result.data) ? result.data : []
        // Update counts from database
        this.pendingCount = result.counts?.pending || this.reports.filter(r => r.status === 'Pending').length
        this.approvedCount = result.counts?.approved || this.reports.filter(r => r.status === 'Approved').length
        this.declinedCount = result.counts?.declined || this.reports.filter(r => r.status === 'Declined').length
      } else {
        this.reports = []
        this.pendingCount = 0
        this.approvedCount = 0
        this.declinedCount = 0
        this.showNotification(result?.message || 'Failed to fetch reports.', 'error')
      }
      
      console.log("Loaded reports:", this.reports.length)
      
      this.filteredReports = [...this.reports]
      this.setLoadingState(false)
      this.renderPaginatedTable()
      this.updateFilterDropdowns()
      this.updateCountCards()
    } catch (err) {
      console.error("⛔ Fetch failed:", err)
      this.setLoadingState(false)
      this.showNotification("Failed to fetch reports.", "error")
      // Set defaults on error
      this.reports = []
      this.pendingCount = 0
      this.approvedCount = 0
      this.declinedCount = 0
      this.filteredReports = []
      this.renderPaginatedTable()
    }
  }

  updateCountCards() {
    // Update the count cards in the UI
    const pendingCard = this.shadowRoot.querySelector('.report-card-section.pending .card-number')
    const approvedCard = this.shadowRoot.querySelector('.report-card-section.approved .card-number')
    const declinedCard = this.shadowRoot.querySelector('.report-card-section.declined .card-number')
    
    if (pendingCard) pendingCard.textContent = this.pendingCount
    if (approvedCard) approvedCard.textContent = this.approvedCount
    if (declinedCard) declinedCard.textContent = this.declinedCount
  }

  async viewReport(reportId) {
    // Open on-review modal with report ID - it will fetch data from manageAccomplishmentReports.php
    try {
      const modal = document.createElement('on-review-accomplishment-report-modal');
      modal.setAttribute('report-id', reportId);
      document.body.appendChild(modal);
    } catch (err) {
      console.error("View error:", err);
      this.showNotification("Failed to open report. Check your internet or server.", "error");
    }
  }

  editReport(reportId) {
    // Department admins cannot edit submitted reports
    this.showNotification("Cannot edit submitted reports. Please contact admin.", "error");
  }

  async deleteReport(reportId) {
    // Department admins cannot delete reports
    this.showNotification("You do not have permission to delete reports.", "error");
  }

  showAddReportModal() {
    const modal = document.createElement('add-accomplishment-report-modal')
    modal.addEventListener('report-saved', () => {
      this.refreshTable()
    })
    modal.addEventListener('refresh-reports-table', () => {
      this.refreshTable()
    })
    document.body.appendChild(modal)
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
      ${type === "success" ? "background: #10b981;" : type === "error" ? "background: #ef4444;" : "background: #3b82f6;"}
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

        .reports-container {
          width: 100%;
        }

        .reports-content-wrapper {
          padding: 30px;
          background: #f8f9fa;
        }

        /* Top Reports Grid for three status cards */
        .top-reports-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr; /* Three columns */
          gap: 20px;
          margin-bottom: 40px;
        }

        .report-card-section {
          background-color: #f8f9fa; /* Light grey background */
          padding: 30px 20px;
          border-radius: 8px;
          border: 1px solid #d97706; /* Orange border */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Card color variants */
        .report-card-section.pending {
          background-color: #fff9e6; /* Light yellow background */
          border-color: #fbbf24; /* Yellow border */
        }

        .report-card-section.approved {
          background-color: #f0fdf4; /* Light green background */
          border-color: #22c55e; /* Green border */
        }

        .report-card-section.declined {
          background-color: #fef2f2; /* Light red background */
          border-color: #ef4444; /* Red border */
        }

        .card-number {
          font-size: 3.5rem;
          font-weight: bold;
          color: #000;
          margin: 0;
          line-height: 1;
          margin-bottom: 15px;
        }

        .card-label {
          font-size: 1.1rem;
          font-weight: 500;
          color: #000;
          margin: 0;
          text-align: center;
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

        .add-report-btn {
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

        .add-report-btn:hover {
          background: #b45309;
        }

            /* Reports Content and Table Styles (reverted to original, with full width adjustments) */
        .reports-content {
          width: 100%;
        }
        .reports-controls {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          align-items: center;
          flex-wrap: wrap;
        }

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

        .reset-filters-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          margin-left: auto;
        }

        .reset-filters-btn:hover {
          background: #b91c1c;
        }

        .refresh-btn {
          background: #059669;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .refresh-btn:hover {
          background: #047857;
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

        /* Removed .reports-table-section-title CSS */

        .reports-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ea580c; /* Original border */
          margin: 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-collapse: collapse;
        }
        .reports-table th,
        .reports-table td {
          padding: 15px;
          text-align: center; /* Original text-align */
          border-bottom: none; /* Original border-bottom */
        }
        .reports-table th {
          background: #A8D5BA; /* Original background */
          border-bottom: 1px solid #ea580c; /* Original border-bottom */
          font-weight: 600;
          color: #333;
          font-size: 20px; /* Original font-size */
        }
        .reports-table td {
          font-size: 17px; /* Original font-size */
          color: #555;
        }
        .reports-table tbody tr:hover {
          background: rgb(206, 236, 250); /* Original hover background */
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
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          color: white;
          text-align: center;
          min-width: 80px;
        }
        .status-badge.status-pending {
          background-color: #fbbf24;
          color: #92400e;
          border: 1px solid #f59e0b;
        }
        .status-badge.status-approved {
          background-color: #22c55e;
          color: white;
          border: 1px solid #16a34a;
        }
        .status-badge.status-declined {
          background-color: #ef4444;
          color: white;
          border: 1px solid #dc2626;
        }

        /* Notification styles (from original code, kept as is) */
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          border-radius: 6px;
          color: white;
          font-weight: 500;
          z-index: 1000;
        }
        .notification.success { background: #10b981; }
        .notification.error { background: #ef4444; }
        .notification.info { background: #3b82f6; }

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

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .top-reports-grid {
            grid-template-columns: 1fr; /* Stack columns on small screens */
          }
          .card-number {
            font-size: 2.5rem;
          }
          .card-label {
            font-size: 1rem;
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
          
          .reports-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            width: 100%;
          }
          
          .search-input {
            width: 100%;
          }

          .add-report-btn {
            width: 100%;
          }
          
          .reports-table th,
          .reports-table td {
            padding: 10px;
            font-size: 0.85rem;
          }
          
          .btn-view {
            padding: 6px 12px;
            font-size: 0.8rem;
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

      <div class="reports-container">
        <div class="reports-content-wrapper">
          <!-- Top Reports Grid for Status Cards -->
          <div class="top-reports-grid">
            <!-- Pending Approval Card -->
            <div class="report-card-section pending">
              <div class="card-number">${this.pendingCount}</div>
              <div class="card-label">Pending Approval</div>
            </div>

            <!-- Approved Reports Card -->
            <div class="report-card-section approved">
              <div class="card-number">${this.approvedCount}</div>
              <div class="card-label">Approved Reports</div>
            </div>

            <!-- Declined Reports Card -->
            <div class="report-card-section declined">
              <div class="card-number">${this.declinedCount}</div>
              <div class="card-label">Declined Reports</div>
            </div>
          </div>

          <!-- Main Content (Reports Table) -->
          <div class="reports-content">
            <!-- Controls Section -->
            <div id="reportsControls" class="reports-controls">
              <div class="search-container">
                <span class="left-icon">🔍</span>
                <input 
                  type="text"
                  id="searchInput"
                  class="search-input"
                  placeholder="Search reports..."
                >
              </div>
              <button id="addReportBtn" class="add-report-btn">Add Report</button>
            </div>

            <!-- Filters Row -->
            <div class="filters-row">
              <div class="filter-group">
                <label class="filter-label">Status:</label>
                <select id="statusFilter" class="filter-select">
                  <option value="">All Status</option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Department:</label>
                <select id="departmentFilter" class="filter-select">
                  <option value="">All Departments</option>
                </select>
              </div>
              <button id="resetFiltersBtn" class="reset-filters-btn">🔄 Reset Filters</button>
              <button id="refreshBtn" class="refresh-btn">🔃 Refresh</button>
            </div>
            
            <!-- Reports Table -->
            <table id="reportsTable" class="reports-table">
              <thead>
                <tr>
                  <th id="thNo">Report No.</th>
                  <th id="thDateSubmitted">Date Submitted</th>
                  <th id="thDateApproved">Date Approved</th>
                  <th id="thDepartment">Department</th>
                  <th id="thTitle">Content Title</th>
                  <th id="thStatus">Status</th>
                  <th id="thAction">Action</th>
                </tr>
              </thead>
              <tbody id="reportsTableBody">
                <tr>
                  <td colspan="7" style="text-align: center; padding: 40px;">
                    <div class="loading-container">
                      <div class="loading-spinner"></div>
                      <div class="loading-text">Loading reports...</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Pagination -->
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
        </div>
      </div>
    `
  }
}

customElements.define("createaccomplishment-reports", AccomplishmentReports)
