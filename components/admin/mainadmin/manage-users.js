class ManageUsers extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.users = [];
    this.filteredUsers = [];
    this.isLoading = false;
    this.isFiltering = false;
    this.currentPage = 1;
    this.rowsPerPage = 10;
    this.filters = {
      userType: '',
      department: '',
      search: ''
    };
    this.searchTimeout = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.fetchAndRenderUsers();
  }

  setupEventListeners() {
    const addBtn = this.shadowRoot.querySelector("#addUsersBtn");
    const searchInput = this.shadowRoot.querySelector("#searchInput");
    const userTypeFilter = this.shadowRoot.querySelector("#userTypeFilter");
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter");
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn");
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect");

    addBtn.addEventListener("click", () => this.showAddUserModal());
    
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
    userTypeFilter.addEventListener("change", (e) => {
      this.filters.userType = e.target.value;
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
        const userId = e.target.dataset.userId;
        this.viewUser(userId);
      } else if (e.target.classList.contains("btn-edit")) {
        const userId = e.target.dataset.userId;
        this.editUser(userId);
      } else if (e.target.classList.contains("btn-delete")) {
        const userId = e.target.dataset.userId;
        this.deleteUser(userId);
      } else if (e.target.classList.contains("user-image")) {
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
    document.addEventListener("refresh-users-table", () => {
      console.log("Refresh event received from modal");
      this.refreshTable();
    });
  }

  setLoadingState(loading, message = "Loading users...") {
    this.isLoading = loading;
    const tableBody = this.shadowRoot.getElementById("usersTableBody");
    
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
    const tableBody = this.shadowRoot.getElementById("usersTableBody");
    
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
    if (this.users.length > 100) {
      this.setFilteringState(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.filteredUsers = this.users.filter(user => {
      // Search filter - check multiple fields
      const matchesSearch = !this.filters.search || 
        (user.username && user.username.toLowerCase().includes(this.filters.search)) ||
        (user.userType && user.userType.toLowerCase().includes(this.filters.search)) ||
        (user.userDept && user.userDept.toLowerCase().includes(this.filters.search)) ||
        (user.userHandler && user.userHandler.toLowerCase().includes(this.filters.search)) ||
        (user.userId && user.userId.toString().toLowerCase().includes(this.filters.search));
      
      // User Type filter
      const matchesUserType = !this.filters.userType || 
        (user.userType && user.userType === this.filters.userType);
      
      // Department filter
      const matchesDepartment = !this.filters.department || 
        (user.userDept && user.userDept === this.filters.department);

      const matches = matchesSearch && matchesUserType && matchesDepartment;
      
      // Debug log for first few items
      if (this.users.indexOf(user) < 3) {
        console.log(`User ${user.userId}:`, {
          matchesSearch,
          matchesUserType,
          matchesDepartment,
          matches,
          searchTerm: this.filters.search,
          username: user.username
        });
      }
      
      return matches;
    });

    console.log(`Filtered ${this.filteredUsers.length} users from ${this.users.length} total`);

    // Add visual feedback for selected filters
    const userTypeFilter = this.shadowRoot.querySelector("#userTypeFilter");
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter");
    
    if (this.filters.userType) {
      userTypeFilter.classList.add('has-selection');
    } else {
      userTypeFilter.classList.remove('has-selection');
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
      userType: '',
      department: '',
      search: ''
    };
    
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#userTypeFilter").value = '';
    this.shadowRoot.querySelector("#departmentFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#userTypeFilter").classList.remove('has-selection');
    this.shadowRoot.querySelector("#departmentFilter").classList.remove('has-selection');
    
    this.filteredUsers = [...this.users];
    this.currentPage = 1;
    this.setFilteringState(false);
    this.renderPaginatedTable();
  }

  refreshTable() {
    console.log("Refreshing table data...");
    this.fetchAndRenderUsers();
  }

  updateFilterDropdowns() {
    const userTypeFilter = this.shadowRoot.querySelector("#userTypeFilter");
    const departmentFilter = this.shadowRoot.querySelector("#departmentFilter");
    
    // Store current selections
    const currentUserType = userTypeFilter.value;
    const currentDept = departmentFilter.value;
    
    // Get unique user types and departments
    const userTypes = [...new Set(this.users.map(u => u.userType))].filter(Boolean).sort();
    const departments = [...new Set(this.users.map(u => u.userDept))].filter(Boolean).sort();
    
    // Update user type dropdown
    userTypeFilter.innerHTML = '<option value="">All User Types</option>';
    userTypes.forEach(type => {
      const selected = type === currentUserType ? 'selected' : '';
      userTypeFilter.innerHTML += `<option value="${type}" ${selected}>${type}</option>`;
    });
    
    // Update department dropdown
    departmentFilter.innerHTML = '<option value="">All Departments</option>';
    departments.forEach(dept => {
      const selected = dept === currentDept ? 'selected' : '';
      departmentFilter.innerHTML += `<option value="${dept}" ${selected}>${dept}</option>`;
    });
    
    // Restore visual feedback
    if (currentUserType) {
      userTypeFilter.classList.add('has-selection');
    }
    if (currentDept) {
      departmentFilter.classList.add('has-selection');
    }
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredUsers.length / this.rowsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderPaginatedTable();
    }
  }

  renderPaginatedTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
    
    this.renderUsersToTable(paginatedUsers);
    this.renderPagination();
  }

  renderUsersToTable(users) {
    const tableBody = this.shadowRoot.getElementById("usersTableBody");
    
    // Don't clear if we're in a loading state
    if (this.isLoading || this.isFiltering) {
      return;
    }
    
    tableBody.innerHTML = "";
    
    if (users.length === 0) {
      // Check if we have any active filters
      const hasActiveFilters = this.filters.search || this.filters.userType || this.filters.department;
      
      if (hasActiveFilters) {
        // No results found with filters applied
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">No Results Found</div>
                <div class="no-results-message">
                  No users match your current filter criteria.<br>
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
                <div class="no-results-title">No Users Available</div>
                <div class="no-results-message">
                  There are currently no users to display.
                </div>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    users.forEach((user, index) => {
      const row = document.createElement("tr");
      
      // Debug: Log the user data
      console.log(`User ${user.userId}:`, {
        userType: user.userType,
        userDept: user.userDept,
        userHandler: user.userHandler,
        username: user.username
      });
      
      row.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${startIndex + index + 1}</td>
        <td style="text-align: center; font-weight: 500;">${user.userType || 'N/A'}</td>
        <td style="text-align: center; font-weight: 500;">${user.userDept || 'N/A'}</td>
        <td style="text-align: center; font-weight: 500;">${user.userHandler || 'N/A'}</td>
        <td style="text-align: center;">
          <button class="btn-view" data-user-id="${user.userId}" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background-color 0.2s ease;
          " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
            View
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredUsers.length / this.rowsPerPage);
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer");
    
    let paginationHTML = `
      <div class="pagination-info">
        ${this.getResultsInfo()}
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
    `;

    if (this.filteredUsers.length === 0) {
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
    if (this.filteredUsers.length === 0) {
      return "1-0 of 0";
    }
    
    const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredUsers.length);
    const total = this.filteredUsers.length;
    
    return `${startIndex}-${endIndex} of ${total}`;
  }

  async fetchAndRenderUsers() {
    this.setLoadingState(true, "Loading users...");
    
    try {
      const res = await fetch("./php_folder/manageUsers.php", {
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

      if (result.success && Array.isArray(result.users)) {
        this.users = result.users.map(user => ({
          ...user,
          // Ensure all fields exist for search
          userId: user.userId || '',
          userType: user.userType || '',
          userDept: user.userDept || '',
          username: user.username || '',
          userHandler: user.userHandler || '',
          password: user.password || ''
        }));
        
        console.log("Loaded users:", this.users.length);
        
        this.filteredUsers = [...this.users];
        this.setLoadingState(false);
        this.renderPaginatedTable();
        this.updateFilterDropdowns();
      } else {
        this.setLoadingState(false);
        // Handle case where server returns no data
        this.users = [];
        this.filteredUsers = [];
        this.renderPaginatedTable();
        this.showNotification("No users found or failed to load.", "info");
      }
    } catch (err) {
      console.error("⛔ Fetch failed:", err);
      this.setLoadingState(false);
      this.showNotification("Failed to fetch users.", "error");
    }
  }

  addNewUser(user) {
    // Add the new user to the beginning of the array
    this.users.unshift(user);
    
    // Reset filters to show all users including the new one
    this.filters = {
      userType: '',
      department: '',
      search: ''
    };
    
    // Clear filter inputs
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#userTypeFilter").value = '';
    this.shadowRoot.querySelector("#departmentFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#userTypeFilter").classList.remove('has-selection');
    this.shadowRoot.querySelector("#departmentFilter").classList.remove('has-selection');
    
    this.filteredUsers = [...this.users];
    this.currentPage = 1;
    this.renderPaginatedTable();
    this.updateFilterDropdowns();
    
    // Show success notification
    this.showNotification("User added successfully!", "success");
  }

  async showAddUserModal() {
    const modal = document.createElement("add-user");
    modal.addEventListener("user-saved", (e) => {
      this.addNewUser(e.detail.user);
    });
    document.body.appendChild(modal);
  }

  viewUser(userId) {
    // Open view-user-modal with user ID
    try {
      const modal = document.createElement('view-user-modal');
      modal.setUserId(userId);
      document.body.appendChild(modal);
    } catch (err) {
      console.error("View error:", err);
      this.showNotification("Failed to open user details. Check your internet or server.", "error");
    }
  }

  editUser(userId) {
    console.log("Edit user:", userId);
    this.showNotification("Edit functionality not implemented yet", "info");
  }

  deleteUser(userId) {
    console.log("Delete user:", userId);
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
    
        .manageusers-content {
          padding: 30px;
          max-width: 100%;
          margin: 0 auto;
        }
        
        .manageusers-controls {
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

        .add-users-btn {
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
        
        .add-users-btn:hover {
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

        .users-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ea580c;
          margin: 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-collapse: collapse;
        }

        .users-table th,
        .users-table td {
          padding: 15px;
          text-align: center;
          border-bottom: none;
        }

        .users-table th {
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

        .users-table th:first-child {
          border-top-left-radius: 8px;
        }

        .users-table th:last-child {
          border-top-right-radius: 8px;
        }

        .users-table td {
          font-size: 16px;
          color: #374151;
          padding: 16px 15px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
        }

        .users-table tbody tr {
          transition: background-color 0.2s ease;
        }
              
        .users-table tbody tr:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .users-table tbody tr:last-child td {
          border-bottom: none;
        }

        .btn-view {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }

        .btn-view:hover {
          background: #2563eb;
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
          .manageusers-controls {
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
                    
          .manageusers-content {
            padding: 20px;
          }
                    
          .users-table {
            font-size: 12px;
          }
                    
          .users-table th,
          .users-table td {
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

      <div class="manageusers-container">
        <!-- Main Content -->
        <div class="manageusers-content">
          <!-- Controls Section -->
          <div id="manageusersControls" class="manageusers-controls">
            <div class="search-container">
              <span class="left-icon">👥</span>
              <input 
                type="text" 
                id="searchInput" 
                class="search-input" 
                placeholder="Search users..."
              >
            </div>
            <button id="addUsersBtn" class="add-users-btn">Add Users</button>
          </div>

          <!-- Filters Row -->
          <div class="filters-row">
            <div class="filter-group">
              <label class="filter-label">User Type:</label>
              <select id="userTypeFilter" class="filter-select">
                <option value="">All User Types</option>
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
          
          <!-- Users Table -->
          <table id="usersTable" class="users-table">
            <thead>
              <tr>
                <th id="thNo">No</th>
                <th id="thUserType">User Type</th>
                <th id="thUserDept">User Department</th>
                <th id="thUserHandler">User Handler</th>
                <th id="thAction">Action</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              <tr><td colspan="5" style="text-align: center; padding: 40px;">Loading users...</td></tr>
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

customElements.define("manage-users", ManageUsers)