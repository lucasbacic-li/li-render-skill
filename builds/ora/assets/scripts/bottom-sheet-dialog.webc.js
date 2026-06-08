if (!customElements.get('bottom-sheet-dialog')) {
  /**
   * BottomSheetDialog Web Component
   * 
   * A custom element that manages a bottom sheet dialog with overlay.
   * Supports opening/closing via the `active` class and handles
   * click events on elements with the `.bottom-sheet-close` class.
   * 
   * @class BottomSheetDialog
   * @extends HTMLElement
   * 
   * @example
   * <bottom-sheet-dialog class="bottom-sheet active">
   *   <div class="bottom-sheet-overlay bottom-sheet-close"></div>
   *   <div class="bottom-sheet-content">...</div>
   * </bottom-sheet-dialog>
   */
  class BottomSheetDialog extends HTMLElement {
    constructor() {
      super();
      /** @private {boolean} Internal active state */
      this._active = false;
      /** @private {NodeListOf<Element>|null} Reference to close trigger elements */
      this.closeElements = null;
      /** @private {Function} Bound reference to handleClose for proper cleanup */
      this.handleClose = this.handleClose.bind(this);
      /** @private {Function} Bound viewport sync (iOS keyboard) */
      this._syncViewport = this._syncViewport.bind(this);
    }

    /**
     * Cola o elemento (fixed) na viewport VISÍVEL (visualViewport). No iOS,
     * quando o teclado abre, `position:fixed` continua relativo à layout
     * viewport (atrás do teclado) → a página aparece por baixo do sheet. Tracar
     * a visualViewport faz o overlay/sheet cobrirem só a área visível acima do
     * teclado, sem vazar a página.
     * @private
     */
    _syncViewport() {
      const vv = window.visualViewport;
      if (!vv) return;
      this.style.position = 'fixed';
      this.style.top = vv.offsetTop + 'px';
      this.style.left = vv.offsetLeft + 'px';
      this.style.right = 'auto';
      this.style.bottom = 'auto';
      this.style.width = vv.width + 'px';
      this.style.height = vv.height + 'px';
    }

    /** @private */
    _startViewportSync() {
      if (!window.visualViewport) return;
      this._syncViewport();
      window.visualViewport.addEventListener('resize', this._syncViewport);
      window.visualViewport.addEventListener('scroll', this._syncViewport);
    }

    /** @private */
    _stopViewportSync() {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', this._syncViewport);
        window.visualViewport.removeEventListener('scroll', this._syncViewport);
      }
      this.style.position = this.style.top = this.style.left = '';
      this.style.right = this.style.bottom = this.style.width = this.style.height = '';
    }

    /**
     * Gets the current active state of the bottom sheet
     * @returns {boolean} True if the bottom sheet is active, false otherwise
     */
    get active() {
      return this._active;
    }

    /**
     * Sets the active state of the bottom sheet
     * @param {boolean} value - The new active state
     */
    set active(value) {
      const newValue = Boolean(value);

      if (this._active === newValue) return;

      this._active = newValue;

      if (this._active) {
        this.classList.add('active');
        this._startViewportSync();
      } else {
        this.classList.remove('active');
        this._stopViewportSync();
      }
    }

    /**
     * Called when the element is connected to the DOM
     * Sets up event listeners and initializes the component
     */
    connectedCallback() {
      // O sheet é carregado (HTMX) DENTRO da drawer do minicart, que usa
      // `transform: translateX(...)` pro slide. Um ancestral com transform vira
      // o containing block de `position:fixed` → no mobile, quando o teclado
      // abre, o overlay deixa de cobrir a viewport toda e a página aparece por
      // baixo (acessório do teclado iOS mostra o conteúdo atrás). Reparentar pro
      // <body> faz o fixed voltar a ser relativo à viewport.
      if (this.parentElement !== document.body && !this._reparented) {
        // limpa sheets órfãos de aberturas anteriores
        document.querySelectorAll('body > bottom-sheet-dialog').forEach((el) => {
          if (el !== this) el.remove();
        });
        this._reparented = true;
        document.body.appendChild(this); // dispara disconnect+reconnect
        return;
      }
      this._active = this.classList.contains('active');
      this._setupEventListeners();
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
      this.closeElements = this.querySelectorAll('.bottom-sheet-close');
      this.closeElements.forEach((el) => {
        el.addEventListener('click', this.handleClose);
      });
    }

    /**
     * Removes all event listeners
     * @private
     */
    _cleanupEventListeners() {
      if (this.closeElements) {
        this.closeElements.forEach((el) => {
          el.removeEventListener('click', this.handleClose);
        });
      }
    }

    /**
     * Handles click events on close elements
     * @param {Event} event - The click event
     */
    handleClose(event) {
      this.close();
    }

    /**
     * Opens the bottom sheet dialog
     */
    open() {
      this.active = true;
    }

    /**
     * Closes the bottom sheet dialog
     */
    close() {
      this.active = false;
      // foi reparentado pro <body>; remove após a transição p/ não acumular
      if (this._reparented) {
        setTimeout(() => { if (!this._active) this.remove(); }, 350);
      }
    }

    /**
     * Toggles the bottom sheet dialog state
     */
    toggle() {
      this.active = !this._active;
    }
  }

  customElements.define('bottom-sheet-dialog', BottomSheetDialog);
}
