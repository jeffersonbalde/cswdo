class ManageAdvisories extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.advisories = [];
    this.filteredAdvisories = [];
    this.isLoading = false;
    this.isFiltering = false;
    this.currentPage = 1;
    this.rowsPerPage = 10;
    this.filters = {
      uploadDate: '',
      search: ''
    };
    this.searchTimeout = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.fetchAndRenderAdvisories();
  }

  setupEventListeners() {
    const addBtn = this.shadowRoot.querySelector("#addAdvisoryBtn");
    const searchInput = this.shadowRoot.querySelector("#searchInput");
    const dateRangeFilter = this.shadowRoot.querySelector("#dateRangeFilter");
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn");
    const refreshBtn = this.shadowRoot.querySelector("#refreshBtn");
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect");

    addBtn.addEventListener("click", () => this.showAddAdvisoryModal());
    
    // Search functionality with improved debounce
    searchInput.addEventListener("input", (e) => {
      const searchValue = e.target.value.trim();
      console.log("Search input:", searchValue); // Debug log
      
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      // Set new timeout
      this.searchTimeout = setTimeout(() => {
        console.log("Applying search filter:", searchValue); // Debug log
        this.filters.search = searchValue.toLowerCase();
        this.applyFilters();
      }, 300);
    });

    // Also handle immediate search on Enter key
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
        }
        const searchValue = e.target.value.trim();
        console.log("Enter key search:", searchValue); // Debug log
        this.filters.search = searchValue.toLowerCase();
        this.applyFilters();
      }
    });

    dateRangeFilter.addEventListener("change", (e) => {
      this.filters.uploadDate = e.target.value;
      this.applyFilters();
    });

    resetFiltersBtn.addEventListener("click", () => this.resetFilters());
    refreshBtn.addEventListener("click", () => this.refreshTable());

    // Rows per page
    rowsPerPageSelect.addEventListener("change", (e) => {
      this.rowsPerPage = parseInt(e.target.value);
      this.currentPage = 1;
      this.renderPaginatedTable();
    });

    // Event delegation for action buttons and pagination
    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-view")) {
        const advisoryId = e.target.dataset.advisoryId;
        this.editAdvisory(advisoryId);
      } else if (e.target.classList.contains("page-btn")) {
        const page = parseInt(e.target.dataset.page);
        this.goToPage(page);
      } else if (e.target.classList.contains("prev-btn")) {
        this.goToPage(this.currentPage - 1);
      } else if (e.target.classList.contains("next-btn")) {
        this.goToPage(this.currentPage + 1);
      }
    });

    // Listen for refresh events from modals
    document.addEventListener("refresh-advisories-table", () => {
      console.log("Refresh event received from modal");
      this.refreshTable();
    });
  }

  setLoadingState(loading, message = "Loading advisories...") {
    this.isLoading = loading;
    const tableBody = this.shadowRoot.getElementById("advisoriesTableBody");
    
    if (loading) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 40px;">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <div class="loading-text">${message}</div>
            </div>
          </td>
        </tr>
      `;
    }
  }

  setFilteringState(filtering) {
    this.isFiltering = filtering;
    const tableBody = this.shadowRoot.getElementById("advisoriesTableBody");
    
    if (filtering) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 40px;">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <div class="loading-text">Applying filters...</div>
            </div>
          </td>
        </tr>
      `;
    }
  }

  async applyFilters() {
    console.log("Applying filters with:", this.filters); // Debug log
    
    // Show filtering state only if we have a significant operation
    if (this.advisories.length > 100) {
      this.setFilteringState(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.filteredAdvisories = this.advisories.filter(advisory => {
      // Search filter - check multiple fields
      const matchesSearch = !this.filters.search || 
        (advisory.advisoryTitle && advisory.advisoryTitle.toLowerCase().includes(this.filters.search)) ||
        (advisory.advisoryDescription && advisory.advisoryDescription.toLowerCase().includes(this.filters.search)) ||
        (advisory.advisoryId && advisory.advisoryId.toString().toLowerCase().includes(this.filters.search));
      
      // Upload Date filter - match against date-only string (YYYY-MM-DD)
      const matchesUploadDate = !this.filters.uploadDate || 
        (advisory.uploadDate && (() => {
          const advisoryDate = new Date(advisory.uploadDate);
          if (isNaN(advisoryDate.getTime())) return false;
          const advisoryDateOnly = advisoryDate.toISOString().split('T')[0];
          return advisoryDateOnly === this.filters.uploadDate;
        })());

      const matches = matchesSearch && matchesUploadDate;
      
      // Debug log for first few items
      if (this.advisories.indexOf(advisory) < 3) {
        console.log(`Advisory ${advisory.advisoryId}:`, {
          matchesSearch,
          matchesUploadDate,
          matches,
          searchTerm: this.filters.search,
          advisoryTitle: advisory.advisoryTitle
        });
      }
      
      return matches;
    });

    console.log(`Filtered ${this.filteredAdvisories.length} advisories from ${this.advisories.length} total`); // Debug log

    // Add visual feedback for selected filters (font weight only)
    const dateRangeFilter = this.shadowRoot.querySelector("#dateRangeFilter");
    
    if (this.filters.uploadDate) {
      dateRangeFilter.classList.add('has-selection');
    } else {
      dateRangeFilter.classList.remove('has-selection');
    }

    this.currentPage = 1;
    this.setFilteringState(false);
    this.renderPaginatedTable();
    this.updateFilterDropdowns();
  }

  // updateFilterDropdowns() {
  //   const dateRangeFilter = this.shadowRoot.querySelector("#dateRangeFilter");
    
  //   // Store current selections
  //   const currentUploadDate = dateRangeFilter.value;
    
  //   // Get unique upload dates
  //   const uploadDates = [...new Set(this.advisories.map(a => a.uploadDate))].filter(Boolean).sort();
    
  //   // Update upload date dropdown
  //   dateRangeFilter.innerHTML = '<option value="">All Upload Dates</option>';
  //   uploadDates.forEach(date => {
  //     const selected = date === currentUploadDate ? 'selected' : '';
  //     dateRangeFilter.innerHTML += `<option value="${date}" ${selected}>${date}</option>`;
  //   });
    
  //   // Restore visual feedback
  //   if (currentUploadDate) {
  //     dateRangeFilter.classList.add('has-selection');
  //   }
  // }


  updateFilterDropdowns() {
    const dateRangeFilter = this.shadowRoot.querySelector("#dateRangeFilter");
    
    // Store current selection
    const currentDate = dateRangeFilter.value;
    
    // Get unique dates by creating a date-only string (YYYY-MM-DD) for filtering
    const uniqueDates = new Set();
    const dateMap = new Map(); // Map formatted date to date-only string for filtering
    
    this.advisories.forEach(advisory => {
      if (advisory.uploadDate) {
        const date = new Date(advisory.uploadDate);
        if (!isNaN(date.getTime())) {
          const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          // Create a date-only string for filtering (YYYY-MM-DD)
          const dateOnly = date.toISOString().split('T')[0];
          
          uniqueDates.add(formattedDate);
          // Store the date-only string for filtering
          if (!dateMap.has(formattedDate)) {
            dateMap.set(formattedDate, dateOnly);
          }
        }
      }
    });
    
    // Convert to sorted array
    const sortedDates = Array.from(uniqueDates).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB - dateA; // Sort newest first
    });
    
    // Update upload date dropdown - use date-only string as value, formatted date as display
    dateRangeFilter.innerHTML = '<option value="">All Dates</option>';
    sortedDates.forEach(formattedDate => {
      const dateOnly = dateMap.get(formattedDate);
      const selected = dateOnly === currentDate ? 'selected' : '';
      dateRangeFilter.innerHTML += `<option value="${dateOnly}" ${selected}>${formattedDate}</option>`;
    });
    
    // Restore visual feedback
    if (currentDate) {
      dateRangeFilter.classList.add('has-selection');
    }
  }






  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  async resetFilters() {
    // Clear search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Show filtering state
    this.setFilteringState(true);
    
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 150));
    
    this.filters = { uploadDate: '', search: '' };
    
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#dateRangeFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#dateRangeFilter").classList.remove('has-selection');
    
    this.filteredAdvisories = [...this.advisories];
    this.currentPage = 1;
    this.setFilteringState(false);
    this.renderPaginatedTable();
  }

  refreshTable() {
    console.log("Refreshing table data...");
    this.fetchAndRenderAdvisories();
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredAdvisories.length / this.rowsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderPaginatedTable();
    }
  }

  renderPaginatedTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const paginatedAdvisories = this.filteredAdvisories.slice(startIndex, endIndex);
    
    this.renderAdvisoriesToTable(paginatedAdvisories);
    this.renderPagination();
  }

  renderAdvisoriesToTable(advisories) {
    const tableBody = this.shadowRoot.getElementById("advisoriesTableBody");
    
    // Don't clear if we're in a loading state
    if (this.isLoading || this.isFiltering) {
      return;
    }
    
    tableBody.innerHTML = "";
    
    if (advisories.length === 0) {
      // Check if we have any active filters
              const hasActiveFilters = this.filters.search || this.filters.uploadDate;
      
      if (hasActiveFilters) {
        // No results found with filters applied
        tableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">No Results Found</div>
                <div class="no-results-message">
                  No advisories match your current filter criteria.<br>
                  Search term: "${this.filters.search || 'None'}"<br>
                  Try adjusting your filters or search terms.
                </div>
              </div>
            </td>
          </tr>
        `;
      } else {
        // No data at all
        tableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">📋</div>
                <div class="no-results-title">No Advisories Available</div>
                <div class="no-results-message">
                  There are currently no advisories to display.
                </div>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    advisories.forEach((advisory, index) => {
      const row = document.createElement("tr");
      
      let formattedDate = 'N/A';
      if (advisory.uploadDate) {
        const uploadDate = new Date(advisory.uploadDate);
        if (!isNaN(uploadDate.getTime())) {
          formattedDate = uploadDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      }
      
      row.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${startIndex + index + 1}</td>
        <td style="text-align: left; font-weight: 500;">${advisory.advisoryTitle || 'N/A'}</td>
        <td style="text-align: center;">${formattedDate}</td>
        <td style="text-align: center;">
          <button class="btn-view" data-advisory-id="${advisory.advisoryId}">👁 View</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredAdvisories.length / this.rowsPerPage);
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer");
    
    let paginationHTML = `
      <div class="pagination-info">
        ${this.getResultsInfo()}
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
    `;

    if (this.filteredAdvisories.length === 0) {
      // Show "1-0 of 0" with disabled page 1
      paginationHTML += `
        <button class="pagination-btn page-btn active" disabled>1</button>
        <button class="pagination-btn next-btn" disabled>›</button>
      `;
    } else if (totalPages > 1) {
      // Multiple pages logic (existing)
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
          paginationHTML += `
            <button class="pagination-btn page-btn ${i === this.currentPage ? 'active' : ''}" 
                    data-page="${i}">${i}</button>
          `;
        } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
          paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
      }
      
      paginationHTML += `
          <button class="pagination-btn next-btn" ${this.currentPage === totalPages ? 'disabled' : ''}>›</button>
      `;
    } else {
      // Single page with data
      paginationHTML += `
        <button class="pagination-btn page-btn" disabled>1</button>
        <button class="pagination-btn next-btn" disabled>›</button>
      `;
    }

    paginationHTML += `</div>`;
    paginationContainer.innerHTML = paginationHTML;
  }

  getResultsInfo() {
    if (this.filteredAdvisories.length === 0) {
      return "1-0 of 0";
    }
    
    const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredAdvisories.length);
    const total = this.filteredAdvisories.length;
    
    return `${startIndex}-${endIndex} of ${total}`;
  }

  async fetchAndRenderAdvisories() {
    this.setLoadingState(true, "Loading advisories...");
    
    try {
      const res = await fetch("./php_folder/manageAdvisories.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetchdata" }),
      });
      
      const text = await res.text();
      console.log("🪵 Raw response from PHP:", text);
      
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("⛔ Invalid JSON from server:", text);
        this.showNotification("Server returned invalid response.", "error");
        this.setLoadingState(false);
        return;
      }
      
      if (result.success && Array.isArray(result.advisories)) {
        // Sort advisories by date in descending order (newest first)
        this.advisories = result.advisories.sort((a, b) => 
          new Date(b.uploadDate) - new Date(a.uploadDate)
        );
        
        console.log("Loaded advisories:", this.advisories.length); // Debug log
        
        this.filteredAdvisories = [...this.advisories];
        this.setLoadingState(false);
        this.renderPaginatedTable();
        this.updateFilterDropdowns();
      } else {
        this.setLoadingState(false);
        // Handle case where server returns no data
        this.advisories = [];
        this.filteredAdvisories = [];
        this.renderPaginatedTable();
        this.showNotification("No advisories found or failed to load.", "info");
      }
    } catch (err) {
      console.error("⛔ Fetch failed:", err);
      this.setLoadingState(false);
      this.showNotification("Failed to fetch advisories.", "error");
    }
  }

  addNewAdvisory(advisory) {
    // Add the new advisory to the beginning of the array
    this.advisories.unshift(advisory);
    
    // Reset filters to show all advisories including the new one
    this.filters = {
      uploadDate: '',
      search: ''
    };
    
    // Clear filter inputs
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#dateRangeFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#dateRangeFilter").classList.remove('has-selection');
    
    this.filteredAdvisories = [...this.advisories];
    this.currentPage = 1;
    this.renderPaginatedTable();
    this.updateFilterDropdowns();
    
    // Show success notification
    this.showNotification("Advisory added successfully!", "success");
  }

  showAddAdvisoryModal() {
    const modal = document.createElement("add-advisories-modal");
    modal.addEventListener("advisory-saved", (e) => {
      this.addNewAdvisory(e.detail.advisory);
    });
    document.body.appendChild(modal);
  }

  // editAdvisory(advisoryId) {
  //   // Placeholder for edit functionality
  //   alert(`Edit advisory with ID: ${advisoryId}`);
  // }



  editAdvisory(advisoryId) {
    const modal = document.createElement("view-advisories-modal");
    modal.addEventListener("advisory-updated", (e) => {
      console.log('Advisory-updated event received in manage-advisories.js:', e.detail);
      this.updateAdvisory(e.detail.advisory);
    });
    modal.addEventListener("refresh-advisories-table", () => {
      console.log('Refresh advisories table event received');
      this.loadAdvisories();
    });
    document.body.appendChild(modal);
    modal.setAdvisoryId(advisoryId);
  }

  updateAdvisory(updatedAdvisory) {
    // Find and update the existing advisory
    const index = this.advisories.findIndex(a => a.advisoryId === updatedAdvisory.advisoryId);
    if (index !== -1) {
      this.advisories[index] = { ...this.advisories[index], ...updatedAdvisory };
      
      // Update filtered array as well
      const filteredIndex = this.filteredAdvisories.findIndex(a => a.advisoryId === updatedAdvisory.advisoryId);
      if (filteredIndex !== -1) {
        this.filteredAdvisories[filteredIndex] = { ...this.filteredAdvisories[filteredIndex], ...updatedAdvisory };
      }
      
      // Re-render the table
      this.renderAdvisoriesTable();
      
      // Show success notification
      this.showNotification("Advisory updated successfully!", "success");
    }
  }

  showNotification(message, type) {
    // Implement your notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
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
        
        .advisories-content {
          padding: 30px;
          padding-top: 20px;
        }
        
        .advisories-controls {
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
        
        .add-advisory-btn {
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
        
        .add-advisory-btn:hover {
          background: #b45309;
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
        
        .advisories-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ea580c;
          margin: 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-collapse: collapse;
        }
        
        .advisories-table th,
        .advisories-table td {
          padding: 15px;
          text-align: center;
          border-bottom: none;
        }
        
        .advisories-table th {
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
        
        .advisories-table th:first-child {
          border-top-left-radius: 8px;
        }
        
        .advisories-table th:last-child {
          border-top-right-radius: 8px;
        }
        
        .advisories-table td {
          font-size: 16px;
          color: #374151;
          padding: 16px 15px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
        }
        
        .advisories-table tbody tr {
          transition: background-color 0.2s ease;
        }
              
        .advisories-table tbody tr:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .advisories-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .btn-view {
          padding: 6px 15px;
          border: 1px solid black;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
          font-size: 15px;
          font-weight: 500;
          background: #d97706;
          color: white;
        }
        
        .btn-view:hover {
          background: #A8D5BA;
          color: white;
          border: none;
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
        
        @media (max-width: 768px) {
          .advisories-controls {
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
                    
          .advisories-content {
            padding: 20px;
          }
                    
          .advisories-table {
            font-size: 12px;
          }
                    
          .advisories-table th,
          .advisories-table td {
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
      
      <div class="advisories-container">
        <!-- Main Content -->
        <div class="advisories-content">
          <!-- Controls Section -->
          <div class="advisories-controls">
            <div class="search-container">
              <span class="left-icon">🔍</span>
              <input 
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Search advisories..."
              >
            </div>
            <button id="addAdvisoryBtn" class="add-advisory-btn">Add Advisory</button>
          </div>

          <!-- Filters Row -->
          <div class="filters-row">
            <div class="filter-group">
              <label class="filter-label">Date Upload:</label>
              <select id="dateRangeFilter" class="filter-select">
                <option value="">All Dates</option>
              </select>
            </div>
            <button id="resetFiltersBtn" class="reset-filters-btn">🔄 Reset Filters</button>
            <button id="refreshBtn" class="refresh-btn">🔃 Refresh</button>
          </div>
          
          <!-- Advisories Table -->
          <table class="advisories-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Title</th>
                <th>Date Upload</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="advisoriesTableBody">
              <tr><td colspan="4" style="text-align: center; padding: 40px;">Loading advisories...</td></tr>
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
    `;
  }
}

customElements.define("manage-advisories", ManageAdvisories);