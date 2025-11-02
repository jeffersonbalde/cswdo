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
    this.totalCount = 0
  }

  connectedCallback() {
    this.render()
    this.setupEventListeners()
    this.fetchAndRenderReports()
  }

  setupEventListeners() {
    const editHeaderBtn = this.shadowRoot.querySelector("#editHeaderBtn")
    const searchInput = this.shadowRoot.querySelector("#searchInput")
    const statusFilter = this.shadowRoot.querySelector("#statusFilter")
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter")
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn")
    const refreshBtn = this.shadowRoot.querySelector("#refreshBtn")
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect")

    // Edit header button
    if (editHeaderBtn) {
      editHeaderBtn.addEventListener("click", () => this.editHeaderContent())
    }

    // Search functionality with improved debounce
    if (searchInput) {
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
    }

    // Filter functionality
    if (statusFilter) {
      statusFilter.addEventListener("change", (e) => {
        this.filters.status = e.target.value
        this.applyFilters()
      })
    }

    if (departmentFilter) {
      departmentFilter.addEventListener("change", (e) => {
        this.filters.department = e.target.value
        this.applyFilters()
      })
    }

    // Reset filters
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", () => {
        this.resetFilters()
      })
    }

    // Refresh button
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.refreshTable()
      })
    }

    // Rows per page
    if (rowsPerPageSelect) {
      rowsPerPageSelect.addEventListener("change", (e) => {
        this.rowsPerPage = parseInt(e.target.value)
        this.currentPage = 1
        this.renderPaginatedTable()
      })
    }

    // Event delegation for action buttons and pagination
    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-view")) {
        const reportId = e.target.dataset.reportId
        this.viewReport(reportId)
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
    
    if (loading && tableBody) {
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
    
    if (filtering && tableBody) {
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
        (report.department && report.department.toLowerCase().includes(this.filters.search)) ||
        (report.uploadDate && report.uploadDate.toLowerCase().includes(this.filters.search))
      
      // Status filter
      const matchesStatus = !this.filters.status || 
        (report.status && report.status === this.filters.status)
      
      // Department filter
      const matchesDepartment = !this.filters.department || 
        (report.department && report.department === this.filters.department)

      const matches = matchesSearch && matchesStatus && matchesDepartment
      
      return matches
    })

    console.log(`Filtered ${this.filteredReports.length} reports from ${this.reports.length} total`)

    // Add visual feedback for selected filters
    const statusFilter = this.shadowRoot.querySelector("#statusFilter")
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter")
    
    if (statusFilter) {
      if (this.filters.status) {
        statusFilter.classList.add('has-selection')
      } else {
        statusFilter.classList.remove('has-selection')
      }
    }
    
    if (departmentFilter) {
      if (this.filters.department) {
        departmentFilter.classList.add('has-selection')
      } else {
        departmentFilter.classList.remove('has-selection')
      }
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
    
    const searchInput = this.shadowRoot.querySelector("#searchInput")
    const statusFilter = this.shadowRoot.querySelector("#statusFilter")
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter")
    
    if (searchInput) searchInput.value = ''
    if (statusFilter) statusFilter.value = ''
    if (departmentFilter) departmentFilter.value = ''
    
    // Remove visual feedback classes
    if (statusFilter) statusFilter.classList.remove('has-selection')
    if (departmentFilter) departmentFilter.classList.remove('has-selection')
    
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
    
    if (!statusFilter || !departmentFilter) return
    
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
    
    if (!tableBody) return
    
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
        <td style="text-align: center; font-weight: 600;">${report.id || report.reportId || report.featuresId || rowNumber}</td>
        <td style="text-align: center;">${report.uploadDate || report.dateSubmitted || 'N/A'}</td>
        <td style="text-align: center;">${dateApprovedDisplay}</td>
        <td style="text-align: center;">${report.department || 'N/A'}</td>
        <td style="text-align: left; font-weight: 500;">${report.title || report.contentTitle || 'N/A'}</td>
        <td style="text-align: center;">${statusDisplay}</td>
        <td style="text-align: center;">
          <button class="btn-view" data-report-id="${report.id || report.reportId || report.featuresId}">👁 View</button>
        </td>
      `
      tableBody.appendChild(row)
    })
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredReports.length / this.rowsPerPage)
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer")
    
    if (!paginationContainer) return
    
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
        this.totalCount = result.counts?.total || this.reports.length
      } else {
        this.reports = []
        this.pendingCount = 0
        this.approvedCount = 0
        this.declinedCount = 0
        this.totalCount = 0
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
    }
  }

  updateCountCards() {
    // Update all count cards in the UI - ready for database binding
    const pendingCountCard = this.shadowRoot.getElementById('pendingCountCard')
    const totalCountCard = this.shadowRoot.getElementById('totalCountCard')
    const approvedCountCard = this.shadowRoot.getElementById('approvedCountCard')
    const declinedCountCard = this.shadowRoot.getElementById('declinedCountCard')
    
    if (pendingCountCard) pendingCountCard.textContent = this.pendingCount
    if (totalCountCard) totalCountCard.textContent = this.totalCount
    if (approvedCountCard) approvedCountCard.textContent = this.approvedCount
    if (declinedCountCard) declinedCountCard.textContent = this.declinedCount
  }

  viewPendingReports() {
    this.showNotification("Opening pending reports for review", "info")
    // TODO: Implement filter to show only pending reports
    this.filters.status = 'Pending'
    this.applyFilters()
  }

  editHeaderContent() {
    console.log("Edit header content")
    this.showNotification("Header edit functionality", "info")
  }

  viewReport(reportId) {
    // Find the report in the reports array to check its status
    const report = this.reports.find(r => 
      (r.id && r.id.toString() === reportId.toString()) || 
      (r.reportId && r.reportId.toString() === reportId.toString()) ||
      (r.featuresId && r.featuresId.toString() === reportId.toString())
    );
    
    const status = report?.status || 'Pending';
    
    // Check if report is already reviewed (Approved or Declined)
    if (status === 'Approved' || status === 'Declined') {
      // Open done-review modal (read-only view) for completed reviews
      const modal = document.createElement('done-review-accomplishment-report-modal');
      modal.setAttribute('report-id', reportId);
      document.body.appendChild(modal);
    } else {
      // Open review modal for pending reports (can be reviewed/edited)
      const modal = document.createElement('review-accomplishment-report-modal');
      modal.setAttribute('report-id', reportId);
      modal.addEventListener('review-saved', () => {
        this.refreshTable();
      });
      modal.addEventListener('refresh-reports-table', () => {
        this.refreshTable();
      });
      document.body.appendChild(modal);
    }
  }

  showAddReportModal() {
    // TODO: Implement add report modal
    this.showNotification("Add report functionality", "info")
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
                      
        .reports-header {
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
        .reports-header-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .reports-header-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
          z-index: 2;
        }
        .reports-header-content {
          position: relative;
          z-index: 3;
          padding: 20px;
        }
        .reports-title {
          font-size: 3rem;
          font-weight: bold;
          letter-spacing: 2px;
        }
        .reports-description {
          max-width: 600px;
          font-size: 14px;
          line-height: 1.6;
        }

        /* Approval section styles */
        .approval-section {
          padding: 10px;
          background: #f8f9fa;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 10px;
        }

        .stat-card {
          background-color: #f8f9fa;
          padding: 30px 20px;
          border-radius: 8px;
          border: 2px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Card color variants */
        .stat-card.pending {
          background-color: #fff9e6;
          border-color: #fbbf24;
        }

        .stat-card.total {
          background-color: #fff7ed;
          border-color: #d97706;
        }

        .stat-card.approved {
          background-color: #f0fdf4;
          border-color: #22c55e;
        }

        .stat-card.declined {
          background-color: #fef2f2;
          border-color: #ef4444;
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
                   
        .reports-content {
          padding: 0px 20px;
          max-width: 100%;
          margin: 0 auto;
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
        .add-reports-btn {
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
        .add-reports-btn:hover {
          background: #b45309;
        }
        .reports-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ea580c;
          margin: 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-collapse: collapse;
        }
        .reports-table th,
        .reports-table td {
          padding: 15px;
          text-align: center;
          border-bottom: none;
        }
        .reports-table th {
          background: #A8D5BA;
          border-bottom: 1px solid #ea580c;
          font-weight: 600;
          color: #333;
          font-size: 20px;
        }
        .reports-table td {
          font-size: 17px;
          color: #555;
        }
              
        .reports-table tbody tr:hover {
          background: rgb(206, 236, 250);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
                                
        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 2px solid transparent;
          transition: transform 0.2s ease;
        }
                                
        .stat-card:hover {
          transform: translateY(-2px);
        }
                                
        .stat-card.services { 
          border-color: #f59e0b; 
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

        @media (max-width: 768px) {
          .reports-controls {
            flex-direction: column;
            align-items: stretch;
          }
                    
          .reports-title {
            font-size: 2rem;
          }
                    
          .reports-content {
            padding: 20px;
          }

          .approval-section {
            padding: 20px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 15px;
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
                    
          .reports-table {
            font-size: 12px;
          }
                    
          .reports-table th,
          .reports-table td {
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
      
      <div class="reports-container">
        <!-- Header Section -->
        <div id="reportsHeader" class="reports-header">
          <!-- Background Image -->
          <img id="reportsHeaderImage" src="./imgs/home_bckgrnd.png" alt="Services Background" class="reports-header-image">
                    
          <!-- Dark Overlay -->
          <div id="reportsHeaderOverlay" class="reports-header-overlay"></div>
                    
          <!-- Edit Button -->
          <button id="editHeaderBtn" class="btn btn-warning btn-sm edit-header-btn">✍🏻 Edit</button>
                    
          <!-- Header Content -->
          <div id="reportsHeaderContent" class="reports-header-content">
            <h1 id="reportsTitle" class="reports-title mb-4">Featured Stories</h1>
            <p id="reportsDescription" class="reports-description mb-0">
              The City Social Welfare and Development Office in Pagadian City is mandated to provide social protective and social development services to poor, vulnerable and disadvantaged individuals, families, groups and communities.
            </p>
          </div>
        </div>

        <!-- Stats Cards Section -->
        <div class="approval-section">
          <div class="stats-grid">
            <!-- Pending Approval Card -->
            <div class="stat-card pending">
              <div class="card-number" id="pendingCountCard">${this.pendingCount}</div>
              <div class="card-label">Pending Approval</div>
            </div>

            <!-- Total Reports Card -->
            <div class="stat-card total">
              <div class="card-number" id="totalCountCard">${this.totalCount}</div>
              <div class="card-label">Total Reports</div>
            </div>

            <!-- Approved Reports Card -->
            <div class="stat-card approved">
              <div class="card-number" id="approvedCountCard">${this.approvedCount}</div>
              <div class="card-label">Approved</div>
            </div>

            <!-- Declined Reports Card -->
            <div class="stat-card declined">
              <div class="card-number" id="declinedCountCard">${this.declinedCount}</div>
              <div class="card-label">Declined</div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
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
                <th id="thNo">Features ID</th>
                <th id="thUploadDate">Upload Date</th>
                <th id="thDateApproved">Date Approved</th>
                <th id="thDepartment">Department</th>
                <th id="thTitle">Title</th>
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
    `
  }
}

customElements.define("accomplishment-reports", AccomplishmentReports)
