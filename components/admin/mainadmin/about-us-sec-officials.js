class AboutUsSectorialOfficials extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.officials = [];
    this.filteredOfficials = [];
    this.isLoading = false;
    this.isFiltering = false;
    this.currentPage = 1;
    this.rowsPerPage = 10;
    this.filters = {
      position: '',
      search: ''
    };
    this.searchTimeout = null;

    // Component map for different official types - similar to sidebar structure
    this.componentMap = {
      "about-us-head-officials": {
        title: "Head Officials",
        component: "about-us-head-officials",
      },
      "about-us-cyw-officials": {
        title: "Child and Youth Welfare Officials",
        component: "about-us-cyw-officials",
      },
      "about-us-fc-officials": {
        title: "Family and Community Officials",
        component: "about-us-fc-officials",
      },
      "about-us-emergency-officials": {
        title: "Emergency Welfare Officials",
        component: "about-us-em-officials",
      },
      "about-us-sectoral-officials": {
        title: "Sectoral Welfare Officials",
        component: "about-us-sectoral-officials",
      },
      "about-us-admin-officials": {
        title: "Administrative Services Officials",
        component: "about-us-admin-officials",
      },
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.updateDateTime();
    this.fetchAndRenderOfficials();
    
    // Update time every minute
    setInterval(() => this.updateDateTime(), 60000);
  }

  updateDateTime() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    const dateTimeString = now.toLocaleDateString('en-US', options);
    
    const dateTimeElement = this.shadowRoot.querySelector('#dateTime');
    if (dateTimeElement) {
      dateTimeElement.textContent = dateTimeString;
    }
  }

  setupEventListeners() {
    const searchInput = this.shadowRoot.querySelector("#searchInput");
    const positionFilter = this.shadowRoot.querySelector("#positionFilter");
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn");
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect");

     // Event delegation for all buttons - similar to sidebar pattern
     this.shadowRoot.addEventListener("click", (e) => {
       if (e.target.classList.contains("add-official-btn")) {
         this.handleButtonClick("addOfficial");
       } else if (e.target.classList.contains("btn-view")) {
         const officialId = e.target.dataset.officialId;
         this.handleButtonClick("viewOfficial", officialId);
       } else if (e.target.classList.contains("btn-edit")) {
         const officialId = e.target.dataset.officialId;
         this.handleButtonClick("editOfficial", officialId);
       } else if (e.target.classList.contains("btn-delete")) {
         const officialId = e.target.dataset.officialId;
         this.handleButtonClick("deleteOfficial", officialId);
       }
     });
    
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
    positionFilter.addEventListener("change", (e) => {
      this.filters.position = e.target.value;
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
        const officialId = e.target.dataset.officialId;
        this.viewOfficial(officialId);
      } else if (e.target.classList.contains("btn-edit")) {
        const officialId = e.target.dataset.officialId;
        this.editOfficial(officialId);
      } else if (e.target.classList.contains("btn-delete")) {
        const officialId = e.target.dataset.officialId;
        this.deleteOfficial(officialId);
      } else if (e.target.classList.contains("official-image")) {
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
    document.addEventListener("refresh-officials-table", () => {
      console.log("Refresh event received from modal");
      this.refreshTable();
    });
  }

  // Navigation method similar to sidebar's navigateTo
  navigateToOfficialType(officialType, data = null) {
    const componentInfo = this.componentMap[officialType];
    if (componentInfo) {
      // Dispatch navigation event similar to sidebar
      this.dispatchEvent(
        new CustomEvent("navigate-to", {
          detail: {
            view: officialType,
            title: componentInfo.title,
            component: componentInfo.component,
            data: data
          },
          bubbles: true,
          composed: true
        })
      );
      console.log(`Navigating to: ${componentInfo.title}`, data);
    } else {
      console.warn(`Unknown official type: ${officialType}`);
      this.showNotification(`Unknown official type: ${officialType}`, "error");
    }
  }

  // Handle button clicks with switch case - similar to sidebar pattern
  handleButtonClick(action, data = null) {
    switch (action) {
      case "addOfficial":
        this.showAddOfficialModal();
        break;
      case "viewOfficial":
        this.viewOfficial(data);
        break;
      case "editOfficial":
        this.editOfficial(data);
        break;
      case "deleteOfficial":
        this.deleteOfficial(data);
        break;
      case "navigateToCYW":
        this.navigateToOfficialType("about-us-cyw-officials", data);
        break;
      case "navigateToFC":
        this.navigateToOfficialType("about-us-fc-officials", data);
        break;
      case "navigateToEmergency":
        this.navigateToOfficialType("about-us-emergency-officials", data);
        break;
      case "navigateToSectoral":
        this.navigateToOfficialType("about-us-sectoral-officials", data);
        break;
      case "navigateToAdmin":
        this.navigateToOfficialType("about-us-admin-officials", data);
        break;
      default:
        console.warn(`Unknown button action: ${action}`);
        this.showNotification(`Unknown action: ${action}`, "error");
        break;
    }
  }

  setLoadingState(loading, message = "Loading officials...") {
    this.isLoading = loading;
    const tableBody = this.shadowRoot.getElementById("officialsTableBody");
    
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
    const tableBody = this.shadowRoot.getElementById("officialsTableBody");
    
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
    if (this.officials.length > 100) {
      this.setFilteringState(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.filteredOfficials = this.officials.filter(official => {
      // Search filter - check multiple fields
      const matchesSearch = !this.filters.search || 
        (official.name && official.name.toLowerCase().includes(this.filters.search)) ||
        (official.position && official.position.toLowerCase().includes(this.filters.search));
      
      // Position filter
      const matchesPosition = !this.filters.position || 
        (official.position && official.position.toLowerCase().includes(this.filters.position.toLowerCase()));

      const matches = matchesSearch && matchesPosition;
      
      return matches;
    });

    console.log(`Filtered ${this.filteredOfficials.length} officials from ${this.officials.length} total`);

    // Add visual feedback for selected filters
    const positionFilter = this.shadowRoot.querySelector("#positionFilter");
    
    if (this.filters.position) {
      positionFilter.classList.add('has-selection');
    } else {
      positionFilter.classList.remove('has-selection');
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
      position: '',
      search: ''
    };
    
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#positionFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#positionFilter").classList.remove('has-selection');
    
    this.filteredOfficials = [...this.officials];
    this.currentPage = 1;
    this.setFilteringState(false);
    this.renderPaginatedTable();
  }

  refreshTable() {
    console.log("Refreshing table data...");
    this.fetchAndRenderOfficials();
  }

  updateFilterDropdowns() {
    const positionFilter = this.shadowRoot.querySelector("#positionFilter");
    
    // Store current selection
    const currentPosition = positionFilter.value;
    
    // Get unique positions
    const positions = [...new Set(this.officials.map(o => o.position))].filter(Boolean).sort();
    
    // Update position dropdown
    positionFilter.innerHTML = '<option value="">All Positions</option>';
    positions.forEach(position => {
      const selected = position === currentPosition ? 'selected' : '';
      positionFilter.innerHTML += `<option value="${position}" ${selected}>${position}</option>`;
    });
    
    // Restore visual feedback
    if (currentPosition) {
      positionFilter.classList.add('has-selection');
    }
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredOfficials.length / this.rowsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderPaginatedTable();
    }
  }

  renderPaginatedTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const paginatedOfficials = this.filteredOfficials.slice(startIndex, endIndex);
    
    this.renderOfficialsToTable(paginatedOfficials);
    this.renderPagination();
  }

  renderOfficialsToTable(officials) {
    const tableBody = this.shadowRoot.getElementById("officialsTableBody");
    
    // Don't clear if we're in a loading state
    if (this.isLoading || this.isFiltering) {
      return;
    }
    
    tableBody.innerHTML = "";
    
    if (officials.length === 0) {
      // Check if we have any active filters
      const hasActiveFilters = this.filters.search || this.filters.position;
      
      if (hasActiveFilters) {
        // No results found with filters applied
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">No Results Found</div>
                <div class="no-results-message">
                  No officials match your current filter criteria.<br>
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
                <div class="no-results-icon">👥</div>
                <div class="no-results-title">No Officials Available</div>
                <div class="no-results-message">
                  There are currently no officials to display.
                </div>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    officials.forEach((official, index) => {
      const row = document.createElement("tr");
      
      // Create image element with proper error handling
      let imageHtml;
      if (official.picture && official.picture.trim() !== '') {
        imageHtml = `<img src="${official.picture}" alt="Official Image" class="official-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'; console.log('Image failed to load:', '${official.picture}');">
                     <span class="no-image" style="display: none;">No Image</span>`;
      } else {
        imageHtml = '<span class="no-image">No Image</span>';
      }
      
      const rowNumber = startIndex + index + 1;
      
      row.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${rowNumber}</td>
        <td style="text-align: center; vertical-align: middle;">${imageHtml}</td>
        <td style="text-align: left; font-weight: 500;">${official.name || 'N/A'}</td>
        <td style="text-align: center;">${official.position || 'N/A'}</td>
        <td style="text-align: center;">
          <button class="btn-view" data-official-id="${official.id}">👁 View</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredOfficials.length / this.rowsPerPage);
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer");
    
    let paginationHTML = `
      <div class="pagination-info">
        ${this.getResultsInfo()}
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
    `;

    if (this.filteredOfficials.length === 0) {
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
    if (this.filteredOfficials.length === 0) {
      return "1-0 of 0";
    }
    
    const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredOfficials.length);
    const total = this.filteredOfficials.length;
    
    return `${startIndex}-${endIndex} of ${total}`;
  }

  async fetchAndRenderOfficials() {
    this.setLoadingState(true, "Loading officials...");
    
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'fetchdata');
      formData.append('dept', 'sec');
      const response = await fetch('./php_folder/manageSecOfficials.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        this.officials = result.data || [];
        console.log("Loaded SEC officials:", this.officials.length);
      } else {
        console.error("Failed to fetch SEC officials:", result.message);
        this.officials = [];
        this.showNotification(result.message || "Failed to fetch officials.", "error");
      }
      this.filteredOfficials = [...this.officials];
      this.setLoadingState(false);
      this.renderPaginatedTable();
      this.updateFilterDropdowns();
    } catch (err) {
      console.error("⛔ Fetch failed:", err);
      this.setLoadingState(false);
      this.showNotification("Failed to fetch officials.", "error");
    }
  }

  addNewOfficial(official) {
    // Add the new official to the beginning of the array
    this.officials.unshift(official);
    
    // Reset filters to show all officials including the new one
    this.filters = {
      position: '',
      search: ''
    };
    
    // Clear filter inputs
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#positionFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#positionFilter").classList.remove('has-selection');
    
    this.filteredOfficials = [...this.officials];
    this.currentPage = 1;
    this.renderPaginatedTable();
    this.updateFilterDropdowns();
    
    // Show success notification
    this.showNotification("Official added successfully!", "success");
  }

  updateOfficial(updatedOfficial) {
    // Find and update the existing official
    const index = this.officials.findIndex(o => o.id === updatedOfficial.id);
    if (index !== -1) {
      this.officials[index] = { ...this.officials[index], ...updatedOfficial };
      
      // Update filtered array as well
      const filteredIndex = this.filteredOfficials.findIndex(o => o.id === updatedOfficial.id);
      if (filteredIndex !== -1) {
        this.filteredOfficials[filteredIndex] = { ...this.filteredOfficials[filteredIndex], ...updatedOfficial };
      }
      
      // Re-render the table
      this.renderPaginatedTable();
      
      // Show success notification
      this.showNotification("Official updated successfully!", "success");
    }
  }


  async showAddOfficialModal() {
    const modal = document.createElement("add-sec-officials-modal");
    document.body.appendChild(modal);
    modal.addEventListener("official-saved", (e) => { console.log("SEC Official saved:", e.detail); });
    modal.addEventListener("refresh-officials-table", () => { this.fetchAndRenderOfficials(); });
  }

  async viewOfficial(officialId) {
    try {
      const existing = document.querySelector('view-sectorial-officials-modal');
      if (existing) existing.remove();
      const modal = document.createElement('view-sectorial-officials-modal');
      document.body.appendChild(modal);
      if (customElements && customElements.whenDefined) {
        customElements.whenDefined('view-sectorial-officials-modal').then(() => {
          if (typeof modal.setOfficialId === 'function') {
            modal.setOfficialId(officialId);
          } else {
            setTimeout(() => typeof modal.setOfficialId === 'function' && modal.setOfficialId(officialId), 0);
          }
        });
      } else if (typeof modal.setOfficialId === 'function') {
        modal.setOfficialId(officialId);
      }
    } catch (e) {
      console.error('Failed to open SEC view modal:', e);
      this.showNotification('Failed to open view modal.', 'error');
    }
  }

  async editOfficial(officialId) {
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'getOfficialById');
      formData.append('official_id', officialId);
      const response = await fetch('./php_folder/manageSecOfficials.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        console.log("SEC Official data for editing:", result.data);
        this.showNotification("Edit modal needs to be implemented", "info");
      } else {
        this.showNotification(result.message || "Failed to fetch official details.", "error");
      }
    } catch (err) {
      console.error("Error editing SEC official:", err);
      this.showNotification("Failed to fetch official details.", "error");
    }
  }

  async deleteOfficial(officialId) {
    const confirmed = confirm("Are you sure you want to delete this official?");
    if (!confirmed) return;
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'delete');
      formData.append('official_id', officialId);
      const response = await fetch('./php_folder/manageSecOfficials.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        this.officials = this.officials.filter(o => o.id !== parseInt(officialId));
        this.filteredOfficials = this.filteredOfficials.filter(o => o.id !== parseInt(officialId));
        this.renderPaginatedTable();
        this.showNotification(result.message, "success");
      } else {
        this.showNotification(result.message || "Failed to delete official.", "error");
      }
    } catch (err) {
      console.error("Error deleting SEC official:", err);
      this.showNotification("Failed to delete official.", "error");
    }
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

       
        .about-header {
          position: relative;
          height: 120px;
          background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          text-align: center;
          border-bottom: 3px solid #654321;
        }
        
        .about-header-content {
          position: relative;
          z-index: 3;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1200px;
        }
        
        .about-title {
          font-size: 2.5rem;
          font-weight: bold;
          letter-spacing: 2px;
          margin: 0;
        }
        
        .date-time {
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
        }

        .about-content {
          padding: 30px;
          background: #f8f9fa;
        }

        .section-label {
          font-size: 1.8rem;
          font-weight: bold;
          color: #333;
          margin: 0 0 20px 0;
          padding-left: 20px;
          border-left: 4px solid #3b82f6;
        }

        .officials-controls {
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

        .add-official-btn {
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
        .add-official-btn:hover {
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

        .officials-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ea580c;
          margin: 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-collapse: collapse;
        }

        .officials-table th,
        .officials-table td {
          padding: 15px;
          text-align: center;
          border-bottom: none;
        }

        .officials-table th {
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

        .officials-table th:first-child {
          border-top-left-radius: 8px;
        }

        .officials-table th:last-child {
          border-top-right-radius: 8px;
        }

        .officials-table td {
          font-size: 16px;
          color: #374151;
          padding: 16px 15px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
        }

        .officials-table tbody tr {
          transition: background-color 0.2s ease;
        }
              
        .officials-table tbody tr:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .officials-table tbody tr:last-child td {
          border-bottom: none;
        }

        .official-image {
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

        .official-image:hover {
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
          .about-title {
            font-size: 1.8rem;
          }
          
          .date-time {
            font-size: 0.9rem;
          }
          
          .about-header-content {
            flex-direction: column;
            gap: 10px;
          }
          
          .officials-controls {
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
                    
          .about-content {
            padding: 20px;
          }
                    
          .officials-table {
            font-size: 12px;
          }
                    
          .officials-table th,
          .officials-table td {
            padding: 10px 8px;
          }
          
          .official-image {
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
      
      <div class="about-container">
        <!-- Header Section -->
      

        <!-- Main Content -->
        <div class="about-content">
          <!-- Section Label -->
          <h2 class="section-label">Sectoral Welfare Officials</h2>
          
          <!-- Controls Section -->
          <div id="officialsControls" class="officials-controls">
            <div class="search-container">
              <span class="left-icon">🔍</span>
              <input 
                type="text" 
                id="searchInput" 
                class="search-input" 
                placeholder="Search officials..."
              >
            </div>
            <button id="addOfficialBtn" class="add-official-btn">Add Official</button>
          </div>

          <!-- Filters Row -->
          <div class="filters-row">
            <div class="filter-group">
              <label class="filter-label">Position:</label>
              <select id="positionFilter" class="filter-select">
                <option value="">All Positions</option>
              </select>
            </div>
            <button id="resetFiltersBtn" class="reset-filters-btn">🔄 Reset Filters</button>
            <button id="refreshBtn" class="refresh-btn">🔃 Refresh</button>
          </div>
          
          <!-- Officials Table -->
          <table id="officialsTable" class="officials-table">
            <thead>
              <tr>
                <th id="thNo">No</th>
                <th id="thPicture">Picture</th>
                <th id="thName">Name</th>
                <th id="thPosition">Position</th>
                <th id="thAction">Action</th>
              </tr>
            </thead>
            <tbody id="officialsTableBody">
              <tr><td colspan="5" style="text-align: center; padding: 40px;">Loading officials...</td></tr>
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

customElements.define("about-us-sec-officials", AboutUsSectorialOfficials)
