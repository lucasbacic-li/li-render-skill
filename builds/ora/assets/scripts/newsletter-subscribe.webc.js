if (!customElements.get('newsletter-subscribe')) {
  /**
  * Unified custom element for newsletter subscription (both inline and popup)
  * @class NewsletterSubscribe
  * @extends HTMLElement
  */
  class NewsletterSubscribe extends HTMLElement {
    constructor() {
      super();
      /** @type {string|null} */
      this.status = null;
      /** @type {Function} */
      this.changeStatus = this.changeStatus.bind(this);
      /** @type {Function} */
      this.setPopupShown = this.setPopupShown.bind(this);

      // Popup-specific properties
      /** @type {HTMLDialogElement|null} */
      this.dialog = this.querySelector('dialog');
      /** @type {boolean} */
      this._isPopup = this.hasAttribute('data-popup');
      /** @type {string} Storage key name to track if popup has been shown */
      this._shownStorageName = 'li-newsletter-popup-shown';
      /** @type {string} `aguardar` | `imediatamente` | `exit` */
      this._trigger = this.getAttribute('data-trigger');
      /** @type {number} Delay in seconds for the popup to appear */
      this._triggerDelay = parseInt(this.getAttribute('data-trigger-delay'), 10) || 0;
    }

    /**
    * Called when the element is connected to the DOM
    * Sets up event listener for newsletter status changes
    * @returns {void}
    */
    connectedCallback() {
      document.addEventListener('li-newsletter-status', this.changeStatus);

      if (this._isPopup) {
        setTimeout(() => {
          this.showModal();
        }, 2000);
      }
      if (this.dialog) {
        this.dialog.addEventListener('close', this.setPopupShown);
      }
    }

    /**
    * Called when the element is disconnected from the DOM
    * Removes event listener for newsletter status changes
    * @returns {void}
    */
    disconnectedCallback() {
      document.removeEventListener('li-newsletter-status', this.changeStatus);

      if (this.dialog) {
        this.dialog.removeEventListener('close', this.setPopupShown);
      }
    }

    /**
    * Sets a flag in localStorage to indicate the popup has been shown
    * @returns {void}
    */
    setPopupShown() {
      localStorage.setItem(this._shownStorageName, 'true');
    }

    /**
    * Handles newsletter status change events
    * @param {CustomEvent} event - The custom event containing the status
    * @param {Object} event.detail - The event detail object
    * @param {string} event.detail.status - The new status ('success', 'error', etc.)
    * @returns {void}
    */
    changeStatus(event) {
      this.status = event.detail.status;
      const successMessage = event.detail.success_message || null;
      if (successMessage) {
        this.querySelector('.newsletter-success-message').textContent = successMessage;
      };
      this.updateVisibility();
    }

    /**
    * Updates the visibility of elements based on the status
    * @returns {void}
    */
    updateVisibility() {
      const successMessage = this.querySelector('.newsletter-success-message');
      const formContainer = this.querySelector('.newsletter-subscribe-form');
      const errorMessage = this.querySelector('.newsletter-error-message');

      if (this.status === 'success') {
        successMessage?.classList.remove('hidden');
        formContainer?.classList.add('hidden');
        errorMessage?.classList.add('hidden');
      } else {
        successMessage?.classList.add('hidden');
        formContainer?.classList.remove('hidden');
        if (this.status === 'error') {
          errorMessage?.classList.remove('hidden');
        } else {
          errorMessage?.classList.add('hidden');
        }
      }
    }

    /**
    * Displays the modal based on the trigger setting (popup only)
    * @returns {void}
    */
    showModal() {
      if (!this._isPopup && this.dialog) return;
      if (typeof htmx === 'undefined') return;

      const popupShown = localStorage.getItem(this._shownStorageName);
      if (popupShown) return;

      if (this._trigger === 'imediatamente') {
        htmx.trigger(this, 'newsletter-popup-show');
      } else if (this._trigger === 'aguardar') {
        setTimeout(() => {
          htmx.trigger(this, 'newsletter-popup-show');
        }, this._triggerDelay * 1000);
      } else if (this._trigger === 'exit') {
        document.addEventListener('mouseleave', (e) => {
          if (e.clientY <= 0) {
            htmx.trigger(this, 'newsletter-popup-show');
          }
        }, { once: true });
      }
    }
  }
  customElements.define('newsletter-subscribe', NewsletterSubscribe);
}
