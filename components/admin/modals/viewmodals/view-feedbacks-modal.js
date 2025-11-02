class ViewFeedbacksModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.feedbackData = null;
  }

  async connectedCallback() {
    this.render();
    this.initializeElements();
    this.initEventListeners();
    this.openModal();
  }

  disconnectedCallback() {
    // Clean up when modal is removed
    document.body.style.overflow = "";
  }

  initializeElements() {
    // Initialize DOM elements after render
    this.modal = this.shadowRoot.getElementById("viewFeedbackModal");
    this.closeBtn = this.shadowRoot.getElementById("closeViewModal");
    this.cancelBtn = this.shadowRoot.getElementById("cancelViewBtn");
    
    // Data display elements
    this.feedbackId = this.shadowRoot.getElementById("feedbackId");
    this.barangay = this.shadowRoot.getElementById("barangay");
    this.satisfaction = this.shadowRoot.getElementById("satisfaction");
    this.visitPurpose = this.shadowRoot.getElementById("visitPurpose");
    this.foundInfo = this.shadowRoot.getElementById("foundInfo");
    this.recommendations = this.shadowRoot.getElementById("recommendations");
    this.feedbackDate = this.shadowRoot.getElementById("feedbackDate");
  }

  initEventListeners() {
    // Close modal events
    this.closeBtn.addEventListener("click", () => {
      this.closeModal();
    });
    
    this.cancelBtn.addEventListener("click", () => {
      this.closeModal();
    });
    
    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
    
    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) {
        this.closeModal();
      }
    });
  }

  async loadFeedbackData(feedbackId) {
    try {
      console.log("Loading feedback data for ID:", feedbackId);
      
      const response = await fetch("./php_folder/manageFeedbacks.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "getFeedbackById",
          feedback_id: feedbackId 
        }),
      });

      const text = await response.text();
      console.log("Raw response from PHP:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON from server:", text);
        this.showError("Server returned invalid response.");
        return;
      }

      if (result.success && result.data) {
        this.feedbackData = result.data;
        this.populateModal();
      } else {
        console.error("Failed to load feedback:", result.message);
        this.showError(result.message || "Failed to load feedback data.");
      }
    } catch (err) {
      console.error("Error loading feedback:", err);
      this.showError("Failed to load feedback data.");
    }
  }

  populateModal() {
    if (!this.feedbackData) return;

    // Populate all fields with the feedback data
    this.feedbackId.value = this.feedbackData.feedback_id || 'N/A';
    this.barangay.value = this.feedbackData.feedback_baranggay || 'N/A';
    this.satisfaction.value = this.feedbackData.feedback_satisfaction || 'N/A';
    this.visitPurpose.value = this.feedbackData.feedback_visit || 'N/A';
    this.foundInfo.value = this.feedbackData.feedback_looking || 'N/A';
    this.recommendations.value = this.feedbackData.feedback_recommend || 'N/A';
    
    // Format date if available
    if (this.feedbackData.feedback_date) {
      // If the date is already in the correct format (e.g., "September 4, 2025"), use it directly
      // Otherwise, parse it and format it
      if (this.feedbackData.feedback_date.includes(',')) {
        this.feedbackDate.value = this.feedbackData.feedback_date;
      } else {
        const date = new Date(this.feedbackData.feedback_date);
        this.feedbackDate.value = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } else {
      this.feedbackDate.value = 'N/A';
    }
  }

  openModal() {
    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    this.modal.classList.remove("show");
    document.body.style.overflow = "";
    // Remove the modal from DOM
    this.remove();
  }

  showError(message) {
    // Create and show error notification
    const notification = document.createElement("div");
    notification.className = "notification error";
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
      background: #ef4444;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        .modal {
          display: none;
          position: fixed;
          z-index: 1055;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          box-sizing: border-box;
        }
        .modal.show {
          display: flex;
        }
        .modal-dialog {
          max-width: 800px;
          width: 100%;
          position: relative;
        }
        .modal-content {
          background-color: white;
          border: 2px solid #ea580c;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-bg-logo {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: url('./imgs/CSWDO Pags Logo.png') no-repeat center center;
          background-size: 60%;
          opacity: 0.08;
          z-index: 11;
          pointer-events: none;
        }
        .modal-header,
        .modal-body,
        .modal-footer {
          position: relative;
          z-index: 10;
          background-color: rgba(255, 255, 255, 0.95);
        }
        .modal-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .modal-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #374151;
          flex: 1;
        }
        .btn-close {
          position: absolute;
          top: 50%;
          right: 1rem;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.75rem;
          cursor: pointer;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          z-index: 20;
        }
        .btn-close:hover {
          background-color: #f3f4f6;
        }
        .modal-body {
          padding: 1.5rem 1rem;
          position: relative;
          z-index: 10;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }
        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ea580c;
          border-radius: 6px;
          font-size: 1rem;
          color: #374151;
          background-color: #f9fafb !important;
          cursor: not-allowed;
        }
        .form-control:focus {
          outline: none;
          border-color: #c2410c;
          box-shadow: 0 0 0 2px rgba(194, 65, 12, 0.1);
        }
        .form-control.textarea {
          resize: none;
          font-family: inherit;
          min-height: 100px;
        }
        .modal-footer {
          padding: 1rem;
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 10;
        }
        .btn {
          padding: 0.75rem 2rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }
        .btn-secondary:hover {
          background-color: #4b5563;
          transform: translateY(-1px);
        }
        .satisfaction-display {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          color: white;
          text-align: center;
          min-width: 60px;
        }
        .satisfaction-5 { background-color: #10b981; }
        .satisfaction-4 { background-color: #34d399; }
        .satisfaction-3 { background-color: #fbbf24; }
        .satisfaction-2 { background-color: #f59e0b; }
        .satisfaction-1 { background-color: #ef4444; }
        .found-info-display {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          color: white;
          text-align: center;
          min-width: 60px;
        }
        .found-yes { background-color: #10b981; }
        .found-no { background-color: #ef4444; }
        
        /* Tablet styles */
        @media (min-width: 768px) {
          .modal {
            padding: 2rem;
          }
          .modal-dialog {
            max-width: 700px;
          }
          .modal-content {
            max-height: none;
            overflow-y: visible;
          }
          .modal-body {
            padding: 2rem;
          }
        }
        
        /* Desktop styles */
        @media (min-width: 1024px) {
          .modal-dialog {
            max-width: 800px;
          }

           .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
        }
        
        /* Mobile styles */
        @media (max-width: 767px) {
          .modal {
            padding: 0.5rem;
          }
          .modal-content {
            max-height: 95vh;
            margin: 0.25rem;
          }
          .modal-body {
            padding: 1rem 0.5rem;
          }
          .form-control {
            font-size: 0.95rem;
            padding: 0.625rem;
          }
          .form-label {
            font-size: 0.9rem;
          }
          .modal-title {
            font-size: 1.25rem;
          }
        }
      </style>
      
      <div id="viewFeedbackModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 class="modal-title">View Feedback Details</h5>
              <button type="button" id="closeViewModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">


            <div class="form-row">
              <div class="form-group">
                <label for="feedbackId" class="form-label">Feedback ID</label>
                <input type="text" id="feedbackId" class="form-control" readonly>
              </div>
                 

                    <div class="form-group">
                <label for="barangay" class="form-label">Barangay</label>
                <input type="text" id="barangay" class="form-control" readonly>
              </div>
              
</div>

         <div class="form-row">

              <div class="form-group">
                <label for="satisfaction" class="form-label">Satisfaction Rating</label>
                <input type="text" id="satisfaction" class="form-control" readonly>
              </div>
                 

      <div class="form-group">
                <label for="feedbackDate" class="form-label">Date Submitted</label>
                <input type="text" id="feedbackDate" class="form-control" readonly>
              </div>
             

              </div>
              
              <div class="form-group">
                <label for="visitPurpose" class="form-label">Purpose of Visit</label>
                <textarea id="visitPurpose" class="form-control textarea" readonly></textarea>
              </div>
              
              <div class="form-group">
                <label for="foundInfo" class="form-label">Found Information</label>
                <input type="text" id="foundInfo" class="form-control" readonly>
              </div>
              
              <div class="form-group">
                <label for="recommendations" class="form-label">Recommendations</label>
                <textarea id="recommendations" class="form-control textarea" readonly></textarea>
              </div>
              
        
            </div>
            <div class="modal-footer">
              <button type="button" id="cancelViewBtn" class="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("view-feedbacks-modal", ViewFeedbacksModal);
