if (!customElements.get('floating-buy-button')) {
  /**
   * Floating Buy Button Web Component
   * Manages the visibility of the floating buy button and the drawer for SKU selection
   * @class FloatingBuyButton
   * @extends HTMLElement
   */
  class FloatingBuyButton extends HTMLElement {
    constructor() {
      super();
      /** @private {IntersectionObserver|null} Observer to detect when the main button is out of the screen */
      this.observer = null;
      /** @private {HTMLElement|null} Reference to the floating button */
      this.floatingButton = null;
      /** @private {HTMLElement|null} Reference to the floating bar of the header */
      this.floatingBar = null;
      /** @private {HTMLElement|null} Reference to the bottom sheet */
      this.bottomSheet = null;
      /** @private {boolean} If the product has variations */
      this.hasVariations = false;
      /** @private {boolean} Current visibility state */
      this.isFloatingButtonVisible = false;
      /** @private {number|null} Debounce timeout ID */
      this.debounceTimeout = null;
    }

    /**
     * Called when the element is connected to the DOM
     */
    connectedCallback() {
      this.floatingButton = document.getElementById('floating-buy-button');
      this.floatingBar = document.getElementById('floating-bar');
      this.bottomSheet = document.getElementById('floating-buy-sheet');

      // Read hasVariations from data attribute
      this.hasVariations = this.floatingButton?.dataset.hasVariations === 'true';

      if (!this.floatingButton) return;

      // Garantir que começa oculto
      this.hideFloatingButton();

      this.setupIntersectionObserver();
      this.setupEventListeners();
    }

    /**
     * Called when the element is removed from the DOM
     */
    disconnectedCallback() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }

    /**
     * Setup IntersectionObserver to watch the main buy button
     * @private
     */
    setupIntersectionObserver() {
      const mainBuyButton = document.getElementById('btn-add-to-cart');
      if (!mainBuyButton) {
        return;
      }

      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const isAboveViewport = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          if (isAboveViewport) {
            this.showFloatingButton();
            this.hideFloatingBar();
          } else {
            this.hideFloatingButton();
            this.showFloatingBar();
          }
        });
      }, options);

      this.observer.observe(mainBuyButton);
    }

    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
      // Close bottom sheet
      document.addEventListener('click', (e) => {
        if (e.target.matches('[data-action="close-floating-buy"]')) {
          this.closeBottomSheet();
        }
      });

      // Close after adding to cart
      document.addEventListener('htmx:afterRequest', (event) => {
        if (event.detail.successful && event.detail.xhr.responseURL.includes('/add')) {
          this.closeBottomSheet();
          window.dispatchEvent(new CustomEvent('open-minicart'));
        }
      });

      // Re-observe button after HTMX updates
      document.addEventListener('htmx:afterSwap', (event) => {
        // Se o swap foi no product-summary, reconectar observer
        if (event.detail.target.id === 'product-summary' ||
          event.detail.target.closest('#product-summary')) {
          this.reconnectObserver();
        }
      });
    }

    /**
     * Reconnect IntersectionObserver to the main buy button
     * @private
     */
    reconnectObserver() {
      // Disconnect existing observer
      if (this.observer) {
        this.observer.disconnect();
      }

      // Wait for DOM to update
      requestAnimationFrame(() => {
        this.setupIntersectionObserver();
      });
    }

    /**
     * Show floating button
     * @private
     */
    showFloatingButton() {
      if (this.floatingButton) {
        this.floatingButton.classList.remove('translate-y-full', 'pointer-events-none', 'opacity-0');
        this.floatingButton.classList.add('translate-y-0', 'pointer-events-auto', 'opacity-100');
      }
    }

    /**
     * Hide floating button
     * @private
     */
    hideFloatingButton() {
      if (this.floatingButton) {
        this.floatingButton.classList.add('translate-y-full', 'pointer-events-none', 'opacity-0');
        this.floatingButton.classList.remove('translate-y-0', 'pointer-events-auto', 'opacity-100');
      }
    }

    /**
     * Show floating bar (header)
     * @private
     */
    showFloatingBar() {
      if (this.floatingBar) {
        this.floatingBar.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none');
      }
    }

    /**
     * Hide floating bar (header)
     * @private
     */
    hideFloatingBar() {
      if (this.floatingBar) {
        this.floatingBar.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none');
      }
    }

    /**
     * Close bottom sheet
     * @private
     */
    closeBottomSheet() {
      if (this.bottomSheet) {
        this.bottomSheet.classList.remove('active');
      }
    }
  }

  customElements.define('floating-buy-button', FloatingBuyButton);
}
