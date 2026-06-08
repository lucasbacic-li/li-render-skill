if (!customElements.get('minicart-drawer')) {
  /**
   * MinicartDrawer Web Component
   * 
   * A custom element that manages the minicart drawer functionality including
   * opening/closing the drawer, updating total items count, and handling
   * HTMX interactions for cart updates.
   * 
   * @class MinicartDrawer
   * @extends HTMLElement
   * 
   * @fires open-minicart - Custom event to open the minicart drawer
   * @listens open-minicart - Window event to handle opening the drawer
   * @listens change - Drawer toggle checkbox change event
   */
  class MinicartDrawer extends HTMLElement {
    constructor() {
      super();
      /** @private {boolean} Internal open state */
      this._open = false;
      /** @private {HTMLInputElement|null} Reference to the drawer toggle checkbox */
      this.drawerToggle = null;
      /** @private {Function} Bound reference to handleToggleChange for proper cleanup */
      this.handleToggleChange = this.handleToggleChange.bind(this);
      /** @private {Function} Bound reference to handleOpenMinicart for proper cleanup */
      this.handleOpenMinicart = this.handleOpenMinicart.bind(this);
    }

    /**
     * Gets the current open state of the drawer
     * @returns {boolean} True if the drawer is open, false otherwise
     */
    get open() {
      return this._open;
    }

    /**
     * Sets the open state of the drawer and triggers appropriate actions
     * @param {boolean} value - The new open state
     */
    set open(value) {
      const newValue = Boolean(value);

      if (this._open === newValue) return;

      this._open = newValue;

      if (this.drawerToggle && this.drawerToggle.checked !== this._open) {
        this.drawerToggle.checked = this._open;
      }

      if (this._open) {
        this.triggerUpdateMinicart();
      }
    }

    /**
     * Called when the element is connected to the DOM
     * Sets up event listeners and initializes the component
     */
    connectedCallback() {
      this.updateMinicartTotalItems();
      this._setupEventListeners();

      if (localStorage.getItem("li_should_update_minicart")) {
        setTimeout(() => {
          this.triggerUpdateMinicart();
          localStorage.removeItem("li_should_update_minicart");
        }, 3000);
      }
    }

    /**
     * Called when the element is disconnected from the DOM
     * Cleans up event listeners to prevent memory leaks
     */
    disconnectedCallback() {
      this._cleanupEventListeners();
    }

    /**
     * Sets up all necessary event listeners
     * @private
     */
    _setupEventListeners() {
      this.drawerToggle = document.querySelector('#header-minicart-drawer-toggle');
      if (this.drawerToggle)
        this.drawerToggle.addEventListener('change', this.handleToggleChange);
      window.addEventListener('open-minicart', this.handleOpenMinicart);
    }

    /**
     * Removes all event listeners
     * @private
     */
    _cleanupEventListeners() {
      if (this.drawerToggle)
        this.drawerToggle.removeEventListener('change', this.handleToggleChange);
      window.removeEventListener('open-minicart', this.handleOpenMinicart);
    }

    /**
     * Handles the drawer toggle checkbox change event
     * @param {Event} event - The change event from the checkbox
     */
    handleToggleChange(event) {
      this.open = event.target.checked;
    }

    /**
     * Handles the custom 'open-minicart' window event
     * Opens the minicart drawer
     */
    handleOpenMinicart() {
      this.open = true;
    }

    /**
     * Updates the minicart total items display
     * Retrieves the count from parameter, localStorage, or defaults to 0
     * 
     * @param {number} [quantity] - Optional quantity to set directly
     */
    updateMinicartTotalItems(quantity) {
      if (quantity != null) localStorage.setItem("li-minicart-total-items", quantity);
      const totalItems = quantity ?? localStorage.getItem("li-minicart-total-items") ?? 0;
      const totalItemsElements = document.querySelectorAll(".header-minicart-totalitems");
      totalItemsElements.forEach(element => {
        element.textContent = String(totalItems);
      });
    }

    /**
     * Triggers an HTMX request to update the minicart
     */
    triggerUpdateMinicart() {
      const minicartElement = document.querySelector('#header-minicart-content');
      if (minicartElement && !minicartElement.classList.contains('htmx-request')) {
        htmx.trigger(minicartElement, 'li-update-minicart');
      }
    }
  }
  customElements.define('minicart-drawer', MinicartDrawer);
}
