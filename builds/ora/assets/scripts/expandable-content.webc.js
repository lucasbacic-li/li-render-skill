if (!customElements.get('expandable-content')) {
  class ExpandableContent extends HTMLElement {
    static _idCounter = 0;

    constructor() {
      super();
      this.expanded = false;
      this.expandedHeight = 0;
      this.collapsedHeight = '0px';
      this._collapseHidesAllContent = false;
      this._resizeObserver = null;
      this._onToggle = this._onToggle.bind(this);
      this._onTransitionEnd = this._onTransitionEnd.bind(this);
      this._updateExpandedHeight = this._updateExpandedHeight.bind(this);
    }

    connectedCallback() {
      if (this._initialized) {
        return;
      }

      this._initialized = true;
      this.expanded = this.hasAttribute('open');
      this.collapsedHeight = getComputedStyle(this).maxHeight;
      this._collapseHidesAllContent = this._isFullyCollapsedHeight();

      if (!this.collapsedHeight || this.collapsedHeight === 'none') {
        return;
      }

      this._build();

      if (!this._hasOverflow()) {
        this._setStaticState();
        return;
      }

      this.button.addEventListener('click', this._onToggle);
      this.addEventListener('transitionend', this._onTransitionEnd);
      this._observeContent();
      this._setExpanded(this.expanded, false);
      this._renderControls();
    }

    disconnectedCallback() {
      if (this.button) {
        this.button.removeEventListener('click', this._onToggle);
      }

      this.removeEventListener('transitionend', this._onTransitionEnd);

      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
    }

    _build() {
      const children = Array.from(this.childNodes);
      this.classList.add('relative', 'transition-[max-height]');

      this.content = document.createElement('div');
      this.content.id = this._getContentId();
      this.content.className = 'pb-10';
      this.content.style.contain = 'layout paint';

      children.forEach((node) => this.content.appendChild(node));

      this.gradient = document.createElement('div');
      this.gradient.className = 'absolute bottom-10 h-10 w-full bg-linear-to-t from-neutral transition-opacity pointer-events-none';

      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.className = 'absolute bottom-0 inset-x-0 box-content pt-3 inline-flex h-7 w-full items-center justify-center gap-2.5 text-sm bg-neutral cursor-pointer hover:font-semibold';
      this.button.setAttribute('aria-controls', this.content.id);

      this.buttonLabel = document.createElement('span');

      this.buttonIcon = document.createElement('span');
      this.buttonIcon.className = 'text-xl pt-px';
      this.buttonIcon.textContent = '\u203A';
      this.buttonIcon.setAttribute('aria-hidden', 'true');

      this.button.appendChild(this.buttonLabel);
      this.button.appendChild(this.buttonIcon);

      this.replaceChildren(this.content, this.gradient, this.button);

      this._updateExpandedHeight();
    }

    _getContentId() {
      ExpandableContent._idCounter += 1;
      return this.id
        ? this.id + '-content'
        : 'expandable-content-' + ExpandableContent._idCounter;
    }

    _isFullyCollapsedHeight() {
      const collapsedPx = parseFloat(this.collapsedHeight);
      return !Number.isNaN(collapsedPx) && collapsedPx <= 1;
    }

    _hasOverflow() {
      return this.expandedHeight > this.clientHeight + 1;
    }

    _setStaticState() {
      this.style.maxHeight = 'none';
      this.style.overflow = 'visible';
      this.content.classList.remove('pb-10');
      this.content.removeAttribute('aria-hidden');

      if ('inert' in this.content) {
        this.content.inert = false;
      }

      this.gradient.remove();
      this.button.remove();
    }

    _renderControls() {
      this.buttonLabel.textContent = this.expanded ? 'Ver menos' : 'Ver mais';
      this.button.setAttribute('aria-expanded', String(this.expanded));
      this.gradient.style.opacity = this.expanded ? '0' : '1';
      this.buttonIcon.style.transform = this.expanded ? 'rotate(-90deg)' : 'rotate(90deg)';
    }

    _observeContent() {
      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      this._resizeObserver = new ResizeObserver(this._updateExpandedHeight);
      this._resizeObserver.observe(this.content);
    }

    _updateExpandedHeight() {
      this.expandedHeight = this.content.scrollHeight;
    }

    _getExpandedHeightPx() {
      return this.expandedHeight + 'px';
    }

    _setExpanded(nextExpanded, animate = true) {
      this.expanded = nextExpanded;
      this.toggleAttribute('open', this.expanded);
      this._syncContentVisibilityState();

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!animate || prefersReducedMotion) {
        this.style.maxHeight = this.expanded ? 'none' : this.collapsedHeight;
        return;
      }

      this.style.willChange = 'max-height';

      if (this.expanded) {
        this.style.maxHeight = this.clientHeight + 'px';
        requestAnimationFrame(() => {
          this.style.maxHeight = this._getExpandedHeightPx();
        });
        return;
      }

      this.style.maxHeight = this._getExpandedHeightPx();
      requestAnimationFrame(() => {
        this.style.maxHeight = this.collapsedHeight;
      });
    }

    _syncContentVisibilityState() {
      if (!this._collapseHidesAllContent) {
        this.content.removeAttribute('aria-hidden');

        if ('inert' in this.content) {
          this.content.inert = false;
        }

        return;
      }

      this.content.setAttribute('aria-hidden', String(!this.expanded));

      if ('inert' in this.content) {
        this.content.inert = !this.expanded;
      }
    }

    _onToggle() {
      this._setExpanded(!this.expanded, true);
      this._renderControls();
    }

    _onTransitionEnd(event) {
      if (event.target !== this || event.propertyName !== 'max-height') {
        return;
      }

      if (this.expanded) {
        this.style.maxHeight = 'none';
      }

      this.style.willChange = '';
    }
  }

  customElements.define('expandable-content', ExpandableContent);
}
