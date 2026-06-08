if (!customElements.get('input-mask')) {
  /**
   * IMask Web Component for dynamic input masking
   * 
   * This custom element provides input masking functionality using the IMask library.
   * It automatically loads the IMask library on demand and applies masks to input elements.
   * 
   * @class IMaskWebComponent
   * @extends HTMLElement
   * 
   * @example
   * ```html
   * <input-mask>
   *   <input type="tel" data-mask="phone" />
   * </input-mask>
   * ```
   * 
   * @example
   * ```html
   * <input-mask>
   *   <input type="text" data-mask="(00) 0000-0000" />
   * </input-mask>
   * ```
   */
  class IMaskWebComponent extends HTMLElement {
    /**
     * Predefined mask patterns for common input types
     * @type {Object.<string, string|Array<string>>}
     * @static
     * @readonly
     */
    static PREDEFINED_MASKS = Object.freeze({
      phone: ['(00) 0000-0000', '(00) 00000-0000'],
      zipcode: '00000-000',
      cpf: '000.000.000-00',
      cnpj: '00.000.000/0000-00',
      date: '00/00/0000',
      time: '00:00',
      currency: 'R$ num',
    });

    /**
     * IMask library local URL
     * @type {string}
     * @static
     * @readonly
     */
    static get IMASK_CDN_URL() {
      return document.querySelector('meta[name="imask-cdn"]')?.getAttribute('content');
    }

    /**
     * Creates an instance of IMaskWebComponent
     * Initializes component state and binds methods
     */
    constructor() {
      super();

      /** @type {HTMLInputElement|null} The input element to apply masking to */
      this.input = null;

      /** @type {IMask.InputMask|null} The IMask instance */
      this._iMask = null;

      /** @type {boolean} Whether the IMask library has been loaded */
      this._iMaskLoaded = false;

      /** @type {string|Array<string>|null} The mask pattern to apply */
      this.mask = null;

      /** @type {Object|null} Additional IMask options */
      this.maskOptions = null;

      // Bind methods to preserve context
      this._handleInputChange = this._handleInputChange.bind(this);
      this._handleInputFocus = this._handleInputFocus.bind(this);
    }

    /**
     * Called when the element is connected to the DOM
     * Initializes the input masking functionality
     * @returns {void}
     */
    connectedCallback() {
      this.input = this.querySelector('input');
      if (!this.input) {
        console.warn('IMaskWebComponent: No input element found');
        return;
      }

      this._parseMaskConfiguration();
      this._loadIMaskAndInit();
    }

    /**
     * Called when the element is disconnected from the DOM
     * Cleans up the IMask instance and event listeners
     * @returns {void}
     */
    disconnectedCallback() {
      this._destroyIMask();
      this._removeEventListeners();
    }

    /**
     * Parses mask configuration from data attributes
     * @private
     * @returns {void}
     */
    _parseMaskConfiguration() {
      const maskAttr = this.input.getAttribute('data-mask');
      const optionsAttr = this.input.getAttribute('data-mask-options');

      // Get predefined mask or use custom mask
      this.mask = IMaskWebComponent.PREDEFINED_MASKS[maskAttr] || maskAttr;

      // Parse additional options if provided
      if (optionsAttr) {
        try {
          this.maskOptions = JSON.parse(optionsAttr);
        } catch (error) {
          console.warn('IMaskWebComponent: Invalid mask options JSON', error);
          this.maskOptions = {};
        }
      } else {
        this.maskOptions = {};
      }
    }

    /**
     * Loads the IMask library asynchronously and initializes masking
     * Uses global coordination to prevent duplicate loading
     * @private
     * @returns {Promise<void>}
     */
    async _loadIMaskAndInit() {
      try {
        // Check if IMask is already loaded
        if (window.IMask) {
          this._iMaskLoaded = true;
          this._initializeMask();
          return;
        }

        // Wait for existing load operation if in progress
        if (window._iMaskLoadingPromise) {
          await window._iMaskLoadingPromise;
          this._iMaskLoaded = true;
          this._initializeMask();
          return;
        }

        // Start new load operation
        window._iMaskLoadingPromise = this._loadIMaskScript();

        await window._iMaskLoadingPromise;
        this._iMaskLoaded = true;
        this._initializeMask();

      } catch (error) {
        console.error('IMaskWebComponent: Failed to load IMask library', error);
      } finally {
        // Clean up global loading state
        delete window._iMaskLoadingPromise;
      }
    }

    /**
     * Dynamically loads the IMask script from CDN
     * @private
     * @returns {Promise<void>}
     */
    _loadIMaskScript() {
      return new Promise((resolve, reject) => {
        // Check for existing script with IMask
        const existingScript = document.querySelector('script[src*="imask"]');
        if (existingScript && window.IMask) {
          resolve();
          return;
        }

        // Handle existing script that hasn't loaded yet
        if (existingScript) {
          existingScript.addEventListener('load', () => {
            if (window.IMask) {
              resolve();
            } else {
              reject(new Error('IMask not available after script load'));
            }
          }, { once: true });
          existingScript.addEventListener('error', reject, { once: true });
          return;
        }

        // Create and load new script
        const script = document.createElement('script');
        script.src = IMaskWebComponent.IMASK_CDN_URL;
        script.async = true;

        script.onload = () => {
          if (window.IMask) {
            resolve();
          } else {
            reject(new Error('IMask not available after script load'));
          }
        };

        script.onerror = () => reject(new Error('Failed to load IMask script'));

        document.head.appendChild(script);
      });
    }

    /**
     * Initializes the IMask instance on the input element
     * @private
     * @returns {void}
     */
    _initializeMask() {
      if (!this._iMaskLoaded || !window.IMask || !this.mask) {
        console.warn('IMaskWebComponent: Cannot initialize mask - prerequisites not met');
        return;
      }

      this._destroyIMask();

      try {
        const maskConfig = {
          mask: this.mask,
          lazy: true,
          placeholderChar: '_',
          ...this.maskOptions
        };

        this._iMask = window.IMask(this.input, maskConfig);
        this._addEventListeners();

      } catch (error) {
        console.error('IMaskWebComponent: Failed to initialize IMask', error);
      }
    }

    /**
     * Destroys the current IMask instance
     * @private
     * @returns {void}
     */
    _destroyIMask() {
      if (this._iMask) {
        this._iMask.destroy();
        this._iMask = null;
      }
    }

    /**
     * Adds event listeners for enhanced functionality
     * @private
     * @returns {void}
     */
    _addEventListeners() {
      if (this.input) {
        this.input.addEventListener('input', this._handleInputChange);
        this.input.addEventListener('focus', this._handleInputFocus);
      }
    }

    /**
     * Removes event listeners
     * @private
     * @returns {void}
     */
    _removeEventListeners() {
      if (this.input) {
        this.input.removeEventListener('input', this._handleInputChange);
        this.input.removeEventListener('focus', this._handleInputFocus);
      }
    }

    /**
     * Handles input change events
     * @private
     * @param {Event} event - The input event
     * @returns {void}
     */
    _handleInputChange(event) {
      // Dispatch custom event for external listeners
      this.dispatchEvent(new CustomEvent('mask-input', {
        detail: {
          value: event.target.value,
          unmaskedValue: this._iMask?.unmaskedValue,
          typedValue: this._iMask?.typedValue
        },
        bubbles: true
      }));
    }

    /**
     * Handles input focus events
     * @private
     * @param {Event} event - The focus event
     * @returns {void}
     */
    _handleInputFocus(event) {
      // Ensure mask is properly initialized on focus
      if (!this._iMask && this._iMaskLoaded) {
        this._initializeMask();
      }
    }

    /**
     * Gets the unmasked value from the input
     * @returns {string} The unmasked value
     */
    get unmaskedValue() {
      return this._iMask?.unmaskedValue || this.input?.value || '';
    }

    /**
     * Gets the typed value from the input (for numeric masks)
     * @returns {*} The typed value
     */
    get typedValue() {
      return this._iMask?.typedValue;
    }

    /**
     * Updates the mask pattern dynamically
     * @param {string|Array<string>} newMask - The new mask pattern
     * @param {Object} [options={}] - Additional mask options
     * @returns {void}
     */
    updateMask(newMask, options = {}) {
      this.mask = newMask;
      this.maskOptions = { ...this.maskOptions, ...options };

      if (this._iMaskLoaded) {
        this._initializeMask();
      }
    }
  }

  customElements.define('input-mask', IMaskWebComponent);
}
