class FeedbacksView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.feedbacks = [];
    this.filteredFeedbacks = [];
    this.isLoading = false;
    this.isFiltering = false;
    this.currentPage = 1;
    this.rowsPerPage = 10;
    this.filters = {
      baranggay: '',
      satisfaction: '',
      date: '',
      search: ''
    };
    this.searchTimeout = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.fetchAndRenderFeedbacks();
  }

  setupEventListeners() {
    const feedbackReportBtn = this.shadowRoot.querySelector("#feedbackReportBtn");
    const searchInput = this.shadowRoot.querySelector("#searchInput");
    const baranggayFilter = this.shadowRoot.querySelector("#baranggayFilter");
    const satisfactionFilter = this.shadowRoot.querySelector("#satisfactionFilter");
    const dateFilter = this.shadowRoot.querySelector("#dateFilter");
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn");
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect");

    feedbackReportBtn.addEventListener("click", () => this.generateFeedbackReport());
    
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
    baranggayFilter.addEventListener("change", (e) => {
      this.filters.baranggay = e.target.value;
      this.applyFilters();
    });

    satisfactionFilter.addEventListener("change", (e) => {
      this.filters.satisfaction = e.target.value;
      this.applyFilters();
    });

    dateFilter.addEventListener("change", (e) => {
      this.filters.date = e.target.value;
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
        const feedbackId = e.target.dataset.feedbackId;
        this.viewFeedback(feedbackId);
      } else if (e.target.classList.contains("feedback-image")) {
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
  }

  setLoadingState(loading, message = "Loading feedbacks...") {
    this.isLoading = loading;
    const tableBody = this.shadowRoot.getElementById("feedbacksTableBody");
    
    if (loading) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px;">
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
    const tableBody = this.shadowRoot.getElementById("feedbacksTableBody");
    
    if (filtering) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px;">
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
    if (this.feedbacks.length > 100) {
      this.setFilteringState(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.filteredFeedbacks = this.feedbacks.filter(feedback => {
      // Get formatted date once for this feedback
      const formattedDate = this.formatDateForDisplay(feedback.feedback_date);
      
      // Search filter - check multiple fields
      const matchesSearch = !this.filters.search || 
        (feedback.feedback_baranggay && feedback.feedback_baranggay.toLowerCase().includes(this.filters.search)) ||
        (feedback.feedback_satisfaction && feedback.feedback_satisfaction.toLowerCase().includes(this.filters.search)) ||
        (feedback.feedback_visit && feedback.feedback_visit.toLowerCase().includes(this.filters.search)) ||
        (formattedDate && formattedDate.toLowerCase().includes(this.filters.search)) ||
        (feedback.feedback_recommend && feedback.feedback_recommend.toLowerCase().includes(this.filters.search)) ||
        (feedback.feedback_id && feedback.feedback_id.toString().toLowerCase().includes(this.filters.search));
      
      // Baranggay filter
      const matchesBaranggay = !this.filters.baranggay || 
        (feedback.feedback_baranggay && feedback.feedback_baranggay.toLowerCase().includes(this.filters.baranggay.toLowerCase()));
      
      // Satisfaction filter
      const matchesSatisfaction = !this.filters.satisfaction || 
        (feedback.feedback_satisfaction && feedback.feedback_satisfaction.toString() === this.filters.satisfaction);
      
      // Date filter
      const matchesDate = !this.filters.date || 
        (formattedDate && formattedDate.toLowerCase().includes(this.filters.date.toLowerCase()));

      const matches = matchesSearch && matchesBaranggay && matchesSatisfaction && matchesDate;
      
      // Debug log for first few items
      if (this.feedbacks.indexOf(feedback) < 3) {
        console.log(`Feedback ${feedback.feedback_id}:`, {
          matchesSearch,
          matchesBaranggay,
          matchesSatisfaction,
          matchesDate,
          matches,
          searchTerm: this.filters.search,
          feedback_baranggay: feedback.feedback_baranggay
        });
      }
      
      return matches;
    });

    console.log(`Filtered ${this.filteredFeedbacks.length} feedbacks from ${this.feedbacks.length} total`);

    // Add visual feedback for selected filters
    const baranggayFilter = this.shadowRoot.querySelector("#baranggayFilter");
    const satisfactionFilter = this.shadowRoot.querySelector("#satisfactionFilter");
    const dateFilter = this.shadowRoot.querySelector("#dateFilter");
    
    if (this.filters.baranggay) {
      baranggayFilter.classList.add('has-selection');
    } else {
      baranggayFilter.classList.remove('has-selection');
    }
    
    if (this.filters.satisfaction) {
      satisfactionFilter.classList.add('has-selection');
    } else {
      satisfactionFilter.classList.remove('has-selection');
    }
    
    if (this.filters.date) {
      dateFilter.classList.add('has-selection');
    } else {
      dateFilter.classList.remove('has-selection');
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
      baranggay: '',
      satisfaction: '',
      date: '',
      search: ''
    };
    
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#baranggayFilter").value = '';
    this.shadowRoot.querySelector("#satisfactionFilter").value = '';
    this.shadowRoot.querySelector("#dateFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#baranggayFilter").classList.remove('has-selection');
    this.shadowRoot.querySelector("#satisfactionFilter").classList.remove('has-selection');
    this.shadowRoot.querySelector("#dateFilter").classList.remove('has-selection');
    
    this.filteredFeedbacks = [...this.feedbacks];
    this.currentPage = 1;
    this.setFilteringState(false);
    this.renderPaginatedTable();
  }

  refreshTable() {
    console.log("Refreshing table data...");
    this.fetchAndRenderFeedbacks();
  }

  updateFilterDropdowns() {
    const baranggayFilter = this.shadowRoot.querySelector("#baranggayFilter");
    const satisfactionFilter = this.shadowRoot.querySelector("#satisfactionFilter");
    const dateFilter = this.shadowRoot.querySelector("#dateFilter");
    
    // Store current selections
    const currentBaranggay = baranggayFilter.value;
    const currentSatisfaction = satisfactionFilter.value;
    const currentDate = dateFilter.value;
    
    // Get unique baranggays
    const baranggays = [...new Set(this.feedbacks.map(f => f.feedback_baranggay))].filter(Boolean).sort();
    
    // Get unique satisfaction ratings
    const satisfactions = [...new Set(this.feedbacks.map(f => f.feedback_satisfaction))].filter(Boolean).sort();
    
    // Get unique dates and format them for display
    const dates = [...new Set(this.feedbacks.map(f => this.formatDateForDisplay(f.feedback_date)))].filter(date => date !== 'N/A' && date !== 'Invalid Date').sort();
    
    // Update baranggay dropdown
    baranggayFilter.innerHTML = '<option value="">All Baranggays</option>';
    baranggays.forEach(baranggay => {
      const selected = baranggay === currentBaranggay ? 'selected' : '';
      baranggayFilter.innerHTML += `<option value="${baranggay}" ${selected}>${baranggay}</option>`;
    });
    
    // Update satisfaction dropdown
    satisfactionFilter.innerHTML = '<option value="">All Ratings</option>';
    satisfactions.forEach(rating => {
      const selected = rating.toString() === currentSatisfaction ? 'selected' : '';
      satisfactionFilter.innerHTML += `<option value="${rating}" ${selected}>${rating} Star${rating !== '1' ? 's' : ''}</option>`;
    });
    
    // Update date dropdown
    dateFilter.innerHTML = '<option value="">All Dates</option>';
    dates.forEach(date => {
      const selected = date === currentDate ? 'selected' : '';
      dateFilter.innerHTML += `<option value="${date}" ${selected}>${date}</option>`;
    });
    
    // Restore visual feedback
    if (currentBaranggay) {
      baranggayFilter.classList.add('has-selection');
    }
    if (currentSatisfaction) {
      satisfactionFilter.classList.add('has-selection');
    }
    if (currentDate) {
      dateFilter.classList.add('has-selection');
    }
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredFeedbacks.length / this.rowsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderPaginatedTable();
    }
  }

  renderPaginatedTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const paginatedFeedbacks = this.filteredFeedbacks.slice(startIndex, endIndex);
    
    this.renderFeedbacksToTable(paginatedFeedbacks);
    this.renderPagination();
  }

  renderFeedbacksToTable(feedbacks) {
    const tableBody = this.shadowRoot.getElementById("feedbacksTableBody");
    
    // Don't clear if we're in a loading state
    if (this.isLoading || this.isFiltering) {
      return;
    }
    
    tableBody.innerHTML = "";
    
    if (feedbacks.length === 0) {
      // Check if we have any active filters
      const hasActiveFilters = this.filters.search || this.filters.baranggay || this.filters.satisfaction || this.filters.date;
      
      if (hasActiveFilters) {
        // No results found with filters applied
        tableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">No Results Found</div>
                <div class="no-results-message">
                  No feedbacks match your current filter criteria.<br>
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
            <td colspan="8" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">📋</div>
                <div class="no-results-title">No Feedbacks Available</div>
                <div class="no-results-message">
                  There are currently no feedbacks to display.
                </div>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    feedbacks.forEach((feedback, index) => {
      const row = document.createElement("tr");
      
      // Debug: Log the feedback data
      console.log(`Feedback ${feedback.feedback_id}:`, {
        barangay: feedback.feedback_baranggay,
        satisfaction: feedback.feedback_satisfaction,
        visit: feedback.feedback_visit,
        looking: feedback.feedback_looking,
        recommend: feedback.feedback_recommend,
        date: feedback.feedback_date
      });
      
      // Truncate long recommendations for table display
      const recommendations = feedback.feedback_recommend || 'N/A';
      const truncatedRecommendations = recommendations.length > 50 ? 
        recommendations.substring(0, 50) + '...' : recommendations;
      
      row.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${startIndex + index + 1}</td>
        <td style="text-align: center; font-weight: 500;">${feedback.feedback_baranggay || 'N/A'}</td>
        <td style="text-align: center;">
          <span class="satisfaction-rating" style="background-color: ${this.getSatisfactionColor(feedback.feedback_satisfaction)}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
            ${feedback.feedback_satisfaction || 'N/A'}
          </span>
        </td>
        <td style="text-align: left; font-size: 0.9em;">${feedback.feedback_visit || 'N/A'}</td>
        <td style="text-align: center; font-size: 0.9em;">${this.formatDateForDisplay(feedback.feedback_date)}</td>
     
       
        <td style="text-align: center;">
          <button class="btn-view" data-feedback-id="${feedback.feedback_id}" >
          👁 View
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  getSatisfactionColor(rating) {
    switch(rating) {
      case '5': return '#10b981'; // Green
      case '4': return '#34d399'; // Light green
      case '3': return '#fbbf24'; // Yellow
      case '2': return '#f59e0b'; // Orange
      case '1': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  }

  formatDateForDisplay(dateString) {
    if (!dateString || dateString === '0000-00-00' || dateString === 'N/A') {
      return 'N/A';
    }
    
    try {
      // Handle database date format (YYYY-MM-DD) or already formatted date
      if (dateString.includes(',')) {
        // Already in formatted format (e.g., "September 4, 2025")
        return dateString;
      } else {
        // Database format (e.g., "2025-09-04")
        const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else {
          return 'Invalid Date';
        }
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredFeedbacks.length / this.rowsPerPage);
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer");
    
    let paginationHTML = `
      <div class="pagination-info">
        ${this.getResultsInfo()}
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
    `;

    if (this.filteredFeedbacks.length === 0) {
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
    if (this.filteredFeedbacks.length === 0) {
      return "1-0 of 0";
    }
    
    const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredFeedbacks.length);
    const total = this.filteredFeedbacks.length;
    
    return `${startIndex}-${endIndex} of ${total}`;
  }

  async fetchAndRenderFeedbacks() {
    this.setLoadingState(true, "Loading feedbacks...");
    
    try {
      console.log("🚀 Starting fetch request to manageFeedbacks.php");
      
      const res = await fetch("./php_folder/manageFeedbacks.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetchdata" }),
      });
      
      console.log("📡 Response status:", res.status);
      console.log("📡 Response ok:", res.ok);
      console.log("📡 Response headers:", res.headers);
      
      const text = await res.text();
      console.log("🪵 Raw response from PHP:", text);
      
      let result;
      try {
        if (!text || text.trim() === '') {
          console.error("⛔ Empty response from server");
          this.showNotification("Server returned empty response.", "error");
          this.setLoadingState(false);
          return;
        }
        result = JSON.parse(text);
      } catch (err) {
        console.error("⛔ Invalid JSON from server:", text);
        console.error("⛔ Parse error:", err);
        this.showNotification("Server returned invalid response.", "error");
        this.setLoadingState(false);
        return;
      }

      console.log("🔍 Parsed result:", result);
      console.log("🔍 Result success:", result.success);
      console.log("🔍 Result data:", result.data);
      console.log("🔍 Is array:", Array.isArray(result.data));
      console.log("🔍 Data length:", result.data ? result.data.length : 'no data');
      
      if (result.success && Array.isArray(result.data)) {
        console.log("✅ Processing feedbacks data...");
        this.feedbacks = result.data.map(feedback => ({
          ...feedback,
          // Ensure all fields exist for search
          feedback_baranggay: feedback.feedback_baranggay || '',
          feedback_satisfaction: feedback.feedback_satisfaction || '',
          feedback_visit: feedback.feedback_visit || '',
          feedback_looking: feedback.feedback_looking || '',
          feedback_recommend: feedback.feedback_recommend || '',
          feedback_id: feedback.feedback_id || ''
        }));
        
        console.log("✅ Loaded feedbacks:", this.feedbacks.length);
        console.log("✅ First feedback sample:", this.feedbacks[0]);
        
        this.filteredFeedbacks = [...this.feedbacks];
        this.setLoadingState(false);
        this.renderPaginatedTable();
        this.updateFilterDropdowns();
      } else {
        console.log("❌ Failed to load feedbacks. Success:", result.success, "Data:", result.data);
        this.setLoadingState(false);
        // Handle case where server returns no data
        this.feedbacks = [];
        this.filteredFeedbacks = [];
        this.renderPaginatedTable();
        this.showNotification("No feedbacks found or failed to load.", "info");
      }
    } catch (err) {
      console.error("⛔ Fetch failed:", err);
      this.setLoadingState(false);
      this.showNotification("Failed to fetch feedbacks.", "error");
    }
  }

  generateFeedbackReport() {
    // Implement feedback report generation
    this.showNotification("Generating feedback report...", "info");
  }

  viewFeedback(feedbackId) {
    // Find the feedback data
    const feedback = this.feedbacks.find(f => f.feedback_id == feedbackId);
    if (!feedback) {
      this.showNotification("Feedback not found.", "error");
      return;
    }
    
    console.log("Viewing feedback:", feedback);
    
    // Create and open the view feedback modal
    const viewModal = document.createElement("view-feedbacks-modal");
    document.body.appendChild(viewModal);
    
    // Load the feedback data into the modal
    viewModal.loadFeedbackData(feedbackId);
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
        type === "success" ? "background: #10b981;" : type === "error" ? "background: #ef4444;" : "background: #3b82f6;"
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
          background: #A8D5BA;
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

        .feedback-image {
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

        .feedback-image:hover {
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
          
          .feedback-image {
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
      
      <div class="feedbacks-container">
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
                placeholder="Search feedbacks..."
              >
            </div>
            <button id="feedbackReportBtn" class="feedback-report-btn">Generate Report</button>
          </div>

          <!-- Filters Row -->
          <div class="filters-row">
            <div class="filter-group">
              <label class="filter-label">Baranggay:</label>
              <select id="baranggayFilter" class="filter-select">
                <option value="">All Baranggays</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Satisfaction:</label>
              <select id="satisfactionFilter" class="filter-select">
                <option value="">All Ratings</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Date:</label>
              <select id="dateFilter" class="filter-select">
                <option value="">All Dates</option>
              </select>
            </div>
            <button id="resetFiltersBtn" class="reset-filters-btn">🔄 Reset Filters</button>
            <button id="refreshBtn" class="refresh-btn">🔃 Refresh</button>
          </div>
          
          <!-- Feedbacks Table -->
          <table id="feedbacksTable" class="feedbacks-table">
            <thead>
              <tr>
                <th id="thNo">No.</th>
                <th id="thBarangay">Barangay</th>
                <th id="thSatisfaction">Satisfaction</th>
                <th id="thVisit">Visit Purpose</th>
                <th id="thDate">Date</th>
               
              
                <th id="thActions">Actions</th>
              </tr>
            </thead>
            <tbody id="feedbacksTableBody">
              <tr><td colspan="8" style="text-align: center; padding: 40px;">Loading feedbacks...</td></tr>
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

customElements.define("feedbacks-view", FeedbacksView);