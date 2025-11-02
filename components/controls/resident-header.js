class ResidentHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
        :host header {
          width: 100%;
          position: sticky;
          top: 0;
          background: white;
          z-index: 999;
        }

        .top-bar {
          background-color: #e67e22;
          color: white;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          height: 90px;
        }

        .top-bar .logos {
          display: flex;
          align-items: center;
        }

        .top-bar .logos img {
          height: 70px;
          margin-right: 10px;
        }

        .top-bar .top-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
        }

        .top-bar .top-info h1 {
          font-size: 24px;
          font-weight: normal;
          margin: 0;
        }

        .top-bar .top-info .date-time {
          font-size: 16px;
          font-weight: normal;
          margin-left: auto;
          margin-right: 20px;
          font-style: italic;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          color: white;
          padding: 8px 12px;
          font-size: 20px;
          cursor: pointer;
          border-radius: 4px;
        }

        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          margin: 0;
          padding: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 998;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .menu-overlay.active {
          opacity: 1;
          pointer-events: all;
            display: block;
        }

        .menu-container {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: white;
          padding: 0 20px;
          height: 70px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          border-bottom: 3px solid #000000;
        }

        nav ul {
          list-style-type: none;
          display: flex;
          margin: 0;
          padding: 0;
        }

        nav ul li {
          margin: 0 10px;
        }

        nav ul li a {
          text-decoration: none;
          color: #000;
          font-weight: normal;
          font-size: 20px;
          padding: 10px 15px;
          display: inline-block;
          transition: all 0.3s ease;
        }

        nav ul li a:hover {
          background-color: #a8d5ba;
          color: #ffffff;
        }

        nav ul li a.active {
          background-color: #a8d5ba;
          color: #000000;
          
        }

        @media (max-width: 992px) {
          .top-bar {
            height: 100px;
          }

          .top-bar .logos img {
            height: 70px;
            margin-right: 10px;
          }

          .top-bar .top-info {
            display: inline-block;
          }

          .top-bar .top-info h1 {
            font-size: 20px;
            margin: 10px 0;
          }

          .top-bar .top-info .date-time {
            font-size: 16px;
            margin-left: auto;
          }

          .menu-container {
            padding: 0 10px;
            height: 80px;
          }

          .logo-container {
            padding-left: 5px;
          }

          .logo-container img {
            max-height: 40px;
            width: auto;
          }

          nav ul {
            flex-wrap: wrap;
            justify-content: center;
            list-style: none;
          }

          nav ul li {
            margin: 5px;
          }

          nav ul li a {
            font-size: 12px;
            padding: 3px 3px;
            text-align: center;
            word-break: break-word;
            white-space: normal;
            display: inline-block;
          }
        }

        @media (max-width: 768px) {
          :host header {
            position: sticky;
            top: 0;
            z-index: 1000;
          }

          .menu-toggle {
            display: block;
          }

          .menu-container {
            flex-direction: column;
            position: fixed;
            top: 0;
                    margin: 0;
        padding: 0;
            right: -250px;
            width: 250px;
            height: 100vh;
            background-color: white;
            z-index: 1000;
            transition: right 0.3s ease-in-out;
            box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
            overflow-y: auto;
          }

          .menu-container.active {
            right: 0;
          }

          .menu-overlay.active {
            display: block;
          }

          nav ul {
            flex-direction: column;
            width: 100%;
          }

          nav ul li {
            margin: 0;
            width: 100%;
            border-bottom: 1px solid #eee;
          }

          nav ul li a {
            width: 100%;
            padding: 15px 20px;
            text-align: left;
            display: block;
          }
        }

        @media (max-width: 576px) {
          .top-bar {
            height: auto;
            padding: 5px 10px;
          }

          .top-bar .logos img {
            height: 40px;
            margin-right: 5px;
          }

          .top-bar .top-info h1 {
            font-size: 12px;
            white-space: normal;
          }

          .top-bar .top-info .date-time {
            font-size: 10px;
          }

          .menu-toggle {
            font-size: 18px;
            padding: 4px 8px;
          }

          nav ul li a {
            font-size: 14px;
            padding: 10px 12px;
          }
        }
      </style>

      <header>
        <div class="top-bar">
          <div class="logos">
            <img src="/imgs/Pagadian.png" alt="Pagadian City Logo" />
            <img src="/imgs/CSWDO Pags Logo.png" alt="CSWDO-Pagadian Logo" />
          </div>
          <div class="top-info">
            <h1>The Official Website of the City Social Welfare and Development Office of Pagadian</h1>
            <div class="date-time" id="dateTime">${new Date().toLocaleDateString()}</div>
          </div>
          <button class="menu-toggle" id="menuToggle">&#9776;</button>
        </div>

        <div class="menu-container" id="menuContainer">
          <div class="logo-container">
            <img src="/imgs/CSWDO.png" alt="CSWDO Pagadian Logo" />
          </div>
          <nav>
            <ul>
              <li><a href="index.html">HOME</a></li>
              <li><a href="services.html">SERVICES</a></li>
              <li><a href="ordinances.html">ORDINANCES</a></li>
              <li><a href="newsupdate.html">NEWS & UPDATES</a></li>
              <li><a href="#">ACCOMPLISHMENTS</a></li>
              <li><a href="featurestories.html">STORIES</a></li>
              <li><a href="#">ABOUT US</a></li>
              <li><a href="login.html">LOG IN</a></li>
            </ul>
          </nav>
        </div>
        <div class="menu-overlay" id="menuOverlay"></div>
      </header>
    `;
  }

  connectedCallback() {
    const dateTimeElem = this.shadowRoot.querySelector("#dateTime");

    const updateDateTime = () => {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      dateTimeElem.textContent = now.toLocaleDateString("en-US", options);
    };

    updateDateTime();
    this._interval = setInterval(updateDateTime, 1000);

    const menuToggle = this.shadowRoot.querySelector("#menuToggle");
    const menuContainer = this.shadowRoot.querySelector("#menuContainer");
    const menuOverlay = this.shadowRoot.querySelector("#menuOverlay");
    const menuLinks = this.shadowRoot.querySelectorAll("nav ul li a");

    menuToggle.addEventListener("click", () => {
      menuContainer.classList.toggle("active");
      menuOverlay.classList.toggle("active");
    });

    menuOverlay.addEventListener("click", () => {
      menuContainer.classList.remove("active");
      menuOverlay.classList.remove("active");
    });

    menuLinks.forEach((item) => {
      item.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          menuContainer.classList.remove("active");
          menuOverlay.classList.remove("active");
        }
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        menuContainer.classList.remove("active");
        menuOverlay.classList.remove("active");
      }
    });

    // Set active page highlighting
    this.setActivePage();
  }

  setActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuLinks = this.shadowRoot.querySelectorAll("nav ul li a");
    
    menuLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  disconnectedCallback() {
    clearInterval(this._interval);
  }
}

customElements.define("resident-header", ResidentHeader);
