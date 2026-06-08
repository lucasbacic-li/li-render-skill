if (!customElements.get('product-sku-selector')) {
  /**
   * Custom element for product SKU selection functionality
   * Manages product variation options and triggers image updates
   * @class ProductSkuSelector
   * @extends HTMLElement
   */
  class ProductSkuSelector extends HTMLElement {
    /**
     * Creates an instance of ProductSkuSelector
     * Initializes variation state and event handlers
     */
    constructor() {
      super();
      /** @private {Object} Storage for variation selections */
      this.variations = {};
      /** @private {Object} Storage for related images per option */
      this.relatedImages = {};
      /** @private {Map<string, HTMLElement>} Cache for hidden inputs */
      this.hiddenInputsCache = new Map();
      /** @private {number} Number of variations for validation */
      this.variationCount = 0;
      /** @private {number} Throttle timer for checkSelectedOptions */
      this.updateTimer = null;
      /** @private {Array} Array of product SKUs with their variations */
      this.productSkus = [];
      /** @private {Set} Set of valid variation combinations */
      this.validCombinations = new Set();
    }

    /**
     * Called when the element is inserted into the DOM
     * Initializes the component and sets up event listeners
     */
    connectedCallback() {
      const form = this.querySelector('form');
      if (!form) return;

      this.initializeSKUs();
      this.initializeFromDOM(form);
      this.updateAvailableOptions();

      form.addEventListener('change', this.handleChange);
    }

    /**
     * Called when the element is removed from the DOM
     * Clean up event listeners and timers
     */
    disconnectedCallback() {
      const form = this.querySelector('form');
      if (form) form.removeEventListener('change', this.handleChange);

      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
        this.updateTimer = null;
      }

      this.hiddenInputsCache.clear();
    }

    /**
     * Initialize SKUs data from embedded JSON script tag
     * Build valid combinations map for validation
     * @private
     */
    initializeSKUs() {
      // Get SKUs data from embedded JSON script tag
      const dataScript = this.querySelector('script[type="application/json"][data-skus]');
      if (dataScript) {
        try {
          this.productSkus = JSON.parse(dataScript.textContent);
        } catch (error) {
          console.error('ProductSkuSelector: Failed to parse SKUs data', error);
          this.productSkus = [];
        }
      }

      if (this.productSkus.length === 0) return;

      try {
        this.productSkus.forEach(sku => {
          if (!sku.active) return;

          const combinationParts = sku.variations.map(v =>
            `${this.decodeHTML(v.option.display_name)}..${v.option.id}..${this.decodeHTML(v.value.name)}..${v.value.id}`
          ).sort();

          const combinationKey = combinationParts.join('||');
          this.validCombinations.add(combinationKey);

          sku.variations.forEach((v, index) => {
            const partialKey = `${this.decodeHTML(v.option.display_name)}..${v.option.id}..${this.decodeHTML(v.value.name)}..${v.value.id}`;
            this.validCombinations.add(partialKey);
          });
        });
      } catch (error) {
        console.error('❌ Erro ao processar SKUs:', error);
      }
    }

    /**
     * Initialize component state from DOM elements
     * @private
     * @param {HTMLFormElement} form - The form element
     */
    initializeFromDOM(form) {
      const fieldsets = form.querySelectorAll('fieldset[data-variation-ref]');
      this.variationCount = fieldsets.length;

      fieldsets.forEach(fieldset => {
        const variationRef = fieldset.dataset.variationRef;
        const selectedValue = fieldset.dataset.variationSelected;

        this.variations[variationRef] = { selected_option: selectedValue };

        const hiddenInput = fieldset.querySelector(`input[name="selected_variation[]"]`);
        if (hiddenInput) {
          this.hiddenInputsCache.set(variationRef, hiddenInput);
        }

        const radioInputs = fieldset.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(radio => {
          const label = radio.closest('label');
          if (label?.dataset.relatedImages) {
            try {
              this.relatedImages[radio.value] = JSON.parse(label.dataset.relatedImages);
            } catch (error) {
              this.relatedImages[radio.value] = [];
            }
          }
          if (radio.checked) {
            setTimeout(() => {
              this.triggerImageUpdate(radio.value);
            }, 200);
          }
        });
      });

      this.updateControlInputs();
    }

    /**
     * Handle change events using arrow function for automatic binding
     * @private
     * @param {Event} event - Change event
     */
    handleChange = (event) => {
      if (event.target.type !== 'radio') return;

      const fieldset = event.target.closest('fieldset');
      const variationRef = fieldset?.dataset.variationRef;
      if (!variationRef) return;

      const optionRef = event.target.value;

      this.variations[variationRef].selected_option = optionRef;
      this.updateSingleInput(variationRef, optionRef);
      this.triggerImageUpdate(optionRef);

      const clearedSelections = this.clearInvalidSelections(variationRef);

      this.updateAvailableOptions();

      if (!clearedSelections) {
        this.scheduleOptionsCheck();
      }
    }

    /**
     * Clear selections in other variations if they don't form valid combinations
     * Uses a greedy approach: keeps the changed selection and tries to find
     * the best valid combination with other existing selections
     * @private
     * @param {string} changedVariationRef - The variation that was just changed
     * @returns {boolean} - True if any selection was cleared
     */
    clearInvalidSelections(changedVariationRef) {
      const form = this.querySelector('form');
      if (!form) return false;

      let clearedAny = false;

      // Get current selections
      const currentSelections = {};
      for (const [varRef, varData] of Object.entries(this.variations)) {
        if (varData.selected_option) {
          currentSelections[varRef] = varData.selected_option;
        }
      }

      const isCurrentValid = this.isValidCombination(currentSelections);

      if (!isCurrentValid) {

        // Get all variation refs except the changed one
        const otherVariationRefs = Object.keys(this.variations)
          .filter(ref => ref !== changedVariationRef && this.variations[ref].selected_option);

        // Try to find the largest valid subset that includes the changed variation
        // Start with all selections and progressively remove incompatible ones
        const validSelections = { [changedVariationRef]: currentSelections[changedVariationRef] };

        // Sort other variations to check them in order (to maintain consistency)
        for (const varRef of otherVariationRefs) {
          const testSelections = { ...validSelections, [varRef]: currentSelections[varRef] };
          const wouldBeValid = this.isValidCombination(testSelections);

          if (wouldBeValid) {
            validSelections[varRef] = currentSelections[varRef];
          }
        }

        // Now clear any selections that are not in validSelections
        const fieldsets = form.querySelectorAll('fieldset[data-variation-ref]');
        fieldsets.forEach(fieldset => {
          const varRef = fieldset.dataset.variationRef;

          if (varRef === changedVariationRef) return;

          const checkedRadio = fieldset.querySelector('input[type="radio"]:checked');
          if (checkedRadio && !validSelections[varRef]) {
            checkedRadio.checked = false;
            this.variations[varRef].selected_option = null;
            this.updateSingleInput(varRef, '');
            clearedAny = true;
          }
        });
      }

      if (clearedAny) {
        this.triggerFormUpdate();
      }

      return clearedAny;
    }

    /**
     * Update a single hidden input efficiently
     * @private
     * @param {string} variationRef - The variation reference
     * @param {string} optionRef - The selected option reference
     */
    updateSingleInput(variationRef, optionRef) {
      const hiddenInput = this.hiddenInputsCache.get(variationRef);
      if (hiddenInput) {
        hiddenInput.value = `${variationRef}..${optionRef}`;
      }
    }

    /**
     * Update available options based on current selections
     * Applies visual hints (opacity) for unavailable combinations
     * @private
     */
    updateAvailableOptions() {
      if (this.productSkus.length === 0) return;

      const form = this.querySelector('form');
      if (!form) return;

      const currentSelections = {};
      for (const [varRef, varData] of Object.entries(this.variations)) {
        if (varData.selected_option) {
          currentSelections[varRef] = varData.selected_option;
        }
      }

      if (Object.keys(currentSelections).length === 0) {
        this.clearAllVisualHints();
        return;
      }

      const fieldsets = form.querySelectorAll('fieldset[data-variation-ref]');

      fieldsets.forEach(fieldset => {
        const variationRef = fieldset.dataset.variationRef;
        const radioInputs = fieldset.querySelectorAll('input[type="radio"]');

        radioInputs.forEach(radio => {
          const optionRef = radio.value;
          const label = radio.closest('label');
          if (!label) return;

          if (radio.checked) {
            label.classList.remove('opacity-30', 'tooltip', 'tooltip-top');
            label.removeAttribute('data-tip');
            return;
          }

          // Build test selections: current selections + this option (replacing if same variation)
          const testSelections = { ...currentSelections, [variationRef]: optionRef };
          const isValid = this.isValidCombination(testSelections);

          if (!isValid) {
            label.classList.add('opacity-30');
          } else {
            label.classList.remove('opacity-30');
          }
        });
      });
    }

    /**
     * Clear all visual hints from options
     * @private
     */
    clearAllVisualHints() {
      const form = this.querySelector('form');
      if (!form) return;

      const allLabels = form.querySelectorAll('label');
      allLabels.forEach(label => {
        label.classList.remove('opacity-30');
      });
    }

    /**
     * Check if a combination of selections is valid (forms an existing SKU)
     * @private
     * @param {Object} selections - Object with variationRef: optionRef pairs
     * @returns {boolean} - True if combination exists
     */
    isValidCombination(selections) {
      const selectedRefs = Object.entries(selections)
        .filter(([_, optionRef]) => optionRef)
        .map(([varRef, optionRef]) => `${varRef}..${optionRef}`);

      if (selectedRefs.length === 0) return true;

      return this.productSkus.some(sku => {
        if (!sku.active) return false;

        return selectedRefs.every(selectionRef => {
          return sku.variations.some(v => {
            const skuVariationKey = `${this.decodeHTML(v.option.display_name)}..${v.option.id}..${this.decodeHTML(v.value.name)}..${v.value.id}`;
            return skuVariationKey === selectionRef;
          });
        });
      });
    }

    /**
     * Update all hidden input values with current selections
     * @private
     */
    updateControlInputs() {
      for (const [variationRef, variation] of Object.entries(this.variations)) {
        if (variation.selected_option) {
          this.updateSingleInput(variationRef, variation.selected_option);
        }
      }
    }

    /**
     * Trigger image update for the selected option
     * @private
     * @param {string} optionRef - The selected option reference
     */
    triggerImageUpdate(optionRef) {
      const relatedImages = this.relatedImages[optionRef];
      if (relatedImages?.[0]) {
        window.dispatchEvent(new CustomEvent('li:set-selected-image-by-id', {
          detail: { id: relatedImages[0] }
        }));
      }
    }

    /**
     * Schedule options check with throttling to prevent excessive calls
     * @private
     */
    scheduleOptionsCheck() {
      if (this.updateTimer) clearTimeout(this.updateTimer);

      this.updateTimer = setTimeout(() => {
        this.checkSelectedOptions();
        this.updateTimer = null;
      }, 16); // ~60fps throttling
    }

    /**
     * Check if all variations are selected and trigger form submission
     * @private
     */
    checkSelectedOptions() {
      // Dispatch product variation changed event
      window.dispatchEvent(new CustomEvent('product-variation-changed', {
        detail: { variations: this.variations }
      }));

      // Fast validation using counter instead of array iteration
      let selectedCount = 0;
      for (const variation of Object.values(this.variations)) {
        if (variation.selected_option?.trim()) selectedCount++;
      }

      if (selectedCount === this.variationCount) {
        this.triggerFormUpdate();
      }
    }

    /**
     * Trigger form update when all options are selected
     * @private
     */
    triggerFormUpdate() {
      const url = new URL(location);
      url.searchParams.delete('selected_variation[]');
      url.searchParams.delete('sku');
      history.replaceState(null, document.title, url.pathname + url.search + url.hash);

      this.updateControlInputs();

      requestAnimationFrame(() => {
        const form = this.querySelector('form');
        if (typeof htmx !== 'undefined' && form) {
          htmx.trigger(form, 'htmx:abort');
          htmx.trigger(form, 'li-prod-options-selected');
        }
      });
    }

    // Helper to decode HTML entities
    decodeHTML(html) {
      const txt = document.createElement('textarea');
      txt.innerHTML = html;
      return txt.value;
    }
  }

  customElements.define('product-sku-selector', ProductSkuSelector);
}
