if (!customElements.get('segmented-price-cep')) {
  /**
   * Custom element for segmented price CEP selection
   * Handles the CEP popup modal and displays the current CEP
   * @class SegmentedPriceCep
   * @extends HTMLElement
   */
  class SegmentedPriceCep extends HTMLElement {
    constructor() {
      super();

      /** @type {HTMLDialogElement|null} */
      this.dialog = null;

      /** @type {HTMLFormElement|null} */
      this.form = null;

      /** @type {HTMLButtonElement|null} */
      this.openButton = null;

      /** @type {boolean} Whether to auto-trigger the popup */
      this._popupTrigger = true;

      // Bind methods
      this._handleOpenClick = this._handleOpenClick.bind(this);
      this._handleHtmxAfterRequest = this._handleHtmxAfterRequest.bind(this);
    }

    /**
     * Called when the element is connected to the DOM
     * @returns {void}
     */
    connectedCallback() {
      // Query elements after connected to DOM
      this.dialog = this.querySelector('dialog');
      this.form = this.querySelector('.segmented-price-form');
      this.openButton = this.querySelector('.segmented-price-btn');
      this._popupTrigger = this.getAttribute('data-popup-trigger') !== 'false';

      this._setupEventListeners();
      this._initCepState();
    }

    /**
     * Called when the element is disconnected from the DOM
     * @returns {void}
     */
    disconnectedCallback() {
      this._cleanupEventListeners();
    }

    /**
     * Sets up event listeners
     * @private
     */
    _setupEventListeners() {
      this.openButton?.addEventListener('click', this._handleOpenClick);
      this.form?.addEventListener('htmx:afterRequest', this._handleHtmxAfterRequest);
    }

    /**
     * Removes event listeners
     * @private
     */
    _cleanupEventListeners() {
      this.openButton?.removeEventListener('click', this._handleOpenClick);
      this.form?.removeEventListener('htmx:afterRequest', this._handleHtmxAfterRequest);
    }

    /**
     * Reads a cookie value by name
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value or null
     * @private
     */
    _getCookie(name) {
      const cookieName = `${name}=`;
      const cookies = document.cookie.split(';');

      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(cookieName) === 0) {
          return decodeURIComponent(cookie.substring(cookieName.length));
        }
      }
      return null;
    }

    /**
     * Formats a CEP for display
     * @param {string} cep - The CEP value
     * @returns {string} Formatted CEP
     * @private
     */
    _formatCep(cep) {
      const cleanCep = cep.replace('-', '');
      if (cleanCep.indexOf('*') < 0) {
        return cleanCep.substring(0, 5) + '-' + cleanCep.substring(5, 8);
      }
      return '*****-*' + cleanCep.slice(-2);
    }

    /**
     * Initializes the CEP state from cookie
     * @private
     */
    _initCepState() {
      const cookieCep = this._getCookie('cep');

      if (cookieCep) {
        this._showCurrentCep(cookieCep);
      } else if (this._popupTrigger) {
        // Show popup after 5 seconds delay
        setTimeout(() => this._openModal(), 5000);
      }
    }

    /**
     * Updates the UI to show the current CEP
     * @param {string} cep - The CEP value
     * @private
     */
    _showCurrentCep(cep) {
      const formattedCep = this._formatCep(cep);
      const emptySpan = this.querySelector('[data-cep-empty]');
      const filledSpan = this.querySelector('[data-cep-filled]');
      const currentSpan = this.querySelector('[data-cep-current]');

      if (emptySpan) emptySpan.classList.add('hidden');
      if (filledSpan) filledSpan.classList.remove('hidden');
      if (currentSpan) currentSpan.textContent = formattedCep;
    }

    /**
     * Opens the modal dialog
     * @private
     */
    _openModal() {
      this.dialog?.showModal();
    }

    /**
     * Closes the modal dialog
     * @private
     */
    _closeModal() {
      this.dialog?.close();
    }

    /**
     * Handles click on the open button
     * @param {Event} event
     * @private
     */
    _handleOpenClick(event) {
      event.preventDefault();
      this._openModal();
    }

    /**
     * Handles htmx after request event
     * @param {CustomEvent} event
     * @private
     */
    _handleHtmxAfterRequest(event) {
      const errorEl = this.querySelector('.segmented-price-error');

      if (event.detail.successful) {
        errorEl?.classList.add('hidden');
        location.reload();
      } else {
        errorEl?.classList.remove('hidden');
        errorEl?.setAttribute('aria-hidden', 'false');
      }
    }
  }

  customElements.define('segmented-price-cep', SegmentedPriceCep);
}
