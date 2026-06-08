if (!customElements.get('banner-carousel')) {
  /**
   * Custom element for banner carousel functionality
   * Provides navigation controls and automatic slide management for banner displays
   * @class BannerCarousel
   * @extends HTMLElement
   */
  class BannerCarousel extends HTMLElement {
    /**
     * Creates an instance of BannerCarousel
     * Initializes the active slide index and slides array
     */
    constructor() {
      super();
      /** @private {number} The index of the currently active slide */
      this._activeSlide = 0;
      /** @private {NodeList} Collection of carousel slide elements */
      this.slides = [];
      /** @private {NodeList} Collection of indicator buttons */
      this.indicators = [];
      /** @private {HTMLElement} The navigation container */
      this.navigation = null;
      /** @private {Function} Click event handler */
      this.handleClick = this.handleClick.bind(this);
    }

    /**
     * Gets the current active slide index
     * @returns {number} The index of the active slide
     */
    get activeSlide() {
      return this._activeSlide;
    }

    /**
     * Sets the active slide index and updates the display
     * @param {number} value - The index of the slide to make active
     */
    set activeSlide(value) {
      if (value < 0 || value >= this.slides.length || !this.slides.length) return;
      this._activeSlide = value;
      this.updateActiveSlide();
    }

    /**
     * Updates the visual state of the carousel to show the active slide
     * @private
     */
    updateActiveSlide() {
      if (!this.slides.length) return;
      this.slides[this.activeSlide].scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      });
      this.indicators.forEach((button, index) => {
        button.classList.toggle('btn-active', index === this.activeSlide);
      });
    }

    /**
     * Handle click events using event delegation
     * @private
     */
    handleClick(event) {
      const target = event.target.closest('button');
      if (!target) return;

      const action = target.dataset.action;
      const slideIndex = target.dataset.slide;

      if (action === 'next') {
        this.activeSlide = (this.activeSlide + 1) % this.slides.length;
      } else if (action === 'prev') {
        this.activeSlide = (this.activeSlide - 1 + this.slides.length) % this.slides.length;
      } else if (slideIndex !== undefined) {
        this.activeSlide = parseInt(slideIndex, 10);
      }
    }

    /**
     * Called when the element is inserted into the DOM
     * Initializes the carousel by finding slide elements and setting up event listeners
     */
    connectedCallback() {
      this.slides = this.querySelectorAll('.carousel-item');
      this.indicators = this.querySelectorAll('.carousel-indicators .btn');
      this.navigation = this.querySelector('.carousel-navigation');

      if (!this.slides.length || !this.navigation) return;

      this.navigation.addEventListener('click', this.handleClick);
    }

    /**
     * Called when the element is removed from the DOM
     * Clean up event listeners
     */
    disconnectedCallback() {
      this.navigation.removeEventListener('click', this.handleClick);
    }
  }
  customElements.define('banner-carousel', BannerCarousel);
}
