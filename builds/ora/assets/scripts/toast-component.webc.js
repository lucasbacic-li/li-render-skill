if (!customElements.get('toast-component')) {
  /**
   * @typedef {'info' | 'success' | 'warning' | 'error'} ToastType
   */

  /**
   * @typedef {Object} ToastOptions
   * @property {ToastType} [type] - The type of toast
   */

  /**
   * @typedef {Object} ToastTypeConfig
   * @property {string} icon - FontAwesome icon name
   * @property {string} class - CSS class for styling
   */

  /**
   * @typedef {Object} ToastDetail
   * @property {string} message - Toast message
   * @property {ToastOptions} opts - Toast options
   */

  /**
   * Custom toast component for displaying notifications
   * @extends HTMLElement
   */
  class ToastComponent extends HTMLElement {
    constructor() {
      super();
      /** @type {HTMLElement | null} */
      this.toastContainer = null;
      /** @type {HTMLTemplateElement | null} */
      this.template = null;
      /** @type {Function} */
      this.handleShowToast = this.handleShowToast.bind(this);
      /** @type {Record<ToastType, ToastTypeConfig>} */
      this.types = {
        info: {
          icon: 'circle-info',
          class: 'alert-info'
        },
        success: {
          icon: 'circle-check',
          class: 'alert-success'
        },
        warning: {
          icon: 'circle-exclamation',
          class: 'alert-warning'
        },
        error: {
          icon: 'circle-xmark',
          class: 'alert-error'
        }
      };
      /** @type {Record<'show' | 'hide', string[]>} */
      this.cssClasses = {
        show: ['opacity-100', 'translate-y-0'],
        hide: ['opacity-0', '-translate-y-2'],
      }
    }
    /**
     * Called when the element is connected to the DOM
     * @returns {void}
     */
    connectedCallback() {
      this.toastContainer = this.querySelector('.toast');
      this.template = this.querySelector('.toast-item');
      this.setupEventListeners();
    }
    /**
     * Called when the element is disconnected from the DOM
     * @returns {void}
     */
    disconnectedCallback() {
      this.removeEventListeners();
    }
    /**
     * Set up event listeners for toast functionality
     * @returns {void}
     */
    setupEventListeners() {
      document.addEventListener('show-toast', this.handleShowToast);
      /**
       * Global toast function
       * @param {string} message - The message to display
       * @param {ToastOptions} [opts] - Toast options
       * @returns {void}
       */
      window.toast = (message, opts) => {
        const event = new CustomEvent('show-toast', {
          detail: { message, opts }
        });
        document.dispatchEvent(event);
      };
    }
    /**
     * Remove event listeners
     * @returns {void}
     */
    removeEventListeners() {
      document.removeEventListener('show-toast', this.handleShowToast);
      window.toast = null;
    }
    /**
     * Handle the show-toast custom event
     * @param {CustomEvent<ToastDetail>} event - The custom event
     * @returns {void}
     */
    handleShowToast(event) {
      const { message, opts } = event.detail;
      this.showToast(message, opts);
    }
    /**
     * Display a toast notification
     * @param {string} message - The message to display
     * @param {ToastOptions} [opts={}] - Toast options
     * @returns {void}
     */
    showToast(message, opts = {}) {
      if (!this.template || !this.toastContainer) return;
      /** @type {ToastTypeConfig | undefined} */
      const currentType = this.types[opts.type];
      /** @type {DocumentFragment} */
      const toastElement = this.template.content.cloneNode(true);
      /** @type {HTMLElement} */
      const output = toastElement.querySelector('output');
      /** @type {HTMLElement} */
      const messageElement = output.querySelector('[data-id="message"]');
      messageElement.textContent = message;
      if (!!currentType) {
        output.classList.add(currentType.class);
        const icon = output.querySelector('[data-id="icon"]');
        icon.setAttribute('xlink:href', `/static/img/fontawesome-solid.svg#${currentType.icon}`);
        icon.setAttribute('href', `/static/img/fontawesome-solid.svg#${currentType.icon}`);
      }
      this.toastContainer.appendChild(toastElement);
      /** @type {HTMLElement} */
      const addedToast = this.toastContainer.lastElementChild;
      /** @type {HTMLButtonElement} */
      const closeButton = addedToast.querySelector('[data-id="close"]');
      closeButton.addEventListener('click', () => {
        this.removeToast(addedToast);
      });
      setTimeout(() => {
        if (addedToast && addedToast.parentNode)
          this.removeToast(addedToast);
      }, 5000);
      requestAnimationFrame(() => {
        addedToast.classList.remove(...this.cssClasses.hide);
        addedToast.classList.add(...this.cssClasses.show);
      });
    }
    /**
     * Remove a toast element with animation
     * @param {HTMLElement} toastElement - The toast element to remove
     * @returns {void}
     */
    removeToast(toastElement) {
      if (!toastElement || !toastElement.parentNode) return;
      toastElement.classList.remove(...this.cssClasses.show);
      toastElement.classList.add(...this.cssClasses.hide);
      setTimeout(() => {
        if (toastElement.parentNode)
          toastElement.parentNode.removeChild(toastElement);
      }, 300);
    }
  }
  customElements.define('toast-component', ToastComponent);
}
