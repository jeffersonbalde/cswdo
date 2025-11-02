class FeaturedStories extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.stories = [];
    this.filteredStories = [];
    this.isLoading = false;
    this.isFiltering = false;
    this.currentPage = 1;
    this.rowsPerPage = 10;
    this.filters = {
      uploadDate: '',
      category: '',
      search: ''
    };
    this.searchTimeout = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.fetchAndRenderStories();
  }

  setupEventListeners() {
    const addBtn = this.shadowRoot.querySelector("#addfeaturesBtn");
    const searchInput = this.shadowRoot.querySelector("#searchInput");
    const editHeaderBtn = this.shadowRoot.querySelector("#editHeaderBtn");
    const uploadDateFilter = this.shadowRoot.querySelector("#uploadDateFilter");
    // const categoryFilter = this.shadowRoot.querySelector("#categoryFilter");
    const resetFiltersBtn = this.shadowRoot.querySelector("#resetFiltersBtn");
    const rowsPerPageSelect = this.shadowRoot.querySelector("#rowsPerPageSelect");

    addBtn.addEventListener("click", () => this.showAddFeaturedstoriesModal());
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
    uploadDateFilter.addEventListener("change", (e) => {
      this.filters.uploadDate = e.target.value;
      this.applyFilters();
    });

    // categoryFilter.addEventListener("change", (e) => {
    //   this.filters.category = e.target.value;
    //   this.applyFilters();
    // });

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
        const storyId = e.target.dataset.storyId;
        this.viewStory(storyId);
      } else if (e.target.classList.contains("btn-edit")) {
        const storyId = e.target.dataset.storyId;
        this.editStory(storyId);
      } else if (e.target.classList.contains("btn-delete")) {
        const storyId = e.target.dataset.storyId;
        this.deleteStory(storyId);
      } else if (e.target.classList.contains("story-image")) {
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
    document.addEventListener("refresh-featuredstories-table", () => {
      console.log("Refresh event received from modal");
      this.refreshTable();
    });
  }

  setLoadingState(loading, message = "Loading stories...") {
    this.isLoading = loading;
    const tableBody = this.shadowRoot.getElementById("featuresTableBody");
    
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
    const tableBody = this.shadowRoot.getElementById("featuresTableBody");
    
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
    if (this.stories.length > 100) {
      this.setFilteringState(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.filteredStories = this.stories.filter(story => {
      // Search filter - check multiple fields
      const matchesSearch = !this.filters.search || 
        (story.title && story.title.toLowerCase().includes(this.filters.search)) ||
        (story.category && story.category.toLowerCase().includes(this.filters.search)) ||
        (story.description && story.description.toLowerCase().includes(this.filters.search)) ||
        (story.storyId && story.storyId.toString().toLowerCase().includes(this.filters.search));
      
      // Upload Date filter
      const matchesDate = !this.filters.uploadDate || 
        (story.uploadDate && story.uploadDate === this.filters.uploadDate);
      
      // Category filter
      const matchesCategory = !this.filters.category || 
        (story.category && story.category === this.filters.category);

      const matches = matchesSearch && matchesDate && matchesCategory;
      
      // Debug log for first few items
      if (this.stories.indexOf(story) < 3) {
        console.log(`Story ${story.storyId}:`, {
          matchesSearch,
          matchesDate,
          matchesCategory,
          matches,
          searchTerm: this.filters.search,
          title: story.title
        });
      }
      
      return matches;
    });

    console.log(`Filtered ${this.filteredStories.length} stories from ${this.stories.length} total`);

    // Add visual feedback for selected filters
    const uploadDateFilter = this.shadowRoot.querySelector("#uploadDateFilter");
    // const categoryFilter = this.shadowRoot.querySelector("#categoryFilter");
    
    if (this.filters.uploadDate) {
      uploadDateFilter.classList.add('has-selection');
    } else {
      uploadDateFilter.classList.remove('has-selection');
    }
    
    // if (this.filters.category) {
    //   categoryFilter.classList.add('has-selection');
    // } else {
    //   categoryFilter.classList.remove('has-selection');
    // }

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
      category: '',
      search: ''
    };
    
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#uploadDateFilter").value = '';
    // this.shadowRoot.querySelector("#categoryFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#uploadDateFilter").classList.remove('has-selection');
    // this.shadowRoot.querySelector("#categoryFilter").classList.remove('has-selection');
    
    this.filteredStories = [...this.stories];
    this.currentPage = 1;
    this.setFilteringState(false);
    this.renderPaginatedTable();
  }

  refreshTable() {
    console.log("Refreshing table data...");
    this.fetchAndRenderStories();
  }

  // updateFilterDropdowns() {
  //   const uploadDateFilter = this.shadowRoot.querySelector("#uploadDateFilter");
  //   const categoryFilter = this.shadowRoot.querySelector("#categoryFilter");
    
  //   // Store current selections
  //   const currentDate = uploadDateFilter.value;
  //   const currentCategory = categoryFilter.value;
    
  //   // Get unique upload dates and categories
  //   const dates = [...new Set(this.stories.map(s => s.uploadDate))].filter(Boolean).sort();
  //   const categories = [...new Set(this.stories.map(s => s.category))].filter(Boolean).sort();
    
  //   // Update upload date dropdown
  //   uploadDateFilter.innerHTML = '<option value="">All Dates</option>';
  //   dates.forEach(date => {
  //     const selected = date === currentDate ? 'selected' : '';
  //     uploadDateFilter.innerHTML += `<option value="${date}" ${selected}>${date}</option>`;
  //   });
    
  //   // Update category dropdown
  //   categoryFilter.innerHTML = '<option value="">All Categories</option>';
  //   categories.forEach(category => {
  //     const selected = category === currentCategory ? 'selected' : '';
  //     categoryFilter.innerHTML += `<option value="${category}" ${selected}>${category}</option>`;
  //   });
    
  //   // Restore visual feedback
  //   if (currentDate) {
  //     uploadDateFilter.classList.add('has-selection');
  //   }
  //   if (currentCategory) {
  //     categoryFilter.classList.add('has-selection');
  //   }
  // }

  updateFilterDropdowns() {
    const uploadDateFilter = this.shadowRoot.querySelector("#uploadDateFilter");
    
    // Store current selection
    const currentDate = uploadDateFilter.value;
    
    // Get unique upload dates and format them
    const dates = [...new Set(this.stories.map(s => s.uploadDate))].filter(Boolean).sort();
    
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
    uploadDateFilter.innerHTML = '<option value="">All Dates</option>';
    dates.forEach(date => {
      const selected = date === currentDate ? 'selected' : '';
      const formattedDate = formatDate(date);
      uploadDateFilter.innerHTML += `<option value="${date}" ${selected}>${formattedDate}</option>`;
    });
    
    // Restore visual feedback
    if (currentDate) {
      uploadDateFilter.classList.add('has-selection');
    }
  } 

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredStories.length / this.rowsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderPaginatedTable();
    }
  }

  renderPaginatedTable() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    const paginatedStories = this.filteredStories.slice(startIndex, endIndex);
    
    this.renderStoriesToTable(paginatedStories);
    this.renderPagination();
  }

  formatDateForDisplay(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  }

  renderStoriesToTable(stories) {
    const tableBody = this.shadowRoot.getElementById("featuresTableBody");
    
    // Don't clear if we're in a loading state
    if (this.isLoading || this.isFiltering) {
      return;
    }
    
    tableBody.innerHTML = "";
    
    if (stories.length === 0) {
      // Check if we have any active filters
      const hasActiveFilters = this.filters.search || this.filters.uploadDate || this.filters.category;
      
      if (hasActiveFilters) {
        // No results found with filters applied
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
              <div class="no-results-container">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">No Results Found</div>
                <div class="no-results-message">
                  No featured stories match your current filter criteria.<br>
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
                <div class="no-results-title">No Featured Stories Available</div>
                <div class="no-results-message">
                  There are currently no featured stories to display.
                </div>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    stories.forEach((story, index) => {
      const row = document.createElement("tr");
      
      // Debug: Log the story data
      console.log(`Story ${story.storyId}:`, {
        title: story.title,
        imagePath: story.imagePath,
        hasImage: !!(story.imagePath && story.imagePath.trim() !== '')
      });

      
      
      // Create image element with proper error handling
      let imageHtml;
      if (story.imagePath && story.imagePath.trim() !== '') {
        imageHtml = `<img src="${story.imagePath}" alt="Story Image" class="story-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'; console.log('Image failed to load:', '${story.imagePath}');">
                     <span class="no-image" style="display: none;">No Image</span>`;
      } else {
        imageHtml = '<span class="no-image">No Image</span>';
      }
      
      row.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${startIndex + index + 1}</td>
        <td style="text-align: center; vertical-align: middle;">${imageHtml}</td>
        <td style="text-align: left; font-weight: 500;">${story.title || 'N/A'}</td>
        <td style="text-align: center;">${this.formatDateForDisplay(story.uploadDate)}</td>
        <td style="text-align: center;">
          <button class="btn-view" data-story-id="${story.storyId}">👁 View</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredStories.length / this.rowsPerPage);
    const paginationContainer = this.shadowRoot.querySelector("#paginationContainer");
    
    let paginationHTML = `
      <div class="pagination-info">
        ${this.getResultsInfo()}
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
    `;

    if (this.filteredStories.length === 0) {
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
    if (this.filteredStories.length === 0) {
      return "1-0 of 0";
    }
    
    const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredStories.length);
    const total = this.filteredStories.length;
    
    return `${startIndex}-${endIndex} of ${total}`;
  }

  async fetchAndRenderStories() {
    this.setLoadingState(true, "Loading featured stories...");
    
    try {
      const res = await fetch("./php_folder/manageFeaturedStories.php", {
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

      if (result.success && Array.isArray(result.featuredstories)) {
        this.stories = result.featuredstories.map(story => ({
          ...story,
          // Map the data to match the expected structure
          storyId: story.featuredstoriesId,
          title: story.featuredstoriesTitle || '',
          description: story.featuredstoriesDescription || '',
          imagePath: story.featuredstoriesPicPath || '',
          uploadDate: story.uploadDate || ''
        }));
        
        console.log("Loaded stories:", this.stories.length);
        
        this.filteredStories = [...this.stories];
        this.setLoadingState(false);
        this.renderPaginatedTable();
        this.updateFilterDropdowns();
      } else {
        this.setLoadingState(false);
        // Handle case where server returns no data
        this.stories = [];
        this.filteredStories = [];
        this.renderPaginatedTable();
        this.showNotification("No featured stories found or failed to load.", "info");
      }
    } catch (err) {
      console.error("⛔ Fetch failed:", err);
      this.setLoadingState(false);
      this.showNotification("Failed to fetch featured stories.", "error");
    }
  }

  addNewStory(story) {
    // Add the new story to the beginning of the array
    this.stories.unshift(story);
    
    // Reset filters to show all stories including the new one
    this.filters = {
      uploadDate: '',
      category: '',
      search: ''
    };
    
    // Clear filter inputs
    this.shadowRoot.querySelector("#searchInput").value = '';
    this.shadowRoot.querySelector("#uploadDateFilter").value = '';
    // this.shadowRoot.querySelector("#categoryFilter").value = '';
    
    // Remove visual feedback classes
    this.shadowRoot.querySelector("#uploadDateFilter").classList.remove('has-selection');
    // this.shadowRoot.querySelector("#categoryFilter").classList.remove('has-selection');
    
    this.filteredStories = [...this.stories];
    this.currentPage = 1;
    this.renderPaginatedTable();
    this.updateFilterDropdowns();
    
    // Show success notification
    this.showNotification("Story added successfully!", "success");
  }

  editHeaderContent() {
    console.log("Edit header content");
    this.showNotification("Header edit functionality", "info");
  }

  async showAddFeaturedstoriesModal() {
    const modal = document.createElement("add-featuredstories-modal");
    modal.addEventListener("featuredstories-saved", (e) => {
      // Map the data to match the expected structure
      const storyData = {
        storyId: e.detail.featuredstories.featuredstoriesId,
        title: e.detail.featuredstories.featuredstoriesTitle,
        description: e.detail.featuredstories.featuredstoriesDescription,
        imagePath: e.detail.featuredstories.featuredstoriesPicPath || '',
        uploadDate: e.detail.featuredstories.uploadDate
      };
      this.addNewStory(storyData);
    });
    document.body.appendChild(modal);
  }

  viewStory(storyId) {
    const modal = document.createElement("view-featuredstories-modal");
    modal.addEventListener("featuredstories-updated", (e) => {
      console.log('Featuredstories-updated event received in featured-stories.js:', e.detail);
      this.updateStory(e.detail.featuredstories);
    });
    document.body.appendChild(modal);
    modal.setFeaturedstoriesId(storyId);
  }

  updateStory(updatedStory) {
    // Find and update the existing story
    const index = this.stories.findIndex(s => s.storyId === updatedStory.featuredstoriesId);
    if (index !== -1) {
      this.stories[index] = { 
        ...this.stories[index], 
        storyId: updatedStory.featuredstoriesId,
        title: updatedStory.featuredstoriesTitle,
        description: updatedStory.featuredstoriesDescription,
        imagePath: updatedStory.featuredstoriesPicPath || this.stories[index].imagePath,
        uploadDate: updatedStory.uploadDate
      };
      
      // Update filtered array as well
      const filteredIndex = this.filteredStories.findIndex(s => s.storyId === updatedStory.featuredstoriesId);
      if (filteredIndex !== -1) {
        this.filteredStories[filteredIndex] = { 
          ...this.filteredStories[filteredIndex], 
          storyId: updatedStory.featuredstoriesId,
          title: updatedStory.featuredstoriesTitle,
          description: updatedStory.featuredstoriesDescription,
          imagePath: updatedStory.featuredstoriesPicPath || this.filteredStories[filteredIndex].imagePath,
          uploadDate: updatedStory.uploadDate
        };
      }
      
      // Re-render the table
      this.renderPaginatedTable();
      
      // Show success notification
      this.showNotification("Featured story updated successfully!", "success");
    }
  }

  editStory(storyId) {
    console.log("Edit story:", storyId);
    this.showNotification("Edit story functionality", "info");
  }

  deleteStory(storyId) {
    console.log("Delete story:", storyId);
    this.showNotification("Delete story functionality", "info");
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
       
        .features-header {
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
        
        .features-header-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        
        .features-header-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
          z-index: 2;
        }
        
        .features-header-content {
          position: relative;
          z-index: 3;
          padding: 20px;
        }
        
        .features-title {
          font-size: 3rem;
          font-weight: bold;
          letter-spacing: 2px;
        }
        
        .features-description {
          max-width: 600px;
          font-size: 14px;
          line-height: 1.6;
        }
    
        .features-content {
          padding: 30px;
          max-width: 100%;
          margin: 0 auto;
        }
        
        .features-controls {
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
        
        .add-features-btn {
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
        
        .add-features-btn:hover {
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
        
        .features-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ea580c;
          margin: 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-collapse: collapse;
        }
        
        .features-table th,
        .features-table td {
          padding: 15px;
          text-align: center;
          border-bottom: none;
        }
        
        .features-table th {
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
        
        .features-table th:first-child {
          border-top-left-radius: 8px;
        }
        
        .features-table th:last-child {
          border-top-right-radius: 8px;
        }
        
        .features-table td {
          font-size: 16px;
          color: #374151;
          padding: 16px 15px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
        }
        
        .features-table tbody tr {
          transition: background-color 0.2s ease;
        }
              
        .features-table tbody tr:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .features-table tbody tr:last-child td {
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

        .story-image {
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

        .story-image:hover {
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
          .features-controls {
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
                    
          .features-title {
            font-size: 2rem;
          }
                    
          .features-content {
            padding: 20px;
          }
                    
          .features-table {
            font-size: 12px;
          }
                    
          .features-table th,
          .features-table td {
            padding: 10px 8px;
          }
          
          .story-image {
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
      
      <div class="features-container">
        <!-- Header Section -->
        <div id="featuresHeader" class="features-header">
          <img id="featuresHeaderImage" src="./imgs/home_bckgrnd.png" alt="Features Background" class="features-header-image">
          <div id="featuresHeaderOverlay" class="features-header-overlay"></div>
          <button id="editHeaderBtn" class="btn btn-warning btn-sm edit-header-btn">✍🏻 Edit</button>
          <div id="featuresHeaderContent" class="features-header-content">
            <h1 id="featuresTitle" class="features-title mb-4">Featured Stories</h1>
            <p id="featuresDescription" class="features-description mb-0">
              The City Social Welfare and Development Office in Pagadian City is mandated to provide social protective and social development services to poor, vulnerable and disadvantaged individuals, families, groups and communities.
            </p>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="features-content">
          <!-- Controls Section -->
          <div id="featuresControls" class="features-controls">
            <div class="search-container">
              <span class="left-icon">🔍</span>
              <input 
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Search stories..."
              >
            </div>
            <button id="addfeaturesBtn" class="add-features-btn">Add Story</button>
          </div>

          <!-- Filters Row -->
          <div class="filters-row">
        
            <div class="filter-group">
              <label class="filter-label">Upload Date:</label>
              <select id="uploadDateFilter" class="filter-select">
                <option value="">All Dates</option>
              </select>
            </div>
            <button id="resetFiltersBtn" class="reset-filters-btn">🔄 Reset Filters</button>
            <button id="refreshBtn" class="refresh-btn">🔃 Refresh</button>
          </div>
          
          <!-- Stories Table -->
          <table id="featuresTable" class="features-table">
            <thead>
              <tr>
                <th id="thNo">No.</th>
                <th id="thImage">Picture</th>
                <th id="thTitle">Title</th>
                <th id="thDate">Date</th>
                <th id="thAction">Action</th>
              </tr>
            </thead>
            <tbody id="featuresTableBody">
              <tr><td colspan="5" style="text-align: center; padding: 40px;">Loading stories...</td></tr>
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

customElements.define("featured-stories", FeaturedStories);