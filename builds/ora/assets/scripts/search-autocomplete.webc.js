if (!customElements.get('search-autocomplete')) {
  /**
   * SearchAutocomplete Web Component
   * 
   * A custom element that manages search functionality with autocomplete.
   * Supports two variants: 'dropdown' (desktop) and 'drawer' (mobile).
   * 
   * @class SearchAutocomplete
   * @extends HTMLElement
   * 
   * @example
   * <!-- Dropdown variant (desktop) -->
   * <search-autocomplete variant="dropdown">
   *   <!-- content -->
   * </search-autocomplete>
   * 
   * @example
   * <!-- Drawer variant (mobile) -->
   * <search-autocomplete variant="drawer">
   *   <!-- content -->
   * </search-autocomplete>
   */
  class SearchAutocomplete extends HTMLElement {
    constructor() {
      super();
      /** @private {string} Component variant: 'dropdown' or 'drawer' */
      this.variant = this.getAttribute('variant') || 'dropdown';
      /** @private {boolean} Indicates if the form is submitting */
      this.isSubmitting = false;
      /** @private {HTMLFormElement|null} Reference to the form element */
      this.formElement = null;
      /** @private {HTMLButtonElement|null} Reference to the search icon button */
      this.searchIcon = null;
      /** @private {HTMLButtonElement|null} Reference to the loading icon button */
      this.loadingIcon = null;
      /** @private {Function} Bound reference to handleFormSubmit for loading state */
      this.handleFormSubmit = this.handleFormSubmit.bind(this);
    }

    /**
     * Called when the element is connected to the DOM
     */
    connectedCallback() {
      this._initializeElements();
      this._setupEventListeners();
    }

    /**
     * Called when the element is disconnected from the DOM
     */
    disconnectedCallback() {
      this._cleanupEventListeners();
    }

    /**
     * Initializes element references
     * @private
     */
    _initializeElements() {
      // Use data attributes instead of IDs for better reusability
      this.formElement = this.querySelector('[data-id="search-form"]');
      this.searchIcon = this.querySelector('[data-id="search-icon"]');
      this.loadingIcon = this.querySelector('[data-id="loading-icon"]');
    }

    /**
     * Sets up all necessary event listeners
     * @private
     */
    _setupEventListeners() {
      if (this.formElement) {
        this.formElement.addEventListener('submit', this.handleFormSubmit);
      }
    }

    /**
     * Removes all event listeners
     * @private
     */
    _cleanupEventListeners() {
      if (this.formElement) {
        this.formElement.removeEventListener('submit', this.handleFormSubmit);
      }
    }

    /**
     * Handle form submission
     * @param {SubmitEvent} e - The form submit event
     * @returns {void}
     */
    handleFormSubmit(e) {
      this.isSubmitting = true;
      this.updateSubmitButton();
    }

    /**
     * Update submit button loading state
     * @returns {void}
     */
    updateSubmitButton() {
      if (this.isSubmitting) {
        this.searchIcon.classList.add('hidden');
        this.loadingIcon.classList.remove('hidden');
      } else {
        this.searchIcon.classList.remove('hidden');
        this.loadingIcon.classList.add('hidden');
      }
    }
  }

  customElements.define('search-autocomplete', SearchAutocomplete);
}
