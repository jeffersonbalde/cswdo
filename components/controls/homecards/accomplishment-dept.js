// components/accomplishment-dept.js
class AutoSlider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentSlide = 0;
    this.interval = null;
    this.startX = 0;
    this.endX = 0;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    this.startSlider();
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  startSlider() {
    const slides = this.shadowRoot.querySelectorAll('.slide');
    const indicators = this.shadowRoot.querySelectorAll('.dot');
    const total = slides.length;

    this.interval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % total;
      this.updateSlider(slides, indicators);
    }, 5000);
  }

  updateSlider(slides, indicators) {
    const slideTrack = this.shadowRoot.querySelector('.slides');
    slideTrack.style.transform = `translateX(-${this.currentSlide * 100}%)`;

    indicators.forEach(dot => dot.classList.remove('active'));
    if (indicators[this.currentSlide]) {
      indicators[this.currentSlide].classList.add('active');
    }
  }

  addEventListeners() {
    const leftBtn = this.shadowRoot.querySelector('.arrow-left');
    const rightBtn = this.shadowRoot.querySelector('.arrow-right');
    const slides = this.shadowRoot.querySelectorAll('.slide');
    const indicators = this.shadowRoot.querySelectorAll('.dot');

    leftBtn.addEventListener('click', () => {
      this.currentSlide = (this.currentSlide - 1 + slides.length) % slides.length;
      this.updateSlider(slides, indicators);
      this.resetInterval();
    });

    rightBtn.addEventListener('click', () => {
      this.currentSlide = (this.currentSlide + 1) % slides.length;
      this.updateSlider(slides, indicators);
      this.resetInterval();
    });

    const slideContainer = this.shadowRoot.querySelector('.slider');
    slideContainer.addEventListener('touchstart', (e) => {
      this.startX = e.touches[0].clientX;
    });

    slideContainer.addEventListener('touchend', (e) => {
      this.endX = e.changedTouches[0].clientX;
      this.handleSwipe(slides, indicators);
    });
  }

  resetInterval() {
    clearInterval(this.interval);
    this.startSlider();
  }

  handleSwipe(slides, indicators) {
    if (this.endX < this.startX - 30) {
      this.currentSlide = (this.currentSlide + 1) % slides.length;
    } else if (this.endX > this.startX + 30) {
      this.currentSlide = (this.currentSlide - 1 + slides.length) % slides.length;
    }
    this.updateSlider(slides, indicators);
    this.resetInterval();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .slider {
          position: relative;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          border-radius: 12px;
          aspect-ratio: 16 / 9;
        }

        .slides {
          display: flex;
          width: 400%;
          transition: transform 0.8s ease-in-out;
        }

        .slide {
          width: 100%;
          position: relative;
          flex-shrink: 0;
        }

        .slide img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background-color: #000;
         
        }

        .caption {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 1.6rem;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
         
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          text-align: center;
          max-width: 90%;
        }

        .indicators {
          position: absolute;
          bottom: 10px;
          width: 100%;
          display: flex;
          justify-content: center;
          gap: 8px;
          z-index: 10;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .dot.active {
          background-color: white;
        }

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          padding: 0.25rem 0.75rem;
          border-radius: 5px;
          z-index: 10;
        }

        .arrow-left {
          left: 10px;
        }

        .arrow-right {
          right: 10px;
        }

        @media (max-width: 768px) {
          .caption {
            font-size: 1rem;
            padding: 0.5rem 1rem;
          }

          .dot {
            width: 10px;
            height: 10px;
          }

          .arrow {
            font-size: 1.5rem;
            padding: 0.2rem 0.6rem;
          }
        }
      </style>

      <div class="slider">
        <div class="slides">
          <div class="slide">
            <img src="./imgs/home_bckgrnd.png" alt="Slide 1">
            <div class="caption">Slide 1 Title</div>
          </div>
          <div class="slide">
            <img src="./imgs/CSWDO.png" alt="Slide 2">
            <div class="caption">Slide 2 Title</div>
          </div>
          <div class="slide">
            <img src="./imgs/Admin Avatar.png" alt="Slide 3">
            <div class="caption">Slide 3 Title</div>
          </div>
          <div class="slide">
            <img src="./imgs/home_bckgrnd.png" alt="Slide 4">
            <div class="caption">Slide 4 Title</div>
          </div>
        </div>

        <button class="arrow arrow-left">&#10094;</button>
        <button class="arrow arrow-right">&#10095;</button>

        <div class="indicators">
          <div class="dot active"></div>
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
  }
}

customElements.define('accomplishment-dept', AutoSlider);
