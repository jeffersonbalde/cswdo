class VisualPictureSection extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
  
    connectedCallback() {
      const imageUrl = this.getAttribute("img") || "/imgs/home_bckgrnd,png"; // Fallback if none provided
  
      this.shadowRoot.innerHTML = `
        <style>
          .bg-parallax {
            position: relative;
            width: 100vw;
            height: 50vh;
            background-image: url('${imageUrl}');
            background-attachment: fixed;
            background-position: center;
            background-repeat: no-repeat;
            background-size: cover;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            overflow: hidden;
            z-index: 0;
          }
  
          .bg-parallax::before {
            content: "";
            position: absolute;
            top: 0; left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.3);
            z-index: 1;
          }
  
          .pageintro {
            position: relative;
            z-index: 2;
          }
  
          .pageintro h1 {
            font-size: 2.5rem;
            margin: 0;
            color: white;
          }
  
          .pageintro h1 span {
            display: block;
            font-weight: bold;
          }
  
          @media (max-width: 1200px) {
            .bg-parallax {
              height: 90vh;
            }
  
            .pageintro h1 {
              font-size: 1.8rem;
            }
          }


          @media (max-width: 992px) {
            .bg-parallax {
              height: 70vh;
            }
          }

            @media (max-width: 768px) {
            .bg-parallax {
              height: 60vh;
              /* background-attachment: scroll; Prevent buggy behavior on mobile */
            }
          }}


          @media (max-width: 576px) {
            .bg-parallax {
              height: 50vh;
              /* background-attachment: scroll; Prevent buggy behavior on mobile */
            }
          }
        </style>
  
        <section class="bg-parallax">
          <div class="pageintro">
            <h1>
              City Social Welfare and Development Office <span>Pagadian</span>
            </h1>
          </div>
        </section>
      `;
    }
  }
  
  customElements.define("visual-picture", VisualPictureSection);
  