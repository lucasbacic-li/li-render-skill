if (!customElements.get('product-zoom-drawer')) {
  /**
   * Product Zoom Drawer Web Component
   * 
   * Drawer que abre de baixo para cima para visualizar imagens do produto em alta resolução
   * 
   * @class ProductZoomDrawer
   * @extends HTMLElement
   * 
   * @example
   * ```html
   * <product-zoom-drawer id="product-zoom-drawer">
   *   <div class="product-zoom-overlay" data-close></div>
   *   <div class="product-zoom-content">
   *     <button data-close>Close</button>
   *     <!-- Images -->
   *   </div>
   * </product-zoom-drawer>
   * ```
   * 
   * @method open() - Abre a drawer
   * @method close() - Fecha a drawer
   */
  class ProductZoomDrawer extends HTMLElement {
    /**
     * Creates an instance of ProductZoomDrawer
     */
    constructor() {
      super();
      this.escapeHandler = this.handleEscape.bind(this);
    }

    /**
     * Called when the element is inserted into the DOM
     * Initializes event listeners
     */
    connectedCallback() {
      this.setupEventListeners();
    }

    /**
     * Called when the element is removed from the DOM
     * Cleans up event listeners
     */
    disconnectedCallback() {
      document.removeEventListener('keydown', this.escapeHandler);
    }

    /**
     * Set up event listeners for closing the drawer
     * @private
     */
    setupEventListeners() {
      // Fechar ao clicar no overlay ou em elementos com data-close
      this.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', () => this.close());
      });

      // Fechar com tecla ESC
      document.addEventListener('keydown', this.escapeHandler);
    }

    /**
     * Handle escape key press
     * @private
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleEscape(e) {
      if (e.key === 'Escape' && this.classList.contains('active')) {
        this.close();
      }
    }

    /**
     * Opens the drawer
     * @public
     */
    open() {
      this.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    /**
     * Closes the drawer
     * @public
     */
    close() {
      this.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  customElements.define('product-zoom-drawer', ProductZoomDrawer);
}
