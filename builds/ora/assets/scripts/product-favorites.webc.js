/**
 * Custom element for managing product favorites (wishlist)
 * Handles favorite button click, loading state, and user feedback
 *
 * @class ProductFavorites
 * @extends HTMLElement
 *
 * @example
 * <product-favorites>
 *   <a href="/conta/favorito/123/adicionar"><svg><!-- icon --></svg></a>
 *   <span class="loading" style="display:none"></span>
 * </product-favorites>
 *
 * @fires window.toast - For user feedback messages
 */

if (!customElements.get('product-favorites')) {
  /**
   * ProductFavorites Web Component
   *
   * Exibe e gerencia o botão de favoritos de produto, incluindo feedback visual e mensagens ao usuário.
   *
   * @class ProductFavorites
   * @extends HTMLElement
   */
  class ProductFavorites extends HTMLElement {
    /**
     * Inicializa o componente ProductFavorites
     */
    constructor() {
      super();
      /** @type {HTMLAnchorElement|null} */
      this.buttonEl = null;
      /** @type {string|null} */
      this.href = null;
      /** @type {HTMLElement|null} */
      this.loadingEl = null;
      /** @type {SVGElement|null} */
      this.iconEl = null;
      this.handleClick = this.handleClick.bind(this);
    }

    /**
     * Chamado quando o elemento é inserido no DOM
     * Inicializa referências e listeners
     */
    connectedCallback() {
      this.buttonEl = this.querySelector('a');
      if (this.buttonEl) {
        this.href = this.buttonEl.getAttribute('href');
        this.buttonEl.addEventListener('click', this.handleClick);
        this.loadingEl = this.querySelector('.loading');
        this.iconEl = this.buttonEl.querySelector('svg');
      }
    }

    /**
     * Chamado quando o elemento é removido do DOM
     * Remove listeners
     */
    disconnectedCallback() {
      if (this.buttonEl) {
        this.buttonEl.removeEventListener('click', this.handleClick);
      }
    }

    /**
     * Handler do clique no botão de favoritos
     * Faz requisição AJAX para adicionar o produto aos favoritos
     * @param {MouseEvent} event
     * @returns {Promise<void>}
     */
    async handleClick(event) {
      event.preventDefault();
      const errorMessage = 'Não foi possível adicionar o produto aos favoritos. Tente novamente.';
      this.setLoading(true);
      try {
        const response = await fetch(this.href, {
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          this.triggerMessage(errorMessage, 'error');
          return;
        }

        const result = await response.json();

        if (result.status == 'sucesso') {
          this.triggerMessage(result.mensagem || 'Produto adicionado aos favoritos!', 'success');
          this.buttonEl.classList.add('text-red-500');
          this.buttonEl.classList.remove('opacity-20');
          return;
        }
        if (result.status == 'erro' && result.mensagem == 'Você precisa estar logado para adicionar aos favoritos') {
          window.location.href = this.href;
          setTimeout(() => {
            this.setLoading(false);
          }, 5000);
          return;
        }
        this.triggerMessage(result.mensagem || errorMessage, 'error');

      } catch (error) {
        console.error('Erro ao adicionar favorito:', error);
        this.triggerMessage(errorMessage, 'error');
      }
    }

    /**
     * Exibe mensagem de feedback ao usuário (toast ou alert)
     * @param {string} message
     * @param {string} [type="info"]
     */
    triggerMessage(message, type = 'info') {
      this.setLoading(false);
      if (typeof window.toast === 'function') {
        window.toast(message, { type });
      } else {
        alert(message);
      }
    }

    /**
     * Define o estado de loading do botão e ícone
     * @param {boolean} isLoading
     */
    setLoading(isLoading) {
      if (isLoading) {
        this.buttonEl.setAttribute('aria-busy', 'true');
        this.iconEl.style.display = 'none';
        this.loadingEl.style.display = 'block';
      } else {
        this.buttonEl.removeAttribute('aria-busy');
        this.iconEl.style.display = 'block';
        this.loadingEl.style.display = 'none';
      }
    }
  }

  customElements.define('product-favorites', ProductFavorites);
}
