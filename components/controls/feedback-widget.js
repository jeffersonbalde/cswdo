class FeedbackWidget extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this.isModalOpen = false // Track if the modal is currently open

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          margin-right: 20px;
          margin-bottom: 120px;
        }

        .chat-button {
          background-color: transparent;
          border: none;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease-in-out;
          background-image: url('/imgs/feedback-widget.jpg');
          background-size: 150%;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
        }

        .chat-button:hover {
          transform: scale(1.05);
        }

        .chat-button:active {
          transform: scale(0.95);
        }

        .chat-popup {
          position: absolute;
          bottom: 75px;
          right: 0;
          background-color: #ffe0b2;
          color: #333;
          padding: 10px 15px;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out, visibility 0.3s;
          white-space: nowrap;
          font-size: 16px;
        }

        .chat-popup.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        /* Speech bubble tail */
        .chat-popup::after {
          content: '';
          position: absolute;
          bottom: -10px;
          right: 20px;
          border-width: 10px 10px 0;
          border-style: solid;
          border-color: #ffe0b2 transparent transparent transparent;
          display: block;
          width: 0;
        }



@media (max-width: 768px) {

:host {
          display: block;
          position: fixed;
          bottom: 20px;
          right: 10px;
           z-index: 500;
          margin-right: 10px;
          margin-bottom: 100px;
        }

  .chat-button {
    width: 60px;
    height: 60px;
    background-size: 100%;
  }

  .chat-popup {
    font-size: 14px;
    padding: 8px 12px;
  }

  .chat-popup::after {
    bottom: -8px;
    right: 16px;
    border-width: 8px 8px 0;
  }
}

@media (max-width: 576px) {

:host {
          display: block;
          position: fixed;
          bottom: 20px;
          right: 10px;
           z-index: 500;
          margin-right: 10px;
          margin-bottom: 100px;
        }


  .chat-button {
    width: 50px;
    height: 50px;
    background-size: 100%;
  }

  .chat-popup {
    font-size: 13px;
    padding: 6px 10px;
  }

  .chat-popup::after {
    bottom: -6px;
    right: 12px;
    border-width: 6px 6px 0;
  }
}



      </style>

      <button class="chat-button" aria-label="Open feedback form">
      </button>
      <div class="chat-popup">Hi there!</div>
    `

    this.chatButton = this.shadowRoot.querySelector(".chat-button")
    this.chatPopup = this.shadowRoot.querySelector(".chat-popup")

    this.chatButton.addEventListener("click", this.handleButtonClick.bind(this))
  }

  handleButtonClick() {
    if (!this.isModalOpen) {
      this.chatPopup.classList.add("visible")
      this.isModalOpen = true

      // Show pop-up briefly, then open modal
      setTimeout(() => {
        this.chatPopup.classList.remove("visible")
        this.openFeedbackModal()
      }, 500) // 500ms delay for pop-up
    }
  }

  openFeedbackModal() {
    // Create an instance of the new FeedbackModal component
    const feedbackModal = document.createElement("feedback-modal")

    // Listen for the custom event dispatched when the modal closes
    feedbackModal.addEventListener("modal-closed", () => {
      feedbackModal.remove() // Remove the modal from the DOM
      this.isModalOpen = false // Reset state
    })

    // Append the modal to the document body
    document.body.appendChild(feedbackModal)

    // Call the open method on the modal component
    feedbackModal.open()
  }
}

customElements.define("feedback-widget", FeedbackWidget)
