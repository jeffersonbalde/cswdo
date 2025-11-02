class ManageServices extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.services = [];
    this.filteredServices = [];
    this.isLoading = false;
    this.isFiltering = false;
    this.currentPage = 1;
    this.rowsPerPage = 10;
    this.filters = {
      processDuration: '',  // Replace uploadYear
      department: '',
      search: ''
    };
    this.searchTimeout = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.fetchAndRenderServices();
    this.refreshHeaderData(); // Load the most recent header data
  }

  setupEventListeners() {
    const addBtn = this.shadowRoot.querySelector("#addServiceBtn");
    const searchInput = this.shadowRoot.querySelector("#searchInput");
    const editHeaderBtn = this.shadowRoot.querySelector("#editHeaderBtn");
    const processDurationFilter = this.shadowRoot.querySelector("#processDurationFilter");
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter");
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn");
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect");

    addBtn.addEventListener("click", () => this.showAddServiceModal());
    editHeaderBtn.addEventListener("click", () => this.editHeaderContent());
    
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

    // Filter functionality
    processDurationFilter.addEventListener("change", (e) => {
      this.filters.processDuration = e.target.value;
      this.applyFilters();
    });

    departmentFilter.addEventListener("change", (e) => {
      this.filters.department = e.target.value;
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
        const serviceId = e.target.dataset.serviceId;
        this.editService(serviceId);
      } else if (e.target.classList.contains("service-image")) {
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
    document.addEventListener("refresh-services-table", () => {
      console.log("Refresh event received from modal");
      this.refreshTable();
    });
  }



  setLoadingState(loading, message = "Loading services...") {
    this.isLoading = loading;
    const tableBody = this.shadowRoot.getElementById("servicesTableBody");
    
    if (loading) {
              tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px;">
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
    const tableBody = this.shadowRoot.getElementById("servicesTableBody");
    
    if (filtering) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
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
    if (this.services.length > 100) {
      this.setFilteringState(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.filteredServices = this.services.filter(service => {
      // Search filter - check multiple fields
      const matchesSearch = !this.filters.search || 
        (service.serviceTitle && service.serviceTitle.toLowerCase().includes(this.filters.search)) ||
        (service.serviceDepartment && service.serviceDepartment.toLowerCase().includes(this.filters.search)) ||
        (service.serviceDescription && service.serviceDescription.toLowerCase().includes(this.filters.search)) ||
        (service.serviceId && service.serviceId.toString().toLowerCase().includes(this.filters.search));
      
      // Process Duration filter
      const matchesDuration = !this.filters.processDuration || 
        (service.processDuration && service.processDuration === this.filters.processDuration);
      
      // Department filter
      const matchesDepartment = !this.filters.department || 
        (service.serviceDepartment && service.serviceDepartment === this.filters.department);

      const matches = matchesSearch && matchesDuration && matchesDepartment;
      
      // Debug log for first few items
      if (this.services.indexOf(service) < 3) {
        console.log(`Service ${service.serviceId}:`, {
          matchesSearch,
          matchesDuration,
          matchesDepartment,
          matches,
          searchTerm: this.filters.search,
          serviceTitle: service.serviceTitle
        });
      }
      
      return matches;
    });

    console.log(`Filtered ${this.filteredServices.length} services from ${this.services.length} total`); // Debug log

    // Add visual feedback for selected filters (font weight only)
    const processDurationFilter = this.shadowRoot.querySelector("#processDurationFilter");
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter");
    
    if (this.filters.processDuration) {
      processDurationFilter.classList.add('has-selection');
    } else {
      processDurationFilter.classList.remove('has-selection');
    }
    
    if (this.filters.department) {
      departmentFilter.classList.add('has-selection');
    } else {
      departmentFilter.classList.remove('has-selection');
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
      processDuration: '',
      department: '',
      search: ''
    };
    
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#processDurationFilter").value = '';
    this.shadowRoot.querySelector("#departmentFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#processDurationFilter").classList.remove('has-selection');
    this.shadowRoot.querySelector("#departmentFilter").classList.remove('has-selection');
    
    this.filteredServices = [...this.services];
    this.currentPage = 1;
    this.setFilteringState(false);
    this.renderPaginatedTable();
  }

  refreshTable() {
    console.log("Refreshing table data...");
    this.fetchAndRenderServices();
  }

  async refreshHeaderData() {
    try {
      const response = await fetch("./php_folder/manageVisualServicePictures.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "getVisualData"
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const headerImage = this.shadowRoot.querySelector("#servicesHeaderImage");
        const servicesDescription = this.shadowRoot.querySelector("#servicesDescription");
        
        // Update the image if we have a photo path
        if (result.data.visualPhoto && headerImage) {
          headerImage.src = result.data.visualPhoto;
        }
        
        // Update the description if we have content
        if (result.data.visualContent && servicesDescription) {
          servicesDescription.textContent = result.data.visualContent;
        }
      }
    } catch (error) {
      console.error("Error refreshing header data:", error);
    }
  }

  updateFilterDropdowns() {
    const processDurationFilter = this.shadowRoot.querySelector("#processDurationFilter");
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter");
    
    // Store current selections
    const currentDuration = processDurationFilter.value;
    const currentDept = departmentFilter.value;
    
    // Get unique process durations and departments
    const durations = [...new Set(this.services.map(s => s.processDuration))].filter(Boolean).sort();
    const departments = [...new Set(this.services.map(s => s.serviceDepartment))].filter(Boolean).sort();
    
    // Update process duration dropdown
    processDurationFilter.innerHTML = '<option value="">All Durations</option>';
    durations.forEach(duration => {
      const selected = duration === currentDuration ? 'selected' : '';
      processDurationFilter.innerHTML += `<option value="${duration}" ${selected}>${duration}</option>`;
    });
    
    // Update department dropdown
    departmentFilter.innerHTML = '<option value="">All Departments</option>';
    departments.forEach(dept => {
      const selected = dept === currentDept ? 'selected' : '';
      departmentFilter.innerHTML += `<option value="${dept}" ${selected}>${dept}</option>`;
    });
    
    // Restore visual feedback
    if (currentDuration) {
      processDurationFilter.classList.add('has-selection');
    }
    if (currentDept) {
      departmentFilter.classList.add('has-selection');
    }
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredServices.length / this.rowsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderPaginatedTable();
    }
  }

  renderPaginatedTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const paginatedServices = this.filteredServices.slice(startIndex, endIndex);
    
    this.renderServicesToTable(paginatedServices);
    this.renderPagination();
  }

  renderServicesToTable(services) {
    const tableBody = this.shadowRoot.getElementById("servicesTableBody");
    
    // Don't clear if we're in a loading state
    if (this.isLoading || this.isFiltering) {
      return;
    }
    
    tableBody.innerHTML = "";
    
    if (services.length === 0) {
      // Check if we have any active filters
      const hasActiveFilters = this.filters.search || this.filters.processDuration || this.filters.department;
      
      if (hasActiveFilters) {
        // No results found with filters applied
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">No Results Found</div>
                <div class="no-results-message">
                  No services match your current filter criteria.<br>
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
                <div class="no-results-title">No Services Available</div>
                <div class="no-results-message">
                  There are currently no services to display.
                </div>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
            services.forEach((service, index) => {
          const row = document.createElement("tr");
          
          // Debug: Log the service data
          console.log(`Service ${service.serviceId}:`, {
            title: service.serviceTitle,
            imagePath: service.servicePicPath,
            hasImage: !!(service.servicePicPath && service.servicePicPath.trim() !== '')
          });
          
          // Create image element with proper error handling
          let imageHtml;
          if (service.servicePicPath && service.servicePicPath.trim() !== '') {
            imageHtml = `<img src="${service.servicePicPath}" alt="Service Image" class="service-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'; console.log('Image failed to load:', '${service.servicePicPath}');">
                         <span class="no-image" style="display: none;">No Image</span>`;
          } else {
            imageHtml = '<span class="no-image">No Image</span>';
          }
          
          row.innerHTML = `
            <td style="text-align: center; font-weight: 600;">${startIndex + index + 1}</td>
            <td style="text-align: center; vertical-align: middle;">${imageHtml}</td>
            <td style="text-align: left; font-weight: 500;">${service.serviceTitle || 'N/A'}</td>
            <td style="text-align: center;">${service.serviceDepartment || 'N/A'}</td>
            <td style="text-align: center;">${service.processDuration || 'N/A'}</td>
            <td style="text-align: center;">
              <button class="btn-view" data-service-id="${service.serviceId}">👁 View</button>
            </td>
          `;
          tableBody.appendChild(row);
        });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredServices.length / this.rowsPerPage);
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer");
    
    let paginationHTML = `
      <div class="pagination-info">
        ${this.getResultsInfo()}
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
    `;

    if (this.filteredServices.length === 0) {
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
    if (this.filteredServices.length === 0) {
      return "1-0 of 0";
    }
    
    const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredServices.length);
    const total = this.filteredServices.length;
    
    return `${startIndex}-${endIndex} of ${total}`;
  }

  async fetchAndRenderServices() {
    this.setLoadingState(true, "Loading services...");
    
    try {
      const res = await fetch("./php_folder/manageService.php", {
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

      if (result.success && Array.isArray(result.services)) {
        // Add mock process duration for demonstration
        this.services = result.services.map(service => ({
          ...service,
          processDuration: service.processDuration || '',
          // Ensure all fields exist for search
          serviceTitle: service.serviceTitle || '',
          serviceDepartment: service.serviceDepartment || '',
          serviceDescription: service.serviceDescription || '',
          servicePicPath: service.servicePicPath || ''
        }));
        
        console.log("Loaded services:", this.services.length); // Debug log
        
        this.filteredServices = [...this.services];
        this.setLoadingState(false);
        this.renderPaginatedTable();
        this.updateFilterDropdowns();
      } else {
        this.setLoadingState(false);
        // Handle case where server returns no data
        this.services = [];
        this.filteredServices = [];
        this.renderPaginatedTable();
        this.showNotification("No services found or failed to load.", "info");
      }
    } catch (err) {
      console.error("⛔ Fetch failed:", err);
      this.setLoadingState(false);
      this.showNotification("Failed to fetch services.", "error");
    }
  }

  addNewService(service) {
    // Add the new service to the beginning of the array
    this.services.unshift(service);
    
    // Reset filters to show all services including the new one
    this.filters = {
      processDuration: '',
      department: '',
      search: ''
    };
    
    // Clear filter inputs
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#processDurationFilter").value = '';
    this.shadowRoot.querySelector("#departmentFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#processDurationFilter").classList.remove('has-selection');
    this.shadowRoot.querySelector("#departmentFilter").classList.remove('has-selection');
    
    this.filteredServices = [...this.services];
    this.currentPage = 1;
    this.renderPaginatedTable();
    this.updateFilterDropdowns();
    
    // Show success notification
    this.showNotification("Service added successfully!", "success");
  }

  async editHeaderContent() {
    await this.showEditVisualPhotoModal();
  }

  async showEditVisualPhotoModal() {
    try {
      // First, fetch the most recent visual data from the database
      const response = await fetch("./php_folder/manageVisualServicePictures.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "getVisualData"
        }),
      });

      const result = await response.json();
      let currentData = {
        visualPhoto: this.shadowRoot.querySelector("#servicesHeaderImage")?.src,
        visualContent: this.shadowRoot.querySelector("#servicesHeaderContent")?.textContent?.trim()
      };

      // If we have data from the database, use it
      if (result.success && result.data) {
        currentData = {
          visualPhoto: result.data.visualPhoto || currentData.visualPhoto,
          visualContent: result.data.visualContent || currentData.visualContent,
          upload_date: result.data.upload_date
        };
      }

      const modal = document.createElement("service-edit-visual-photo-modal");
      
      // Listen for visual photo updates
      modal.addEventListener("visual-photo-updated", (e) => {
        this.updateVisualPhoto(e.detail);
      });
      
      document.body.appendChild(modal);
      
      // Set data for the modal with the fetched data
      modal.setData(this, currentData, "servicesHeader");
      
    } catch (error) {
      console.error("Error fetching visual data:", error);
      // Fallback to current header data if fetch fails
      const currentData = {
        visualPhoto: this.shadowRoot.querySelector("#servicesHeaderImage")?.src,
        visualContent: this.shadowRoot.querySelector("#servicesHeaderContent")?.textContent?.trim()
      };
      
      const modal = document.createElement("service-edit-visual-photo-modal");
      modal.addEventListener("visual-photo-updated", (e) => {
        this.updateVisualPhoto(e.detail);
      });
      document.body.appendChild(modal);
      modal.setData(this, currentData, "servicesHeader");
    }
  }

  updateVisualPhoto(detail) {
    const { data, sourceComponent } = detail;
    
    // Update the services header with new data
    const headerImage = this.shadowRoot.querySelector("#servicesHeaderImage");
    const headerContent = this.shadowRoot.querySelector("#servicesHeaderContent");
    const servicesDescription = this.shadowRoot.querySelector("#servicesDescription");
    
    // Update the image if a new photo was provided
    if (data.visualPhoto && headerImage) {
      // If it's a File object (new upload), create object URL
      if (data.visualPhoto instanceof File) {
        const objectUrl = URL.createObjectURL(data.visualPhoto);
        headerImage.src = objectUrl;
      } else {
        // If it's a path string, use it directly
        headerImage.src = data.visualPhoto;
      }
    }
    
    // Update the content if new content was provided
    if (data.visualContent && headerContent && servicesDescription) {
      // Update the description text
      servicesDescription.textContent = data.visualContent;
    }
    
    // Refresh header data from database to ensure consistency
    setTimeout(() => {
      this.refreshHeaderData();
    }, 1000); // Small delay to ensure the database update is complete
    
    this.showNotification("Services header updated successfully!", "success");
  }

  async showAddServiceModal() {
    const modal = document.createElement("add-service-modal");
    modal.addEventListener("service-saved", (e) => {
      this.addNewService(e.detail.service);
    });
    document.body.appendChild(modal);
  }

  editService(serviceId) {
    const modal = document.createElement("view-service-modal");
    modal.addEventListener("service-updated", (e) => {
      console.log('Service-updated event received in manage-services.js:', e.detail);
      this.updateService(e.detail.service);
    });
    document.body.appendChild(modal);
    modal.setServiceId(serviceId);
  }

  updateService(updatedService) {
    console.log('updateService called with:', updatedService);
    
    // Find and update the service in the local array
    const index = this.services.findIndex(service => service.serviceId === updatedService.serviceId);
    if (index !== -1) {
      console.log('Found service at index:', index);
      console.log('Original service:', this.services[index]);
      
      this.services[index] = {
        ...this.services[index],
        serviceTitle: updatedService.serviceTitle,
        serviceDepartment: updatedService.serviceDepartment,
        processDuration: updatedService.processDuration,
        serviceDescription: updatedService.serviceDescription,
        serviceRequirements: updatedService.serviceRequirements,
        serviceWhoCanAvail: updatedService.serviceWhoCanAvail,
        servicePicPath: updatedService.servicePicPath || this.services[index].servicePicPath
      };
      
      console.log('Updated service:', this.services[index]);
      this.applyFilters(); // Re-apply filters to update the table
    } else {
      console.log('Service not found in local array');
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
                      
        .services-header {
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
        
        .services-header-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        
        .services-header-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
          z-index: 2;
        }
        
        .services-header-content {
          position: relative;
          z-index: 3;
          padding: 20px;
        }
        
        .services-title {
          font-size: 3rem;
          font-weight: bold;
          letter-spacing: 2px;
        }
        
        .services-description {
          max-width: 600px;
          font-size: 14px;
          line-height: 1.6;
        }

        .services-content {
          padding: 30px;
          max-width: 100%;
          margin: 0 auto;
        }
        
        .services-controls {
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
        
        .add-service-btn {
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
        
        .add-service-btn:hover {
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
        
        .services-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ea580c;
          margin: 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-collapse: collapse;
        }
        
        .services-table th,
        .services-table td {
          padding: 15px;
          text-align: center;
          border-bottom: none;
        }
        
        .services-table th {
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
        
        .services-table th:first-child {
          border-top-left-radius: 8px;
        }
        
        .services-table th:last-child {
          border-top-right-radius: 8px;
        }
        
        .services-table td {
          font-size: 16px;
          color: #374151;
          padding: 16px 15px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
        }
        
        .services-table tbody tr {
          transition: background-color 0.2s ease;
        }
              
        .services-table tbody tr:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .services-table tbody tr:last-child td {
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

        .service-image {
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

        .service-image:hover {
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
          .services-controls {
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
                    
          .services-title {
            font-size: 2rem;
          }
                    
          .services-content {
            padding: 20px;
          }
                    
          .services-table {
            font-size: 12px;
          }
                    
          .services-table th,
          .services-table td {
            padding: 10px 8px;
          }
          
          .service-image {
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
      
      <div class="services-container">
        <!-- Header Section -->
        <div id="servicesHeader" class="services-header">
          <img id="servicesHeaderImage" src="./imgs/home_bckgrnd.png" alt="Services Background" class="services-header-image">
          <div id="servicesHeaderOverlay" class="services-header-overlay"></div>
          <button id="editHeaderBtn" class="btn btn-warning btn-sm edit-header-btn">✍🏻 Edit</button>
          <div id="servicesHeaderContent" class="services-header-content">
            <h1 id="servicesTitle" class="services-title mb-4">SERVICES</h1>
            <p id="servicesDescription" class="services-description mb-0">
              The City Social Welfare and Development Office in Pagadian City is mandated to provide social protective and social development services to poor, vulnerable and disadvantaged individuals, families, groups and communities.
            </p>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="services-content">
          <!-- Controls Section -->
          <div id="servicesControls" class="services-controls">
            <div class="search-container">
              <span class="left-icon">🔍</span>
              <input 
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Search services..."
              >
            </div>
            <button id="addServiceBtn" class="add-service-btn">Add Service</button>
          </div>

          <!-- Filters Row (Now below search) -->
          <div class="filters-row">
            <div class="filter-group">
              <label class="filter-label">Department:</label>
              <select id="departmentFilter" class="filter-select">
                <option value="">All Departments</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Process Duration:</label>
              <select id="processDurationFilter" class="filter-select">
                <option value="">All Durations</option>
              </select>
            </div>
            <button id="resetFiltersBtn" class="reset-filters-btn">🔄 Reset Filters</button>
            <button id="refreshBtn" class="refresh-btn">🔃 Refresh</button>
          </div>
          
          <!-- Services Table -->
          <table id="servicesTable" class="services-table">
            <thead>
              <tr>
                <th id="thNo">No.</th>
                <th id="thImage">Image</th>
                <th id="thServiceTitle">Title</th>
                <th id="thServiceDept">Department</th>
                <th id="thProcessDuration">Process Duration</th>
                <th id="thAction">Action</th>
              </tr>
            </thead>
            <tbody id="servicesTableBody">
              <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                  <div class="no-results-container">
                    <div class="no-results-icon">📋</div>
                    <div class="no-results-title">No Services Available</div>
                    <div class="no-results-message">
                      There are currently no services to display.
                    </div>
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
    `;
  }
}

customElements.define("manage-services", ManageServices);