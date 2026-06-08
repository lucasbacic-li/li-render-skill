if (!customElements.get('cookie-alert')) {
  /**
   * Custom element for cookie consent alert
   * @class CookieAlert
   * @extends HTMLElement
   */
  class CookieAlert extends HTMLElement {
    constructor() {
      super();
      /** @type {boolean} */
      this._open = false;
      /** @type {string|null} */
      this.policyUpdatedDate = this.getAttribute('data-policy-updated-date');
      /** @type {string|null} */
      this.storageValue = localStorage.getItem('li-aceite-cookies');
    }

    /**
     * Gets the open state of the cookie alert
     * @returns {boolean} The open state
     */
    get open() {
      return this._open;
    }

    /**
     * Sets the open state of the cookie alert
     * @param {boolean} value - The new open state
     */
    set open(value) {
      this._open = value;
      this.toggleVisibility();
    }

    /**
     * Toggles the visibility of the cookie alert based on open state
     * @returns {void}
     */
    toggleVisibility() {
      if (this._open) {
        this.classList.add('block');
        this.classList.remove('hidden');
      } else {
        this.classList.add('hidden');
        this.classList.remove('block');
      }
    }

    /**
     * Called when element is connected to the DOM
     * @returns {void}
     */
    connectedCallback() {
      if (!!this.policyUpdatedDate) {
        this.policyUpdatedDate = new Date(this.policyUpdatedDate).getTime();
      }
      this.initTimeout();
    }

    /**
     * Initializes the timeout to show the cookie alert
     * @returns {void}
     */
    initTimeout() {
      if (!!this.storageValue) {
        if (!this.policyUpdatedDate) return;
        const acceptedDate = new Date(parseInt(this.storageValue)).getTime();
        if (acceptedDate >= this.policyUpdatedDate) return;
      }

      setTimeout(() => {
        this.open = true;
      }, 5000);
    }

    /**
     * Handles the close action for the cookie alert
     * @returns {void}
     */
    onClose() {
      localStorage.setItem('li-aceite-cookies', this.policyUpdatedDate || Date.now().toString());
      this.open = false;
    }
  }
  customElements.define('cookie-alert', CookieAlert);
}
