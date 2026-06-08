if (!customElements.get('buy-together-product')) {
  /**
   * Custom element for individual buy together product
   * Manages product selection, variations, and SKU updates
   * @class BuyTogetherProduct
   * @extends HTMLElement
   */
  class BuyTogetherProduct extends HTMLElement {
    /**
     * Creates an instance of BuyTogetherProduct
     * Initializes the product state and variation management
     */
    constructor() {
      super();
      /** @private {boolean} Whether this product is selected */
      this.isChecked = false;
      /** @private {string} The currently selected SKU ID */
      this.selectedSku = '';
      /** @private {Map} Map of selected options for better performance */
      this.selectedOptions = new Map();
      /** @private {Map} Map of variations to SKU IDs for better performance */
      this.variationsToSkuMap = new Map();
      /** @private {boolean} Whether this is the first (current) product */
      this.isFirst = false;
      /** @private {HTMLInputElement} The checkbox for this product */
      this.checkbox = null;
      /** @private {boolean} Whether this product has options */
      this.hasOptions = false;
      /** @private {NodeList} Cached form elements */
      this.formElements = null;
    }

    /**
     * Called when the element is connected to the DOM
     * Initializes the product state and sets up event listeners
     */
    connectedCallback() {
      this.initializeState();
      this.parseVariationsMap();
      this.cacheElements();

      if (this.hasOptions) {
        this.initializeSelectedOptions();
      }

      this.setupEventListeners();
      this.updateFormDisabledState();
    }

    /**
     * Called when the element is disconnected from the DOM
     * Clean up event listeners and references
     */
    disconnectedCallback() {
      this.cleanup();
    }

    /**
     * Initialize component state from dataset
     * @private
     */
    initializeState() {
      this.isChecked = this.dataset.selected === 'true';
      this.selectedSku = this.dataset.selectedSku || '';
      this.hasOptions = this.dataset.hasOptions === 'true';
      this.isFirst = this.dataset.isFirst === 'true';
    }

    /**
     * Parse and cache variations map for better performance
     * @private
     */
    parseVariationsMap() {
      try {
        const variationsData = this.dataset.variationsMap || '{}';
        const cleanedData = variationsData.replace(/'/g, '"').replace(/,\s*}/g, '}');
        const parsedMap = JSON.parse(cleanedData);

        // Convert to Map for better performance
        this.variationsToSkuMap = new Map(Object.entries(parsedMap));
      } catch (error) {
        console.warn('Error parsing variations map:', error);
        this.variationsToSkuMap = new Map();
      }
    }

    /**
     * Cache frequently accessed DOM elements
     * @private
     */
    cacheElements() {
      this.checkbox = this.querySelector('input[name="check_selected_sku"]');
      this.formElements = this.querySelectorAll('input[type="radio"], select');
    }

    /**
     * Initialize selected options from pre-selected form inputs
     * @private
     */
    initializeSelectedOptions() {
      // Process radio buttons
      const selectedRadios = this.querySelectorAll('input[type="radio"]:checked');
      for (const radio of selectedRadios) {
        const optionId = radio.name.replace('bt_variation_', '');
        this.selectedOptions.set(optionId, radio.value);
      }

      // Process select elements
      const selects = this.querySelectorAll('select[name^="bt_variation_"]');
      for (const select of selects) {
        if (select.value) {
          const optionId = select.name.replace('bt_variation_', '');
          this.selectedOptions.set(optionId, select.value);
        }
      }
    }

    /**
     * Set up event listeners for variation changes
     * @private
     */
    setupEventListeners() {
      this.addEventListener('change', this.handleSelectedSkuChange, { passive: false });
    }

    /**
     * Clean up resources and event listeners
     * @private
     */
    cleanup() {
      this.removeEventListener('change', this.handleSelectedSkuChange);
      this.selectedOptions.clear();
      this.variationsToSkuMap.clear();
      this.formElements = null;
    }

    /**
     * Handle checkbox changes to enable/disable variations
     * @private
     * @param {Event} event - The change event
     */
    handleCheckboxChange(event) {
      this.isChecked = event.target.checked;
      this.updateFormDisabledState();

      // Dispatch event with more efficient approach
      this.dispatchSkuUpdatedEvent(!!this.selectedSku);
    }

    /**
     * Handle variation changes (radio buttons and selects)
     * @private
     * @param {Event} event - The change event
     */
    handleSelectedSkuChange = (event) => {
      const target = event.target;

      if (target.name === 'check_selected_sku') {
        this.handleCheckboxChange(event);
        return;
      }

      if (!target.name?.startsWith('bt_variation_')) return;

      this.updateSelectedOption(target);
      this.updateSku();
    }

    /**
     * Update selected option based on form element type
     * @private
     * @param {HTMLElement} element - The form element
     */
    updateSelectedOption(element) {
      const optionId = element.name.replace('bt_variation_', '');

      if (element.type === 'radio' && element.checked) {
        this.selectedOptions.set(optionId, element.value);
      } else if (element.type === 'select-one') {
        if (element.value) {
          this.selectedOptions.set(optionId, element.value);
        } else {
          this.selectedOptions.delete(optionId);
        }
      }
    }

    /**
     * Update the SKU based on selected variations
     * @private
     */
    updateSku() {
      try {
        if (this.selectedOptions.size === 0) return;

        const selectedOptionsParsed = Array.from(this.selectedOptions.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}-${value}`)
          .join('--');

        const selectedSku = this.variationsToSkuMap.get(selectedOptionsParsed);

        if (selectedSku === this.selectedSku) return;

        this.selectedSku = selectedSku || '';
        this.updateCheckboxState(!!selectedSku);
        this.dispatchSkuUpdatedEvent(!!selectedSku);
      } catch (error) {
        console.error('Error updating SKU:', error);
      }
    }

    /**
     * Update checkbox state efficiently
     * @private
     * @param {boolean} isValid - Whether the SKU is valid
     */
    updateCheckboxState(isValid) {
      if (!this.checkbox) return;

      if (isValid) {
        this.isChecked = true;
        this.checkbox.value = this.selectedSku;
        this.checkbox.checked = true;
      } else {
        this.checkbox.value = '';
        this.checkbox.checked = false;
      }
    }

    /**
     * Dispatch SKU updated event efficiently
     * @private
     * @param {boolean} isValid - Whether the SKU is valid
     */
    dispatchSkuUpdatedEvent(isValid) {
      this.dispatchEvent(new CustomEvent('buy-together-sku-updated', {
        bubbles: true,
        detail: { isValid }
      }));
    }

    /**
     * Update the disabled state of form elements
     * @private
     * @param {boolean} disabled - Whether to disable the elements
     */
    updateFormDisabledState(disabled = null) {
      // First product should always have its variations enabled
      if (this.isFirst) return;

      // If disabled is not explicitly passed, determine from checkbox state
      const shouldDisable = disabled ?? !this.isChecked;

      // Use cached elements for better performance
      if (this.formElements) {
        for (const element of this.formElements) {
          element.disabled = shouldDisable;
        }
      }
    }
  }

  customElements.define('buy-together-product', BuyTogetherProduct);
}
