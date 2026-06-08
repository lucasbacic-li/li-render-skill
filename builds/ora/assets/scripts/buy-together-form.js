if (!customElements.get('buy-together-form')) {
  /**
   * Custom element for buy together form functionality
   * Manages SKU selection and form updates for HTMX integration
   * @class BuyTogetherForm
   * @extends HTMLElement
   */
  class BuyTogetherForm extends HTMLElement {
    /**
     * Creates an instance of BuyTogetherForm
     * Initializes the selected SKUs and form state
     */
    constructor() {
      super();
      /** @private {string} The current selected SKUs as comma-separated string */
      this.selectedSkus = '';
      /** @private {boolean} Whether user should select a SKU */
      this.shouldSelectSku = false;
      /** @private {HTMLFormElement} The form element */
      this.form = null;
      /** @private {HTMLInputElement} The hidden input for selected SKUs */
      this.selectedSkusInput = null;
      /** @private {HTMLAnchorElement} The buy button */
      this.buyButton = null;
      /** @private {number} Timeout ID for HTMX updates */
      this.htmxUpdateTimeout = null;
      /** @private {boolean} Flag to prevent duplicate updates */
      this.updatePending = false;
    }

    /**
     * Called when the element is connected to the DOM
     * Initializes the form elements and sets up event listeners
     */
    connectedCallback() {
      if (!this.initializeElements()) return;

      // Initialize selected SKUs from data attribute or input value
      this.selectedSkus = this.dataset.selectedSkus || this.selectedSkusInput.value || '';

      this.setupEventListeners();
      this.updateBuyButtonState();
    }

    /**
     * Called when the element is disconnected from the DOM
     * Clean up event listeners and timeouts
     */
    disconnectedCallback() {
      this.cleanup();
    }

    /**
     * Initialize DOM elements
     * @private
     * @returns {boolean} Whether initialization was successful
     */
    initializeElements() {
      this.form = this.querySelector('form');

      if (!this.form) return false;

      this.selectedSkusInput = this.form.querySelector('input[name="selected_skus"]');
      this.buyButton = this.form.querySelector('[data-id="li-buytogether-buy-btn"]');

      return !!this.selectedSkusInput;
    }

    /**
     * Set up event listeners for form interactions
     * @private
     */
    setupEventListeners() {
      this.addEventListener('buy-together-sku-updated', this.handleSelectedSkuUpdated, { passive: true });
    }

    /**
     * Clean up resources and event listeners
     * @private
     */
    cleanup() {
      this.removeEventListener('buy-together-sku-updated', this.handleSelectedSkuUpdated);

      if (this.htmxUpdateTimeout) {
        clearTimeout(this.htmxUpdateTimeout);
        this.htmxUpdateTimeout = null;
      }
    }

    /**
     * Handle SKU updates from product components
     * @private
     * @param {CustomEvent} event - The SKU updated event
     */
    handleSelectedSkuUpdated = (event) => {
      if (this.updatePending) return;

      const { isValid } = event.detail;
      this.shouldSelectSku = !isValid;

      this.updateSelectedSkus();
      this.updateBuyButtonState();
    }

    /**
     * Update the selected SKUs list and trigger form updates
     * @private
     */
    updateSelectedSkus() {
      if (!this.form || this.shouldSelectSku || this.updatePending) return;

      this.updatePending = true;

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        const checkedBoxes = this.form.querySelectorAll('input[name="check_selected_sku"]:checked');
        const selectedSkus = Array.from(checkedBoxes, checkbox => checkbox.value)
          .filter(Boolean)
          .join(',');

        if (selectedSkus === this.selectedSkus) {
          this.updatePending = false;
          return;
        }

        this.selectedSkus = selectedSkus;

        // Update the hidden input
        this.selectedSkusInput.value = this.selectedSkus;
        this.updateBuyButtonState();

        // Debounce HTMX updates
        this.scheduleHtmxUpdate();
        this.updatePending = false;
      });
    }

    /**
     * Schedule HTMX update with debouncing
     * @private
     */
    scheduleHtmxUpdate() {
      if (this.htmxUpdateTimeout) {
        clearTimeout(this.htmxUpdateTimeout);
      }

      this.htmxUpdateTimeout = setTimeout(() => {
        if (window.htmx && this.form) {
          window.htmx.trigger(this.form, 'update-selected-skus');
        }
        this.htmxUpdateTimeout = null;
      }, 10); // Increased debounce time for better performance
    }

    /**
     * Update the buy button state based on current form state
     * @private
     */
    updateBuyButtonState() {
      if (!this.buyButton) return;

      this.buyButton.classList.toggle('btn-disabled', this.shouldSelectSku);
    }
  }

  customElements.define('buy-together-form', BuyTogetherForm);
}
