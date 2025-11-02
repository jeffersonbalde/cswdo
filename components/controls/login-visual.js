class LoginPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.initializeElements();
    this.initEventListeners();
  }

  initializeElements() {
    this.loginBtn = this.shadowRoot.getElementById("loginbtn");
    this.emailInput = this.shadowRoot.getElementById("email");
    this.passwordInput = this.shadowRoot.getElementById("password");
  }

  initEventListeners() {
    // Login functionality
    this.loginBtn.addEventListener("click", async () => {
      const username = this.emailInput.value;
      const password = this.passwordInput.value;

      if (!username || !password) {
        // Show failure modal for empty fields
        const failureModal = document.createElement('failure-modal');
        failureModal.setAttribute('message', 'Please fill in all fields. Try Again');
        document.body.appendChild(failureModal);
        return;
      }

      // Show loading state
      const loadingState = document.createElement('loading-state');
      document.body.appendChild(loadingState);

      // Record start time for minimum loading duration
      const startTime = Date.now();
      const minimumLoadingTime = 3000; // 3 seconds

      try {
        const response = await fetch("/php_folder/login.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });

        const text = await response.text();
        let result;

        try {
          result = JSON.parse(text);
        } catch (err) {
          console.error("⛔ Not JSON:", text);
          loadingState.remove();
          
          // Show failure modal
          const failureModal = document.createElement('failure-modal');
          failureModal.setAttribute('message', 'Server returned invalid response. Try Again');
          document.body.appendChild(failureModal);
          return;
        }

        if (result.success) {
          // Calculate remaining time to ensure minimum 3 seconds
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

          // Wait for remaining time before hiding loading state
          setTimeout(() => {
            // Hide loading state
            loadingState.remove();

            // Show success modal
            const successModal = document.createElement('success-save-modal');
            successModal.setAttribute('message', 'Logged In Successfully!');
            document.body.appendChild(successModal);

            // Redirect after a short delay
            setTimeout(() => {
              switch (result.user_type) {
                case "Administrator":
                  window.location.href = "/admin.php";
                  break;
                                  case "WebAdministrator":
                    window.location.href = "/webadmin.php";
                    break;
                  case "DepartmentAdmin":
                    window.location.href = "/deptadmin.php";
                  break;
                default:
                  window.location.href = "/index.html";
                  break;
              }
            }, 1500);
          }, remainingTime);

        } else {
          // Calculate remaining time to ensure minimum 3 seconds
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

          // Wait for remaining time before hiding loading state
          setTimeout(() => {
            // Hide loading state
            loadingState.remove();
            
            // Show failure modal
            const failureModal = document.createElement('failure-modal');
            failureModal.setAttribute('message', 'Login Failure. Try Again');
            document.body.appendChild(failureModal);
          }, remainingTime);
        }

      } catch (err) {
        console.error("Login error:", err);
        
        // Calculate remaining time to ensure minimum 3 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

        // Wait for remaining time before hiding loading state
        setTimeout(() => {
          loadingState.remove();
          
          // Show failure modal
          const failureModal = document.createElement('failure-modal');
          failureModal.setAttribute('message', 'Something went wrong. Try Again');
          document.body.appendChild(failureModal);
        }, remainingTime);
      }
    });
  }

  render() {
    const header = this.getAttribute("header") || "Log In Portal";
    const subheader = this.getAttribute("subheader") || "The City Social Welfare and Development Office in Pagadian City is mandated to provide social protective and social development services to poor, vulnerable and disadvantaged individuals, families, groups and communities.";
    const img = this.getAttribute("img") || "./imgs/home_bckgrnd.png";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100vh;
          overflow: hidden;
          position: relative;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          flex: 1 1 auto;
          min-height: calc(100vh - 120px);
          z-index: 0;
        }

        * {
          box-sizing: border-box;
        }

        .main-container {
          display: flex;
          height: 100vh;
          min-height: 100vh;
        }

        /* Left Panel - Image Section */
        .left-panel {
          flex: 0 0 60%;
          position: relative;
          background-image: url('${img}');
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 3rem 2rem 2rem 2rem;
          color: white;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1;
        }

        .left-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 500px;
          margin-top: 2rem;
        }

        .left-content h1 {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 2rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
          line-height: 1.2;
        }

        .left-content p {
          font-size: 1.1rem;
          line-height: 1.6;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
        }

        /* Right Panel - Orange Section */
        .right-panel {
          flex: 0 0 40%;
          background: #F7931E;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 3rem 2rem 2rem 2rem;
          position: relative;
        }

        .branding {
          text-align: center;
          margin-bottom: 2rem;
          margin-top: 1rem;
          color: #2C1810;
        }

        .branding h2 {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 0;
          line-height: 1;
        }

        .branding h3 {
          font-size: 1.8rem;
          font-weight: normal;
          margin: 0;
          margin-top: 0.5rem;
        }

        .mobile-welcome {
          display: none;
        }

        /* Login Form Container */
        .login-container {
          background: white;
          border: 2px dashed #E65100;
          border-radius: 15px;
          padding: 2.5rem;
          width: 100%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .login-container::before {
          content: 'CITY SOCIAL WELFARE AND DEVELOPMENT OFFICE OF PAGADIAN';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.7rem;
          color: rgba(0, 0, 0, 0.1);
          text-align: center;
          line-height: 1.2;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.05);
          z-index: 0;
          pointer-events: none;
        }

        .login-container > * {
          position: relative;
          z-index: 1;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h4 {
          font-size: 1.8rem;
          font-weight: bold;
          color: #2C1810;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
        }

        .login-header p {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: block;
          color: #333;
        }

        input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #F7931E;
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          min-height: 44px;
        }

        input:focus {
          outline: none;
          border-color: #E65100;
          box-shadow: 0 0 0 3px rgba(247, 147, 30, 0.1);
        }

        button {
          width: 100%;
          padding: 0.75rem;
          background: #D97B2B;
          color: white;
          font-weight: bold;
          border: 2px solid #F7931E;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s ease, transform 0.2s ease;
          text-transform: uppercase;
          min-height: 44px;
        }

        button:hover {
          background: #C66B1B;
          transform: translateY(-1px);
        }

        button:active {
          transform: translateY(0);
        }

        /* Mobile Responsive Design */
        @media (max-width: 768px) {
          :host {
            overflow-y: auto;
            height: auto;
            min-height: 100vh;
          }

          .main-container {
            flex-direction: column;
            height: auto;
            min-height: 100vh;
            position: relative;
          }

          .left-panel {
            flex: 1;
            min-height: 100vh;
            padding: 1rem;
            position: relative;
          }

          .left-content {
            display: none;
          }

          .right-panel {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: transparent;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            z-index: 10;
            padding-top: 2rem;
          }

          .branding {
            display: none;
          }

          .mobile-welcome {
            display: block;
            text-align: center;
            margin-bottom: 2rem;
            color: white;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
            max-width: 90%;
          }

          .mobile-welcome h1 {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 1rem;
            line-height: 1.2;
          }

          .mobile-welcome p {
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .login-container {
            padding: 1.5rem;
            max-width: 90%;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }

          .login-header h4 {
            font-size: 1.4rem;
          }
        }

        @media (max-width: 480px) {
          .left-panel {
            min-height: 100vh;
            padding: 0.5rem;
          }

          .left-content {
            display: none;
          }

          .right-panel {
            padding: 0.5rem;
            padding-top: 1.5rem;
          }

          .mobile-welcome h1 {
            font-size: 1.4rem;
            margin-bottom: 0.5rem;
          }

          .mobile-welcome p {
            font-size: 0.8rem;
          }

          .login-container {
            padding: 1rem;
            max-width: 95%;
          }

          .login-header h4 {
            font-size: 1.2rem;
          }

          .form-group {
            margin-bottom: 1rem;
          }

          input {
            padding: 0.65rem;
            font-size: 0.9rem;
          }

          button {
            padding: 0.65rem;
            font-size: 0.9rem;
          }
        }

        /* Prevent zoom on input focus on iOS */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          input[type="email"],
          input[type="password"] {
            font-size: 16px;
          }
        }
      </style>

      <div class="main-container">
        <!-- Left Panel - Image Section -->
        <div class="left-panel">
          <div class="left-content">
            <h1>${header}</h1>
            <p>${subheader}</p>
          </div>
        </div>

        <!-- Right Panel - Orange Section -->
        <div class="right-panel">
          <div class="branding">
            <h2>CSWDO</h2>
            <h3>PAGADIAN</h3>
          </div>

          <div class="mobile-welcome">
            <h1>${header}</h1>
            <p>${subheader}</p>
          </div>

          <div class="login-container">
            <div class="login-header">
              <h4>LOG IN</h4>
              <p>Log in to your account</p>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" placeholder="Enter your email" />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" placeholder="Enter your password" />
            </div>

            <button id="loginbtn">LOG IN</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("login-visual", LoginPage);
