class NewsUpdates extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.newsupdates = [];
    this.filteredNewsupdates = [];
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
    this.fetchAndRenderNewsupdates();
  }

  setupEventListeners() {
    const addBtn = this.shadowRoot.querySelector("#addnewsUpdateBtn");
    const searchInput = this.shadowRoot.querySelector("#searchInput");
    const editHeaderBtn = this.shadowRoot.querySelector("#editHeaderBtn");
    const uploadYearFilter = this.shadowRoot.querySelector("#uploadYearFilter");
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn");
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect");

    addBtn.addEventListener("click", () => this.showAddServiceModal());
    editHeaderBtn.addEventListener("click", () => this.editHeaderContent());
    
    // Search functionality with improved debounce
    searchInput.addEventListener("input", (e) => {
      const searchValue = e.target.value.trim();
      console.log("Search input:", searchValue);
      
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      // Set new timeout
      this.searchTimeout = setTimeout(() => {
        console.log("Applying search filter:", searchValue);
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
        console.log("Enter key search:", searchValue);
        this.filters.search = searchValue.toLowerCase();
        this.applyFilters();
      }
    });

    // Filter functionality
    uploadYearFilter.addEventListener("change", (e) => {
      this.filters.uploadDate = e.target.value;
      this.applyFilters();
    });

    // Reset filters
    resetFiltersBtn.addEventListener("click", () => {
      this.resetFilters();
    });

    // Add refresh button event listener
    const refreshBtn = this.shadowRoot.querySelector("#refreshBtn");
    refreshBtn.addEventListener("click", () => {
      this.refreshTable();
    });

    // Rows per page
    rowsPerPageSelect.addEventListener("change", (e) => {
      this.rowsPerPage = parseInt(e.target.value);
      this.currentPage = 1;
      this.renderPaginatedTable();
    });

    // Event delegation for action buttons and pagination
    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-view")) {
        const newsupdateId = e.target.dataset.newsupdateId;
        this.viewNewsupdate(newsupdateId);
      } else if (e.target.classList.contains("btn-edit")) {
        const newsupdateId = e.target.dataset.newsupdateId;
        this.editNewsupdate(newsupdateId);
      } else if (e.target.classList.contains("btn-delete")) {
        const newsupdateId = e.target.dataset.newsupdateId;
        this.deleteNewsupdate(newsupdateId);
      } else if (e.target.classList.contains("newsupdate-image")) {
        // Show image in larger view
        this.showImageModal(e.target.src, e.target.alt);
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
    document.addEventListener("refresh-newsupdate-table", () => {
      console.log("Refresh event received from modal");
      this.refreshTable();
    });
  }

  setLoadingState(loading, message = "Loading news and updates...") {
    this.isLoading = loading;
    const tableBody = this.shadowRoot.getElementById("newsUpdateTableBody");
    
    if (loading) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px;">
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
    const tableBody = this.shadowRoot.getElementById("newsUpdateTableBody");
    
    if (filtering) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px;">
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
    console.log("Applying filters with:", this.filters);
    
    // Show filtering state only if we have a significant operation
    if (this.newsupdates.length > 100) {
      this.setFilteringState(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.filteredNewsupdates = this.newsupdates.filter(newsupdate => {
      // Search filter - check multiple fields
      const matchesSearch = !this.filters.search || 
        (newsupdate.newsupdateTitle && newsupdate.newsupdateTitle.toLowerCase().includes(this.filters.search)) ||
        (newsupdate.newsupdateDescription && newsupdate.newsupdateDescription.toLowerCase().includes(this.filters.search)) ||
        (newsupdate.newsupdateId && newsupdate.newsupdateId.toString().toLowerCase().includes(this.filters.search));
      
      // Upload Date filter
      const matchesDate = !this.filters.uploadDate || 
        (newsupdate.uploadDate && newsupdate.uploadDate.includes(this.filters.uploadDate));

      const matches = matchesSearch && matchesDate;
      
      // Debug log for first few items
      if (this.newsupdates.indexOf(newsupdate) < 3) {
        console.log(`Newsupdate ${newsupdate.newsupdateId}:`, {
          matchesSearch,
          matchesDate,
          matches,
          searchTerm: this.filters.search,
          newsupdateTitle: newsupdate.newsupdateTitle
        });
      }
      
      return matches;
    });

    console.log(`Filtered ${this.filteredNewsupdates.length} newsupdates from ${this.newsupdates.length} total`);

    // Add visual feedback for selected filters
    const uploadYearFilter = this.shadowRoot.querySelector("#uploadYearFilter");
    
    if (this.filters.uploadDate) {
      uploadYearFilter.classList.add('has-selection');
    } else {
      uploadYearFilter.classList.remove('has-selection');
    }

    this.currentPage = 1;
    this.setFilteringState(false);
    this.renderPaginatedTable();
    this.updateFilterDropdowns();
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
    
    this.filters = {
      uploadDate: '',
      search: ''
    };
    
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#uploadYearFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#uploadYearFilter").classList.remove('has-selection');
    
    this.filteredNewsupdates = [...this.newsupdates];
    this.currentPage = 1;
    this.setFilteringState(false);
    this.renderPaginatedTable();
  }

  refreshTable() {
    console.log("Refreshing table data...");
    this.fetchAndRenderNewsupdates();
  }



  updateFilterDropdowns() {
    const uploadYearFilter = this.shadowRoot.querySelector("#uploadYearFilter");
    
    // Store current selection
    const currentDate = uploadYearFilter.value;
    
    // Get unique upload dates and format them
    const dates = [...new Set(this.newsupdates.map(n => n.uploadDate))].filter(Boolean).sort();
    
    // Helper function to format date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    // Update upload date dropdown
    uploadYearFilter.innerHTML = '<option value="">All Dates</option>';
    dates.forEach(date => {
      const selected = date === currentDate ? 'selected' : '';
      const formattedDate = formatDate(date);
      uploadYearFilter.innerHTML += `<option value="${date}" ${selected}>${formattedDate}</option>`;
    });
    
    // Restore visual feedback
    if (currentDate) {
      uploadYearFilter.classList.add('has-selection');
    }
  }




  goToPage(page) {
    const totalPages = Math.ceil(this.filteredNewsupdates.length / this.rowsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderPaginatedTable();
    }
  }

  renderPaginatedTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const paginatedNewsupdates = this.filteredNewsupdates.slice(startIndex, endIndex);
    
    this.renderNewsupdatesToTable(paginatedNewsupdates);
    this.renderPagination();
  }

  renderNewsupdatesToTable(newsupdates) {
    const tableBody = this.shadowRoot.getElementById("newsUpdateTableBody");
    
    // Don't clear if we're in a loading state
    if (this.isLoading || this.isFiltering) {
      return;
    }
    
    tableBody.innerHTML = "";
    
    if (newsupdates.length === 0) {
      // Check if we have any active filters
      const hasActiveFilters = this.filters.search || this.filters.uploadDate;
      
      if (hasActiveFilters) {
        // No results found with filters applied
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">No Results Found</div>
                <div class="no-results-message">
                  No news and updates match your current filter criteria.<br>
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
            <td colspan="5" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">📋</div>
                <div class="no-results-title">No News and Updates Available</div>
                <div class="no-results-message">
                  There are currently no news and updates to display.
                </div>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    newsupdates.forEach((newsupdate, index) => {
      const row = document.createElement("tr");
      
      // Debug: Log the newsupdate data
      console.log(`Newsupdate ${newsupdate.newsupdateId}:`, {
        title: newsupdate.newsupdateTitle,
        imagePath: newsupdate.newsupdatePicPath,
        hasImage: !!(newsupdate.newsupdatePicPath && newsupdate.newsupdatePicPath.trim() !== '')
      });
      
      // Create image element with proper error handling
      let imageHtml;
      if (newsupdate.newsupdatePicPath && newsupdate.newsupdatePicPath.trim() !== '') {
        imageHtml = `<img src="${newsupdate.newsupdatePicPath}" alt="Newsupdate Image" class="newsupdate-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'; console.log('Image failed to load:', '${newsupdate.newsupdatePicPath}');">
                     <span class="no-image" style="display: none;">No Image</span>`;
      } else {
        imageHtml = '<span class="no-image">No Image</span>';
      }
      
      // Format the date
      let formattedDate = 'N/A';
      if (newsupdate.uploadDate) {
        const date = new Date(newsupdate.uploadDate);
        const months = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
        formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      }
      
      row.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${startIndex + index + 1}</td>
        <td style="text-align: center; vertical-align: middle;">${imageHtml}</td>
        <td style="text-align: left; font-weight: 500;">${newsupdate.newsupdateTitle || 'N/A'}</td>
        <td style="text-align: center;">${formattedDate}</td>
        <td style="text-align: center;">
          <button class="btn-view" data-newsupdate-id="${newsupdate.newsupdateId}">👁 View</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredNewsupdates.length / this.rowsPerPage);
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer");
    
    let paginationHTML = `
      <div class="pagination-info">
        ${this.getResultsInfo()}
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
    `;

    if (this.filteredNewsupdates.length === 0) {
      // Show "1-0 of 0" with disabled page 1
      paginationHTML += `
        <button class="pagination-btn page-btn active" disabled>1</button>
        <button class="pagination-btn next-btn" disabled>›</button>
      `;
    } else if (totalPages > 1) {
      // Multiple pages logic
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
    if (this.filteredNewsupdates.length === 0) {
      return "1-0 of 0";
    }
    
    const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredNewsupdates.length);
    const total = this.filteredNewsupdates.length;
    
    return `${startIndex}-${endIndex} of ${total}`;
  }

  async fetchAndRenderNewsupdates() {
    this.setLoadingState(true, "Loading news and updates...");
    
    try {
      const res = await fetch("./php_folder/manageNewsUpdates.php", {
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

      if (result.success && Array.isArray(result.newsupdates)) {
        this.newsupdates = result.newsupdates.map(newsupdate => ({
          ...newsupdate,
          // Ensure all fields exist for search
          newsupdateTitle: newsupdate.newsupdateTitle || '',
          newsupdateDescription: newsupdate.newsupdateDescription || '',
          newsupdatePicPath: newsupdate.newsupdatePicPath || '',
          uploadDate: newsupdate.uploadDate || ''
        }));
        
        console.log("Loaded newsupdates:", this.newsupdates.length);
        
        this.filteredNewsupdates = [...this.newsupdates];
        this.setLoadingState(false);
        this.renderPaginatedTable();
        this.updateFilterDropdowns();
      } else {
        this.setLoadingState(false);
        // Handle case where server returns no data
        this.newsupdates = [];
        this.filteredNewsupdates = [];
        this.renderPaginatedTable();
        this.showNotification("No news and updates found or failed to load.", "info");
      }
    } catch (err) {
      console.error("⛔ Fetch failed:", err);
      this.setLoadingState(false);
      this.showNotification("Failed to fetch news and updates.", "error");
    }
  }

  addNewNewsupdate(newsupdate) {
    // Add the new newsupdate to the beginning of the array
    this.newsupdates.unshift(newsupdate);
    
    // Reset filters to show all newsupdates including the new one
    this.filters = {
      uploadDate: '',
      search: ''
    };
    
    // Clear filter inputs
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#uploadYearFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#uploadYearFilter").classList.remove('has-selection');
    
    this.filteredNewsupdates = [...this.newsupdates];
    this.currentPage = 1;
    this.renderPaginatedTable();
    this.updateFilterDropdowns();
    
    // Show success notification
    this.showNotification("News/Update added successfully!", "success");
  }

  updateNewsupdate(updatedNewsupdate) {
    // Find and update the existing newsupdate
    const index = this.newsupdates.findIndex(n => n.newsupdateId === updatedNewsupdate.newsupdateId);
    if (index !== -1) {
      this.newsupdates[index] = { ...this.newsupdates[index], ...updatedNewsupdate };
      
      // Update filtered array as well
      const filteredIndex = this.filteredNewsupdates.findIndex(n => n.newsupdateId === updatedNewsupdate.newsupdateId);
      if (filteredIndex !== -1) {
        this.filteredNewsupdates[filteredIndex] = { ...this.filteredNewsupdates[filteredIndex], ...updatedNewsupdate };
      }
      
      // Re-render the table
      this.renderPaginatedTable();
      
      // Show success notification
      this.showNotification("News/Update updated successfully!", "success");
    }
  }

  editHeaderContent() {
    // Function to edit header content
    console.log("Edit header content");
    this.showNotification("Header edit functionality", "info");
  }

  async showAddServiceModal() {
    const modal = document.createElement("add-newsupdate-modal");
    modal.addEventListener("newsupdate-saved", (e) => {
      this.addNewNewsupdate(e.detail.newsupdate);
    });
    document.body.appendChild(modal);
  }

  // viewNewsupdate(newsupdateId) {
  //   console.log("View newsupdate:", newsupdateId);
  //   this.showNotification("View functionality not implemented yet", "info");
  // }

  viewNewsupdate(newsupdateId) {
    const modal = document.createElement("view-newsupdate-modal");
    modal.addEventListener("newsupdate-updated", (e) => {
      console.log('Newsupdate-updated event received in news-updates.js:', e.detail);
      this.updateNewsupdate(e.detail.newsupdate);
    });
    document.body.appendChild(modal);
    modal.setNewsupdateId(newsupdateId);
  }

  editNewsupdate(newsupdateId) {
    console.log("Edit newsupdate:", newsupdateId);
    this.showNotification("Edit functionality not implemented yet", "info");
  }

  deleteNewsupdate(newsupdateId) {
    console.log("Delete newsupdate:", newsupdateId);
    this.showNotification("Delete functionality not implemented yet", "info");
  }

  showImageModal(imageSrc, imageAlt) {
    // Create a simple modal to show the image in larger size
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      cursor: pointer;
    `;
    
    const image = document.createElement('img');
    image.src = imageSrc;
    image.alt = imageAlt;
    image.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    modal.appendChild(image);
    document.body.appendChild(modal);
    
    // Close modal on click
    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }

  showNotification(message, type) {
    // Create a notification system
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
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
        type === "success"
          ? "background: #10b981;"
          : type === "error"
          ? "background: #ef4444;"
          : "background: #3b82f6;"
      }
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
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
       
        .newsUpdate-header {
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
        .newsUpdate-header-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .newsUpdate-header-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
          z-index: 2;
        }
        .newsUpdate-header-content {
          position: relative;
          z-index: 3;
          padding: 20px;
        }
        .newsUpdate-title {
          font-size: 3rem;
          font-weight: bold;
          letter-spacing: 2px;
        }
        .newsUpdate-description {
          max-width: 600px;
          font-size: 14px;
          line-height: 1.6;
        }
    
        .newsUpdate-content {
          padding: 30px;
          max-width: 100%;
          margin: 0 auto;
        }
        .newsUpdate-controls {
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

        .add-newsUpdate-btn {
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
        .add-newsUpdate-btn:hover {
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

        .newsUpdate-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ea580c;
          margin: 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-collapse: collapse;
        }

        .newsUpdate-table th,
        .newsUpdate-table td {
          padding: 15px;
          text-align: center;
          border-bottom: none;
        }

        .newsUpdate-table th {
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

        .newsUpdate-table th:first-child {
          border-top-left-radius: 8px;
        }

        .newsUpdate-table th:last-child {
          border-top-right-radius: 8px;
        }

        .newsUpdate-table td {
          font-size: 16px;
          color: #374151;
          padding: 16px 15px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
        }

        .newsUpdate-table tbody tr {
          transition: background-color 0.2s ease;
        }
              
        .newsUpdate-table tbody tr:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .newsUpdate-table tbody tr:last-child td {
          border-bottom: none;
        }

        .newsupdate-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #ea580c;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: inline-block;
          vertical-align: middle;
        }

        .newsupdate-image:hover {
          transform: scale(1.15);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          border-color: #d97706;
        }

        .no-image {
          color: #666;
          font-size: 13px;
          font-style: italic;
          background: #f8f9fa;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px dashed #ccc;
          display: inline-block;
          vertical-align: middle;
        }

        .btn-view {
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
          .newsUpdate-controls {
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
                    
          .newsUpdate-title {
            font-size: 2rem;
          }
                    
          .newsUpdate-content {
            padding: 20px;
          }
                    
          .newsUpdate-table {
            font-size: 12px;
          }
                    
          .newsUpdate-table th,
          .newsUpdate-table td {
            padding: 10px 8px;
          }
          
          .newsupdate-image {
            width: 40px;
            height: 40px;
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
      <div class="newsUpdate-container">
        <!-- Header Section -->
        
        <div id="newsUpdateHeader" class="newsUpdate-header">
          <!-- Background Image -->
          <img id="newsUpdateHeaderImage" src="./imgs/home_bckgrnd.png" alt="Services Background" class="newsUpdate-header-image">
          
          <!-- Dark Overlay -->
          <div id="newsUpdateHeaderOverlay" class="newsUpdate-header-overlay"></div>
          
          <!-- Edit Button -->
          <button id="editHeaderBtn" class="btn btn-warning btn-sm edit-header-btn">✍🏻 Edit</button>
          
          <!-- Header Content -->
          <div id="newsUpdateHeaderContent" class="newsUpdate-header-content">
            <h1 id="newsUpdateTitle" class="newsUpdate-title mb-4">News and Update</h1>
            <p id="newsUpdateDescription" class="newsUpdate-description mb-0"> The City Social Welfare and Development Office in Pagadian City is mandated to provide social protective and social development services to poor, vulnerable and disadvantaged individuals, families, groups and communities.
              </p>
          </div>
        </div>
        <!-- Main Content -->
        <div class="newsUpdate-content">
          <!-- Controls Section -->
          <div id="newsUpdateControls" class="newsUpdate-controls">
            <div class="search-container">
                    <span class="left-icon">📧</span>
              <input 
                type="text" 
                id="searchInput" 
                class="search-input" 
                placeholder="Search news and updates..."
              >
       
            </div>
            <button id="addnewsUpdateBtn" class="add-newsUpdate-btn">Add News/Update</button>
          </div>

          <!-- Filters Row -->
          <div class="filters-row">
            <div class="filter-group">
              <label class="filter-label">Upload Date:</label>
              <select id="uploadYearFilter" class="filter-select">
                <option value="">All Dates</option>
              </select>
            </div>
            <button id="resetFiltersBtn" class="reset-filters-btn">🔄 Reset Filters</button>
            <button id="refreshBtn" class="refresh-btn">🔃 Refresh</button>
          </div>
          
          <!-- News/Update Table -->
          <table id="newsUpdateTable" class="newsUpdate-table">
            <thead>
              <tr>
                <th id="thNo">No.</th>
                <th id="thImage">Picture</th>
                <th id="thTitle">Title</th>
                <th id="thDate">Date</th>
                <th id="thAction">Action</th>
              </tr>
            </thead>
            <tbody id="newsUpdateTableBody">
              <tr><td colspan="5" style="text-align: center; padding: 40px;">Loading news and updates...</td></tr>
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

customElements.define("news-updates", NewsUpdates)