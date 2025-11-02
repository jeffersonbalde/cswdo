class FeedbackModal extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.loadingState = null; // Reference to loading state component
    this.shadowRoot.innerHTML = `
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        /* Mobile-first base styles */
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
          width: 100%;
          max-width: 100%;
          margin: 0;
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
          background-size: 70%;
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
          text-align: center;
        }
        .form-label {
          display: block;
          margin-bottom: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          text-align: center;
        }
        .form-control {
          width: 100%;
          padding: 0.875rem;
          border: 2px solid #ea580c;
          border-radius: 6px;
          font-size: 1.125rem;
          color: black;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          background-color: white !important;
          text-align: center;
        }
                 .form-control:focus {
           outline: none;
           border-color: #c2410c;
           box-shadow: 0 0 0 2px #c2410c;
           background-color: white !important;
         }
         
         /* Disable browser default validation styling */
         .form-control:invalid {
           border-color: #ea580c !important;
           box-shadow: none !important;
         }
         
         .form-control:valid {
           border-color: #ea580c !important;
           box-shadow: none !important;
         }
        .form-control.textarea {
          resize: none;
          font-family: inherit;
          background-color: white !important;
          text-align: left;
        }
        
        /* Enhanced dropdown styling */
        select.form-control {
          cursor: pointer;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ea580c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
          padding-right: 2.5rem;
          transition: all 0.3s ease;
        }
        
        select.form-control:hover {
          border-color: #c2410c;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.15);
          transform: translateY(-1px);
        }
        
        /* Dropdown options styling */
        select.form-control option {
          padding: 0.75rem;
          margin: 0.25rem 0;
          border-radius: 4px;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f0f0f0;
        }
        
        select.form-control option:checked {
          background: linear-gradient(135deg, #ea580c, #c2410c);
          color: white;
          font-weight: 600;
        }
        
        select.form-control option:hover {
          background-color: rgba(234, 88, 12, 0.1);
        }
        .radio-group, .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
          align-items: center;
        }
        .radio-item, .checkbox-item {
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
          padding-left: 40px;
          min-width: 90px;
          justify-content: center;
        }
        .radio-item input[type="radio"],
        .checkbox-item input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 24px;
          width: 24px;
          background-color: white;
          border: 2px solid #ea580c;
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        .radio-item input[type="radio"] + .checkmark {
          border-radius: 4px;
        }
        .radio-item input[type="radio"]:checked + .checkmark,
        .checkbox-item input[type="checkbox"]:checked + .checkmark {
          background-color: #ea580c;
          border-color: #ea580c;
        }
        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }
        .radio-item input[type="radio"]:checked + .checkmark:after,
        .checkbox-item input[type="checkbox"]:checked + .checkmark:after {
          display: block;
        }
        .radio-item .checkmark:after {
          top: 6px;
          left: 6px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
        }
        .checkbox-item .checkmark:after {
          left: 6px;
          top: 3px;
          width: 7px;
          height: 14px;
          border: solid white;
          border-width: 0 3px 3px 0;
          border-color: white;
          transform: rotate(45deg);
        }
        .radio-item label, .checkbox-item label {
          font-weight: 500;
          margin-bottom: 0;
          color: #374151;
          font-size: 1.125rem;
        }
        .modal-footer {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
          z-index: 10;
        }
        .btn {
          width: 100%;
          padding: 1rem 1.25rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-size: 1.125rem;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background-color: #ea580c;
          color: white;
        }
        .btn-primary:hover {
          background-color: #c2410c;
          transform: translateY(-1px);
        }
        .btn-secondary {
          background-color: transparent;
          color: #374151;
          border: 2px solid #9ca3af;
        }
        .btn-secondary:hover {
          background-color: #f9fafb;
          transform: translateY(-1px);
        }
        .modal-subtitle {
          text-align: center;
          color: #6b7280;
          font-size: 1.125rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        
        /* Tablet styles */
        @media (min-width: 768px) {
          .modal {
            padding: 2rem;
          }
          .modal-dialog {
            max-width: 600px;
          }
          .modal-content {
            max-height: none;
            overflow-y: visible;
          }
          .modal-body {
            padding: 2rem;
          }
          .radio-group, .checkbox-group {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
          }
          .radio-item, .checkbox-item {
            min-width: 60px;
          }
          .modal-footer {
            flex-direction: row;
            gap: 1rem;
          }
          .btn {
            width: auto;
            flex: 1;
            padding: 0.875rem 1rem;
            font-size: 1rem;
          }
          .modal-title {
            font-size: 1.25rem;
          }
          .form-label {
            font-size: 1rem;
          }
          .form-control {
            font-size: 1rem;
            padding: 0.75rem;
          }
          .radio-item label, .checkbox-item label {
            font-size: 1rem;
          }
          .modal-subtitle {
            font-size: 1rem;
          }
        }
        
        /* Desktop styles */
        @media (min-width: 1024px) {
          .modal-dialog {
            max-width: 700px;
          }
          .modal-content {
            max-height: none;
            overflow-y: visible;
          }
          .form-control {
            font-size: 1rem;
          }
          .radio-group, .checkbox-group {
            gap: 1.5rem;
          }
        }
        
        /* Large screen styles */
        @media (min-width: 1200px) {
          .modal-dialog {
            max-width: 800px;
          }
        }

        /* Mobile-specific dropdown styling */
        @media (max-width: 767px) {
          .form-control {
            font-size: 1rem;
            padding: 0.75rem;
            padding-right: 2.25rem;
          }
          
          /* Ensure dropdown doesn't overflow on mobile */
          select.form-control {
            max-height: 200px;
            overflow-y: auto;
            /* Hide scrollbar but keep scroll functionality */
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
          }
          
          /* Hide scrollbar for WebKit browsers (Chrome, Safari, Edge) */
          select.form-control::-webkit-scrollbar {
            display: none;
          }
          
          /* Mobile dropdown options styling */
          select.form-control option {
            font-size: 0.95rem;
            padding: 0.5rem;
            line-height: 1.4;
          }
          
          /* Prevent modal content overflow on mobile */
          .modal-content {
            max-height: 95vh;
            margin: 0.5rem;
          }
          
          /* Ensure form groups don't cause overflow */
          .form-group {
            margin-bottom: 1.25rem;
          }
          
          /* Optimize spacing for mobile */
          .modal-body {
            padding: 1.25rem 0.75rem;
          }
          
          /* Better mobile button sizing */
          .btn {
            padding: 0.875rem 1rem;
            font-size: 1rem;
          }
        }
        
        /* Extra small mobile devices */
        @media (max-width: 480px) {
          .modal {
            padding: 0.5rem;
          }
          
          .modal-content {
            max-height: 98vh;
            margin: 0.25rem;
          }
          
          .modal-body {
            padding: 1rem 0.5rem;
          }
          
          .form-control {
            font-size: 0.95rem;
            padding: 0.625rem;
            padding-right: 2rem;
          }
          
          .form-label {
            font-size: 1rem;
            margin-bottom: 0.5rem;
          }
          
          .modal-title {
            font-size: 1.25rem;
          }
        }
      </style>
      <div id="feedbackModal" class="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-bg-logo"></div>
            <div class="modal-header">
              <h5 class="modal-title">Feedback</h5>
              <button type="button" id="closeFeedbackModal" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
              <p class="modal-subtitle">We value your opinion! Please take a moment to let us know how we can improve your experience on our city website.</p>
              
              <form id="feedbackForm">
                <div class="form-group">
                  <label for="barangay" class="form-label">Baranggay</label>
                                     <select id="barangay" name="barangay" class="form-control">
                    <option value="">Select Baranggay</option>
                    <option value="Alegria">Alegria</option>
                    <option value="Balangasan">Balangasan</option>
                    <option value="Balintawak">Balintawak</option>
                    <option value="Baloyboan">Baloyboan</option>
                    <option value="Banale">Banale</option>
                    <option value="Bogo">Bogo</option>
                    <option value="Bomba">Bomba</option>
                    <option value="Buenavista">Buenavista</option>
                    <option value="Bulatok">Bulatok</option>
                    <option value="Bulawan">Bulawan</option>
                    <option value="Dampalan">Dampalan</option>
                    <option value="Danlugan">Danlugan</option>
                    <option value="Dao">Dao</option>
                    <option value="Datagan">Datagan</option>
                    <option value="Deborok">Deborok</option>
                    <option value="Ditoray">Ditoray</option>
                    <option value="Dumagoc">Dumagoc</option>
                    <option value="Gatas">Gatas</option>
                    <option value="Gubac">Gubac</option>
                    <option value="Gubang">Gubang</option>
                    <option value="Kagawasan">Kagawasan</option>
                    <option value="Kahayagan">Kahayagan</option>
                    <option value="Kalasan">Kalasan</option>
                    <option value="Kawit">Kawit</option>
                    <option value="La Suerte">La Suerte</option>
                    <option value="Lala">Lala</option>
                    <option value="Lapidian">Lapidian</option>
                    <option value="Lenienza">Lenienza</option>
                    <option value="Lizon Valley">Lizon Valley</option>
                    <option value="Lourdes">Lourdes</option>
                    <option value="Lower Sibatang">Lower Sibatang</option>
                    <option value="Lumad">Lumad</option>
                    <option value="Lumbia">Lumbia</option>
                    <option value="Macasing">Macasing</option>
                    <option value="Manga">Manga</option>
                    <option value="Muricay">Muricay</option>
                    <option value="Napolan">Napolan</option>
                    <option value="Palpalan">Palpalan</option>
                    <option value="Pedulonan">Pedulonan</option>
                    <option value="Poloyagan">Poloyagan</option>
                    <option value="San Francisco">San Francisco</option>
                    <option value="San Jose">San Jose</option>
                    <option value="San Pedro">San Pedro</option>
                    <option value="Santa Lucia">Santa Lucia</option>
                    <option value="Santa Maria">Santa Maria</option>
                    <option value="Santiago">Santiago</option>
                    <option value="Santo Niño">Santo Niño</option>
                    <option value="Tawagan Sur">Tawagan Sur</option>
                    <option value="Tiguma">Tiguma</option>
                    <option value="Tuburan">Tuburan</option>
                    <option value="Tulangan">Tulangan</option>
                    <option value="Tulawas">Tulawas</option>
                    <option value="Upper Sibatang">Upper Sibatang</option>
                    <option value="White Beach">White Beach</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">How would you rate your satisfaction to our website?</label>
                  <div class="radio-group">
                    <label class="radio-item">
                                             <input type="radio" name="satisfaction" value="5">
                      <span class="checkmark"></span>
                      5
                    </label>
                    <label class="radio-item">
                      <input type="radio" name="satisfaction" value="4">
                      <span class="checkmark"></span>
                      4
                    </label>
                    <label class="radio-item">
                      <input type="radio" name="satisfaction" value="3">
                      <span class="checkmark"></span>
                      3
                    </label>
                    <label class="radio-item">
                      <input type="radio" name="satisfaction" value="2">
                      <span class="checkmark"></span>
                      2
                    </label>
                    <label class="radio-item">
                      <input type="radio" name="satisfaction" value="1">
                      <span class="checkmark"></span>
                      1
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">What were you looking for in visiting this website?</label>
                  <div class="checkbox-group">
                    <label class="checkbox-item">
                      <input type="checkbox" name="purpose" value="Available Services">
                      <span class="checkmark"></span>
                      Available Services
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" name="purpose" value="News and Updates">
                      <span class="checkmark"></span>
                      News and Updates
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" name="purpose" value="Ordinances">
                      <span class="checkmark"></span>
                      Ordinances
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" name="purpose" value="Featured Stories">
                      <span class="checkmark"></span>
                      Featured Stories
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" name="purpose" value="About CSWDO">
                      <span class="checkmark"></span>
                      About CSWDO
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Did you find what you are looking for?</label>
                  <div class="radio-group">
                    <label class="radio-item">
                      <input type="radio" name="found_info" value="Yes">
                      <span class="checkmark"></span>
                      Yes
                    </label>
                    <label class="radio-item">
                      <input type="radio" name="found_info" value="No">
                      <span class="checkmark"></span>
                      No
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label for="recommendations" class="form-label">Give your Recommendations to enhance our services!</label>
           <textarea id="recommendations" name="recommendations" class="form-control textarea" rows="4" placeholder="Type your recommendations here..."></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" id="submitFeedbackBtn" class="btn btn-primary" form="feedbackForm">Submit Feedback</button>
              <button type="button" id="cancelFeedbackBtn" class="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `
    this.modal = this.shadowRoot.getElementById("feedbackModal")
    this.form = this.shadowRoot.getElementById("feedbackForm")
    this.cancelBtn = this.shadowRoot.getElementById("cancelFeedbackBtn")
    this.closeBtn = this.shadowRoot.getElementById("closeFeedbackModal")
    this.submitBtn = this.shadowRoot.getElementById("submitFeedbackBtn")
    
    // Initialize form field references for user input detection
    this.barangaySelect = this.shadowRoot.getElementById("barangay")
    this.recommendationsTextarea = this.shadowRoot.getElementById("recommendations")
    
    this.initEventListeners()
  }

  initEventListeners() {
    // Close modal events - use handleCloseAttempt to check for user input
    this.cancelBtn.addEventListener("click", () => {
      this.handleCloseAttempt()
    })
    this.closeBtn.addEventListener("click", () => {
      this.handleCloseAttempt()
    })
    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.handleCloseAttempt()
      }
    })
    // Form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSubmit()
    })
    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) {
        this.handleCloseAttempt()
      }
    })
  }

  hasUserInput() {
    // Check if barangay is selected
    const barangayHas = (this.barangaySelect?.value || "").trim().length > 0;
    
    // Check if satisfaction is selected
    const satisfactionHas = !!this.form.querySelector('input[name="satisfaction"]:checked');
    
    // Check if any purpose checkboxes are selected
    const purposeHas = this.form.querySelectorAll('input[name="purpose"]:checked').length > 0;
    
    // Check if found_info is selected
    const foundInfoHas = !!this.form.querySelector('input[name="found_info"]:checked');
    
    // Check if recommendations textarea has content
    const recommendationsHas = (this.recommendationsTextarea?.value || "").trim().length > 0;
    
    return barangayHas || satisfactionHas || purposeHas || foundInfoHas || recommendationsHas;
  }

  handleCloseAttempt() {
    // Check if user has entered any data
    if (this.hasUserInput()) {
      // Show confirmation modal
      this.showCancelConfirmation();
    } else {
      // No input, close directly
      this.close();
    }
  }

  showCancelConfirmation() {
    // Remove existing instance if any
    const existing = document.querySelector("cancel-confimation-modal");
    if (existing) existing.remove();

    const cancelModal = document.createElement("cancel-confimation-modal");
    cancelModal.setAttribute("title", "Warning Action");
    cancelModal.setAttribute("message", "Are you sure to cancel your feedback? Your feedback will not be submitted.");
    
    // Listen for user decision
    cancelModal.addEventListener("cancel-confirm", (e) => {
      if (e.detail?.confirmed) {
        // Yes: dispose entries and close
        this.close();
      } else {
        // No: keep modal open with current entries retained
        // User can continue inputting
        // Focus on first input field for better UX
        this.barangaySelect?.focus();
      }
    }, { once: true });

    document.body.appendChild(cancelModal);
  }

  open() {
    this.modal.classList.add("show")
    this.clearError()
    document.body.style.overflow = "hidden"
  }

  close() {
    this.modal.classList.remove("show")
    this.form.reset()
    this.clearError()
    document.body.style.overflow = ""
    // Dispatch modal-closed event before removing
    this.dispatchEvent(new CustomEvent("modal-closed", { bubbles: true, composed: true }))
    // Remove the modal from DOM
    this.remove()
  }

  showError(message, type = 'error') {
    // Create and show failure modal
    const failureModal = document.createElement('failure-modal');
    failureModal.setAttribute('message', message || 'An error occurred. Please try again.');
    document.body.appendChild(failureModal);
  }

  clearError() {
    // Clear error method (can be expanded later)
  }

  showLoadingState() {
    // Remove existing loading state if any
    const existing = document.querySelector("loading-state");
    if (existing) existing.remove();
    
    this.loadingState = document.createElement("loading-state");
    this.loadingState.setAttribute("subheader", "Submitting your feedback");
    document.body.appendChild(this.loadingState);
    this.loadingState.show();
  }

  hideLoadingState() {
    if (this.loadingState) {
      this.loadingState.hide();
      this.loadingState.remove();
      this.loadingState = null;
    }
  }

  handleSubmit() {
    // Get form data
    const formData = new FormData(this.form)
    const data = Object.fromEntries(formData.entries())
    
    // Get all checked checkboxes for the purpose field
    const purposeCheckboxes = this.form.querySelectorAll('input[name="purpose"]:checked')
    const selectedPurposes = Array.from(purposeCheckboxes).map(cb => cb.value)
    
    // Debug logging
    console.log('=== FORM VALIDATION DEBUG ===')
    console.log('Form data:', data)
    console.log('Selected purposes:', selectedPurposes)
    console.log('Barangay:', data.barangay, '| Valid:', !!data.barangay)
    console.log('Satisfaction:', data.satisfaction, '| Valid:', !!data.satisfaction)
    console.log('Found info:', data['found_info'], '| Valid:', !!data['found_info'])
    console.log('Recommendations:', data.recommendations, '| Valid:', !!(data.recommendations && data.recommendations.trim() !== ''))
    console.log('Purpose count:', selectedPurposes.length, '| Valid:', selectedPurposes.length > 0)
    
    // Basic validation with specific error messages
    if (!data.barangay) {
      console.log('❌ VALIDATION FAILED: Barangay not selected')
      this.showError("Please select your barangay.")
      return
    }
    
    if (!data.satisfaction) {
      console.log('❌ VALIDATION FAILED: Satisfaction not selected')
      this.showError("Please rate your satisfaction level.")
      return
    }
    
    if (selectedPurposes.length === 0) {
      console.log('❌ VALIDATION FAILED: No purposes selected')
      this.showError("Please select at least one option for what you were looking for on our website.")
      return
    }
    
    if (!data['found_info']) {
      console.log('❌ VALIDATION FAILED: Found info not selected')
      this.showError("Please indicate whether you found what you were looking for.")
      return
    }
    
    if (!data.recommendations || data.recommendations.trim() === '') {
      console.log('❌ VALIDATION FAILED: Recommendations empty or too short')
      this.showError("Please provide your recommendations to enhance our services.")
      return
    }

    console.log('✅ ALL VALIDATIONS PASSED - Proceeding with submission')

    // Prepare data for submission
    // Note: Date will be handled by PHP using CURDATE()
    const submitData = new FormData()
    submitData.append('action', 'save')
    submitData.append('barangay', data.barangay)
    submitData.append('satisfaction', data.satisfaction)
    submitData.append('visit', selectedPurposes.join(', ')) // Join multiple purposes with comma
    submitData.append('found_info', data['found_info'])
    submitData.append('recommendations', data.recommendations)
    // Note: feedback_date is handled by PHP using CURDATE(), no need to send it

    // Debug logging for submission data
    console.log('=== SUBMISSION DATA ===')
    for (let [key, value] of submitData.entries()) {
      console.log(`${key}: ${value}`)
    }

    // Close modal and show loading state before submission
    this.close();
    this.showLoadingState();

    // Submit feedback to backend
    console.log('=== SUBMITTING TO PHP ===')
    fetch('./php_folder/manageFeedbacks.php', {
      method: 'POST',
      body: submitData
    })
    .then(response => {
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      // Check if response is ok (status 200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.text().then(text => {
        console.log('Raw response text:', text)
        
        // Clean the response text (remove any whitespace/errors before JSON)
        const cleanText = text.trim()
        
        // Check if response is empty
        if (!cleanText) {
          console.error('❌ Empty response from server')
          throw new Error('Server returned empty response')
        }
        
        try {
          const parsed = JSON.parse(cleanText)
          console.log('✅ Successfully parsed JSON:', parsed)
          return parsed
        } catch (e) {
          console.error('❌ Failed to parse JSON:', e)
          console.error('Response text (first 500 chars):', cleanText.substring(0, 500))
          throw new Error(`Server returned invalid JSON. Response: ${cleanText.substring(0, 100)}`)
        }
      })
    })
    .then(result => {
      console.log('✅ Response result:', result)
      
      // Hide loading state first
      this.hideLoadingState();
      
      // Validate result structure
      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid result structure:', result)
        this.showError("Server returned invalid response format. Please try again.")
        return
      }
      
      // Check success property
      if (result.success === true) {
        console.log('✅ Feedback submitted successfully!')
        
        // Create and show success modal
        const successModal = document.createElement('success-save-modal');
        successModal.setAttribute('message', 'Thank you for your Feedback!');
        document.body.appendChild(successModal);
        
        // Modal already closed before loading, no need to close again
      } else {
        // Show error message from server
        const errorMsg = result.message || "Failed to submit feedback. Please try again."
        console.log('❌ PHP returned error:', errorMsg)
        this.showError(errorMsg)
      }
    })
    .catch(error => {
      console.error('❌ Fetch/Processing error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // Hide loading state on error
      this.hideLoadingState();
      
      // Provide user-friendly error message
      let userMessage = "An error occurred while submitting your feedback. "
      
      if (error.message.includes('HTTP error')) {
        userMessage += "Server error. Please try again later."
      } else if (error.message.includes('invalid JSON')) {
        userMessage += "Server response error. Please contact support."
      } else if (error.message.includes('empty response')) {
        userMessage += "No response from server. Check your connection."
      } else {
        userMessage += "Please try again."
      }
      
      this.showError(userMessage)
    })
  }
}
customElements.define("feedback-modal", FeedbackModal)
