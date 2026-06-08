if (!customElements.get('price-range-slider')) {
  /**
   * Custom element for price range slider functionality
   * Provides dual-thumb range slider for price filtering
   * @class PriceRangeSlider
   * @extends HTMLElement
   */
  class PriceRangeSlider extends HTMLElement {
    /**
     * Creates an instance of PriceRangeSlider
     * Initializes the slider values and elements
     */
    constructor() {
      super();
      /** @private {number} The minimum price value */
      this._minPrice = 0;
      /** @private {number} The maximum price value */
      this._maxPrice = 10000;
      /** @private {number} The initial minimum price */
      this._initMin = 0;
      /** @private {number} The initial maximum price */
      this._initMax = 10000;
      /** @private {number} The minimum step between values */
      this._step = 1;
      /** @private {number} The thumb size for margin calculations */
      this._thumbSize = 24;

      /** @private {HTMLInputElement} The minimum range input */
      this.minRangeInput = null;
      /** @private {HTMLInputElement} The maximum range input */
      this.maxRangeInput = null;
      /** @private {HTMLInputElement} The minimum number input */
      this.minNumberInput = null;
      /** @private {HTMLInputElement} The maximum number input */
      this.maxNumberInput = null;
      /** @private {HTMLElement} The range track element */
      this.rangeTrack = null;
      /** @private {HTMLElement} The minimum thumb element */
      this.minThumb = null;
      /** @private {HTMLElement} The maximum thumb element */
      this.maxThumb = null;
      /** @private {HTMLElement} The filter changed indicator */
      this.filterIndicator = null;

      // Bind event handlers
      this.handleRangeInput = this.handleRangeInput.bind(this);
      this.handleNumberInput = this.handleNumberInput.bind(this);
    }

    /**
     * Gets the current minimum price
     * @returns {number} The minimum price
     */
    get minPrice() {
      return this._minPrice;
    }

    /**
     * Sets the minimum price and updates the display
     * @param {number} value - The minimum price value
     */
    set minPrice(value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;

      this._minPrice = Math.max(this._initMin, Math.min(numValue, this._maxPrice - this._step));
      this.updateDisplay();
    }

    /**
     * Gets the current maximum price
     * @returns {number} The maximum price
     */
    get maxPrice() {
      return this._maxPrice;
    }

    /**
     * Sets the maximum price and updates the display
     * @param {number} value - The maximum price value
     */
    set maxPrice(value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;

      this._maxPrice = Math.min(this._initMax, Math.max(numValue, this._minPrice + this._step));
      this.updateDisplay();
    }

    /**
     * Checks if the current values differ from initial values
     * @returns {boolean} True if values have changed
     */
    get hasChanged() {
      return this._minPrice !== this._initMin || this._maxPrice !== this._initMax;
    }

    /**
     * Updates the visual display of the slider
     * @private
     */
    updateDisplay() {
      if (!this.minRangeInput || !this.maxRangeInput) return;

      // Update input values
      this.minRangeInput.value = this._minPrice;
      this.maxRangeInput.value = this._maxPrice;
      this.minNumberInput.value = this._minPrice;
      this.maxNumberInput.value = this._maxPrice;

      // Calculate percentages for positioning
      const minPercent = ((this._minPrice - this._initMin) / (this._initMax - this._initMin)) * 100;
      const maxPercent = ((this._maxPrice - this._initMin) / (this._initMax - this._initMin)) * 100;

      // Update range track
      this.rangeTrack.style.left = minPercent + '%';
      this.rangeTrack.style.right = (100 - maxPercent) + '%';

      // Update thumbs with margin compensation
      const minMargin = (minPercent * this._thumbSize) / 100;
      const maxMargin = ((100 - maxPercent) * this._thumbSize) / 100;

      this.minThumb.style.left = minPercent + '%';
      this.minThumb.style.marginLeft = -minMargin + 'px';

      this.maxThumb.style.right = (100 - maxPercent) + '%';
      this.maxThumb.style.marginRight = -maxMargin + 'px';

      // Update filter changed indicator
      if (this.filterIndicator) {
        this.filterIndicator.classList.toggle('hidden', !this.hasChanged);
      }

      // Dispatch change event
      this.dispatchEvent(new CustomEvent('pricechange', {
        detail: {
          min: this._minPrice,
          max: this._maxPrice,
          hasChanged: this.hasChanged
        }
      }));
    }

    /**
     * Handles input events from range sliders
     * @private
     * @param {Event} event - The input event
     */
    handleRangeInput(event) {
      const target = event.target;
      const value = parseFloat(target.value);

      if (target.dataset.type === 'min') {
        this.minPrice = value;
      } else if (target.dataset.type === 'max') {
        this.maxPrice = value;
      }
    }

    /**
     * Handles input events from number inputs with debouncing
     * @private
     * @param {Event} event - The input event
     */
    handleNumberInput(event) {
      const target = event.target;
      const value = parseFloat(target.value);

      // Clear existing timeout
      if (this._debounceTimeout) {
        clearTimeout(this._debounceTimeout);
      }

      // Set new timeout for debounced input
      this._debounceTimeout = setTimeout(() => {
        if (target.dataset.type === 'min-input') {
          this.minPrice = value;
        } else if (target.dataset.type === 'max-input') {
          this.maxPrice = value;
        }
      }, 300);
    }

    /**
     * Validates and sanitizes input values
     * @private
     * @param {number} value - The value to validate
     * @param {string} type - The type of input ('min' or 'max')
     * @returns {number} The validated value
     */
    validateValue(value, type) {
      if (!/^\d*\.?\d*$/.test(value.toString())) {
        return type === 'min' ? this._initMin : this._initMax;
      }

      const numValue = parseFloat(value);

      if (type === 'min') {
        return Math.max(this._initMin, Math.min(numValue, this._initMax));
      } else {
        return Math.min(this._initMax, Math.max(numValue, this._initMin));
      }
    }

    /**
     * Called when the element is inserted into the DOM
     * Initializes the slider by finding elements and setting up event listeners
     */
    connectedCallback() {
      // Get initial values from data attributes
      this._initMin = parseFloat(this.dataset.min) || 0;
      this._initMax = parseFloat(this.dataset.max) || 10000;
      this._minPrice = this._initMin;
      this._maxPrice = this._initMax;
      this._step = Math.max(1, (this._initMax - this._initMin) * 0.01);

      // Find elements
      this.minRangeInput = this.querySelector('input[data-type="min"]');
      this.maxRangeInput = this.querySelector('input[data-type="max"]');
      this.minNumberInput = this.querySelector('input[data-type="min-input"]');
      this.maxNumberInput = this.querySelector('input[data-type="max-input"]');
      this.rangeTrack = this.querySelector('.range-track');
      this.minThumb = this.querySelector('.min-thumb');
      this.maxThumb = this.querySelector('.max-thumb');
      this.filterIndicator = this.querySelector('.filter-changed-indicator');

      if (!this.minRangeInput || !this.maxRangeInput) return;

      // Set up range inputs
      [this.minRangeInput, this.maxRangeInput].forEach(input => {
        input.min = this._initMin;
        input.max = this._initMax;
        input.addEventListener('input', this.handleRangeInput);
      });

      // Set up number inputs
      [this.minNumberInput, this.maxNumberInput].forEach(input => {
        input.min = this._initMin;
        input.max = this._initMax;
        input.addEventListener('input', this.handleNumberInput);
      });

      // Initialize display
      this.updateDisplay();
    }

    /**
     * Called when the element is removed from the DOM
     * Clean up event listeners and timeouts
     */
    disconnectedCallback() {
      if (this.minRangeInput) {
        this.minRangeInput.removeEventListener('input', this.handleRangeInput);
      }
      if (this.maxRangeInput) {
        this.maxRangeInput.removeEventListener('input', this.handleRangeInput);
      }
      if (this.minNumberInput) {
        this.minNumberInput.removeEventListener('input', this.handleNumberInput);
      }
      if (this.maxNumberInput) {
        this.maxNumberInput.removeEventListener('input', this.handleNumberInput);
      }

      if (this._debounceTimeout) {
        clearTimeout(this._debounceTimeout);
      }
    }
  }

  customElements.define('price-range-slider', PriceRangeSlider);
}
