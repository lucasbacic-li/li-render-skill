if (!customElements.get('product-card')) {
  /**
   * Custom element for product cards that handles product variations and image updates
   * @class ProductCard
   * @extends HTMLElement
   */
  class ProductCard extends HTMLElement {
    /**
     * Creates an instance of ProductCard
     * @constructor
     */
    constructor() {
      super();
      /** @type {string} Base product URL from data-url attribute */
      this.productUrlPrefix = this.getAttribute('data-url') || '';
      /** @type {string} Image URL prefix from data-image-prefix attribute */
      this.imgUrlPrefix = this.getAttribute('data-image-prefix') || '';
      /** @type {string} Product buy URL from data-buy-url attribute */
      this.productBuyUrl = this.getAttribute('data-buy-url') || '';
      /** @type {Object} Collection of product SKUs from data-skus attribute */
      this.productSkus = {};
      /** @type {NodeList|null} Collection of product URL elements */
      this._urlElements = null;
      /** @type {NodeList|null} Collection of product buy URL elements */
      this._buyUrlElements = null;
      /** @type {NodeList|null} Collection of product image elements */
      this._imgElements = null;
      /** @type {URL|null} Base product URL object for manipulation */
      this._baseProductUrl = null;
      /** @type {Array} Collection of variation selector radio inputs */
      this._variationsSelector = [];
    }

    /**
     * Lifecycle method called when the element is added to the DOM
     * Initializes element queries, sets up the base URL, and adds event listeners
     * @method connectedCallback
     */
    connectedCallback() {
      this._urlElements = this.querySelectorAll('[data-id="product-url"]');
      this._buyUrlElements = this.querySelectorAll('[data-id="product-buy-url"]');
      this._imgElements = this.querySelectorAll('[data-id="product-image"]');
      this._variationsSelector = this.querySelectorAll('input[type="radio"][data-variation]');
      try {
        this._baseProductUrl = new URL(this.productUrlPrefix, window.location.origin);
      } catch (error) {
        console.error('Invalid product URL:', error);
        this._baseProductUrl = null;
      }
      let dataSkus = this.getAttribute('data-skus');
      if (dataSkus) {
        try {
          dataSkus = dataSkus.replace(/'/g, '"').replace(',}', '}');
          this.productSkus = dataSkus ? JSON.parse(dataSkus) : {};
        } catch (error) {
          console.error('Error parsing product SKUs:', error);
        }
      }
      this.addEventListener('change', this._handleVariationChange);
    }

    /**
     * Lifecycle method called when the element is removed from the DOM
     * Cleans up event listeners to prevent memory leaks
     * @method disconnectedCallback
     */
    disconnectedCallback() {
      this.removeEventListener('change', this._handleVariationChange);
    }

    /**
     * Event handler for variation changes
     * Handles radio button changes for product variations
     * @method _handleVariationChange
     * @param {Event} event - The change event from radio inputs
     * @private
     */
    _handleVariationChange = (event) => {
      const target = event.target;
      if (target.type === 'radio' && target.hasAttribute('data-variation')) {
        const option = target.getAttribute('data-variation');
        const imageUrl = target.getAttribute('data-image');
        if (!option) return;
        this.setVariation(option, imageUrl);
      }
    }

    /**
     * Sets the product variation by updating images and URLs
     * @method setVariation
     * @param {string} option - The variation option value to set
     * @param {string} [imageUrl] - Optional image URL for the variation
     * @public
     */
    setVariation(option, imageUrl) {
      if (imageUrl && this._imgElements) {
        const fullImageUrl = this.imgUrlPrefix + imageUrl;
        this._imgElements.forEach((imgElement) => {
          imgElement.setAttribute('src', fullImageUrl);
        });
      }
      if (this._baseProductUrl && (this._urlElements || this._buyUrlElements)) {
        try {
          const newProductUrl = new URL(this._baseProductUrl);
          newProductUrl.searchParams.set('selected_variation[]', option);
          const newPath = newProductUrl.toString().substring(newProductUrl.origin.length);
          this._urlElements?.forEach((urlElement) => {
            urlElement.setAttribute('href', newPath);
          });
          this._buyUrlElements?.forEach((buyUrlElement) => {
            buyUrlElement.setAttribute('href', newPath);
          });
        } catch (error) {
          console.error('Error setting variation:', error);
        }
      }
      if (Object.keys(this.productSkus).length > 0 && this.productBuyUrl && this._buyUrlElements) {
        try {
          if (this.productSkus[option]) {
            const newBuyUrl = this.productBuyUrl.replace('PRODUCT_ID', this.productSkus[option]);
            this._buyUrlElements.forEach((buyUrlElement) => {
              if (buyUrlElement.hasAttribute('hx-trigger')) {
                buyUrlElement.setAttribute('hx-post', newBuyUrl);
                buyUrlElement.setAttribute('hx-trigger', 'click');
                htmx.process(buyUrlElement);
              }
            });
          } else {
            this._buyUrlElements.forEach((buyUrlElement) => {
              if (buyUrlElement.hasAttribute('hx-trigger')) {
                buyUrlElement.removeAttribute('hx-post');
                buyUrlElement.setAttribute('hx-trigger', 'none');
                htmx.process(buyUrlElement);
              }
            });
          }
        } catch (error) {
          console.error('Erro ao alterar botão de comprar variação:', error);
        }
      }
    }
  }
  customElements.define('product-card', ProductCard);
}
