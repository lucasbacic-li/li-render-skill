if (!customElements.get('carousel-embla')) {
  class EmblaCarousel extends HTMLElement {
    /**
     * Embla Carousel local URL
     * @type {string}
     * @static
     * @readonly
     */
    static get EMBLA_CDN_URL() {
      return document.querySelector('meta[name="embla-cdn"]')?.getAttribute('content');
    }

    /**
     * Embla Autoplay Plugin local URL
     * @type {string}
     * @static
     * @readonly
     */
    static get EMBLA_AUTOPLAY_CDN_URL() {
      return document.querySelector('meta[name="embla-autoplay-cdn"]')?.getAttribute('content');
    }

    /**
     * Embla Auto Height Plugin local URL
     * @type {string}
     * @static
     * @readonly
     */
    static get EMBLA_AUTOHEIGHT_CDN_URL() {
      return document.querySelector('meta[name="embla-autoheight-cdn"]')?.getAttribute('content');
    }

    /**
     * Embla Carousel Wheel Gestures Plugin local URL
     * @type {string}
     * @static
     * @readonly
     */
    static get EMBLA_WHEEL_GESTURES_CDN_URL() {
      return document.querySelector('meta[name="embla-wheel-gestures-cdn"]')?.getAttribute('content');
    }

    /**
     * Creates an instance of EmblaCarousel
     */
    constructor() {
      super();

      /** @type {HTMLElement|null} The carousel viewport element */
      this.emblaNode = null;

      /** @type {EmblaCarouselType|null} The Embla instance */
      this.emblaApi = null;

      /** @type {boolean} Whether the Embla library has been loaded */
      this.emblaLoaded = false;

      /** @type {Object} Embla configuration options */
      this.options = {};

      /** @type {Array} Embla plugins */
      this.plugins = [];

      /** @type {HTMLButtonElement|null} Previous button */
      this.prevBtn = null;

      /** @type {HTMLButtonElement|null} Next button */
      this.nextBtn = null;

      /** @type {NodeList|null} Dot buttons */
      this.dotButtons = null;

      /** @type {boolean} Show progress animation on dots */
      this.showProgress = false;

      /** @type {number} Current animation timeout ID */
      this.progressTimeoutId = null;

      /** @type {number|null} Resize debounce timeout ID */
      this.resizeTimeoutId = null;

      this.handlePrevClick = this.handlePrevClick.bind(this);
      this.handleNextClick = this.handleNextClick.bind(this);
      this.handleDotClick = this.handleDotClick.bind(this);
      this.updateUI = this.updateUI.bind(this);
      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handleResize = this.handleResize.bind(this);
    }

    /**
     * Called when the element is connected to the DOM
     * @returns {void}
     */
    connectedCallback() {
      this.emblaNode = this.querySelector('.embla');

      if (!this.emblaNode) {
        console.warn('EmblaCarousel: No .embla element found');
        return;
      }

      this.parseOptions();
      this.loadEmblaAndInit();

      // Listen for viewport changes to update slides per view
      window.addEventListener('resize', this.handleResize);
    }

    /**
     * Called when the element is disconnected from the DOM
     * @returns {void}
     */
    disconnectedCallback() {
      this.destroyEmbla();
      window.removeEventListener('resize', this.handleResize);

      if (this.resizeTimeoutId) {
        clearTimeout(this.resizeTimeoutId);
        this.resizeTimeoutId = null;
      }
    }

    /**
     * Handle viewport resize with debounce
     * @private
     * @returns {void}
     */
    handleResize() {
      if (this.resizeTimeoutId) {
        clearTimeout(this.resizeTimeoutId);
      }

      this.resizeTimeoutId = setTimeout(() => {
        const newSlidesPerView = this.getCurrentSlidesPerView();

        // Only reinitialize if slides per view changed
        if (newSlidesPerView !== this.slidesPerView) {
          this.slidesPerView = newSlidesPerView;
          this.applySlidesPerView();

          // Reinitialize Embla to recalculate snap points
          if (this.emblaApi) {
            this.emblaApi.reInit();
          }
        }

        this.resizeTimeoutId = null;
      }, 150);
    }

    /**
     * Breakpoint definitions (mobile first)
     * @type {Object}
     * @static
     * @readonly
     */
    static get BREAKPOINTS() {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280
      };
    }

    /**
     * Parses options from data attributes
     * @private
     * @returns {void}
     */
    parseOptions() {
      const align = this.getAttribute('data-align') || 'start';
      const loop = this.getAttribute('data-loop') === 'true';
      const slidesToScroll = parseInt(this.getAttribute('data-slides-to-scroll')) || 'auto';
      const skipSnaps = this.getAttribute('data-skip-snaps') === 'true';
      const containScroll = this.getAttribute('data-contain-scroll') || 'trimSnaps';
      const dragFree = this.getAttribute('data-drag-free') === 'true';
      const draggable = this.getAttribute('data-draggable') !== 'false';
      const speed = parseInt(this.getAttribute('data-speed')) || 10;

      // Parse responsive slides per view (mobile first)
      const slidesPerView = this.getAttribute('data-slides-per-view');
      this.slidesPerViewConfig = {
        base: slidesPerView ? parseFloat(slidesPerView) : null,
        sm: this.getAttribute('data-slides-per-view-sm') ? parseFloat(this.getAttribute('data-slides-per-view-sm')) : null,
        md: this.getAttribute('data-slides-per-view-md') ? parseFloat(this.getAttribute('data-slides-per-view-md')) : null,
        lg: this.getAttribute('data-slides-per-view-lg') ? parseFloat(this.getAttribute('data-slides-per-view-lg')) : null,
        xl: this.getAttribute('data-slides-per-view-xl') ? parseFloat(this.getAttribute('data-slides-per-view-xl')) : null
      };

      // Calculate current slides per view based on viewport
      this.slidesPerView = this.getCurrentSlidesPerView();

      const gap = this.getAttribute('data-gap') || '1rem';
      this.gap = gap;

      this.options = {
        align,
        loop,
        slidesToScroll,
        skipSnaps,
        containScroll,
        dragFree,
        draggable,
        speed
      };

      const autoplay = this.getAttribute('data-autoplay') === 'true';
      const autoplayDelay = parseInt(this.getAttribute('data-autoplay-delay')) || 5000;
      const stopOnInteraction = this.getAttribute('data-stop-on-interaction') !== 'false';

      this.autoplayConfig = autoplay ? {
        delay: autoplayDelay,
        stopOnInteraction
      } : null;

      this.showProgress = this.getAttribute('data-show-progress') === 'true';

      this.autoHeight = this.getAttribute('data-auto-height') === 'true';
      this.wheelGestures = this.getAttribute('data-wheel-gestures') !== 'false';
    }

    /**
     * Get current slides per view based on viewport width (mobile first)
     * @private
     * @returns {number|null}
     */
    getCurrentSlidesPerView() {
      const width = window.innerWidth;
      const config = this.slidesPerViewConfig;

      let slidesPerView = config.base;

      if (config.sm !== null && width >= EmblaCarousel.BREAKPOINTS.sm) {
        slidesPerView = config.sm;
      }
      if (config.md !== null && width >= EmblaCarousel.BREAKPOINTS.md) {
        slidesPerView = config.md;
      }
      if (config.lg !== null && width >= EmblaCarousel.BREAKPOINTS.lg) {
        slidesPerView = config.lg;
      }
      if (config.xl !== null && width >= EmblaCarousel.BREAKPOINTS.xl) {
        slidesPerView = config.xl;
      }

      return slidesPerView;
    }

    /**
     * Loads the Embla library and initializes the carousel
     * @private
     * @returns {Promise<void>}
     */
    async loadEmblaAndInit() {
      try {
        if (window.EmblaCarousel) {
          this.emblaLoaded = true;
          this.initializeCarousel();
          return;
        }

        if (window._emblaLoadingPromise) {
          await window._emblaLoadingPromise;
          this.emblaLoaded = true;
          this.initializeCarousel();
          return;
        }

        window._emblaLoadingPromise = this.loadEmblaScript();

        await window._emblaLoadingPromise;
        this.emblaLoaded = true;
        this.initializeCarousel();

      } catch (error) {
        console.error('EmblaCarousel: Failed to load Embla library', error);
      } finally {
        delete window._emblaLoadingPromise;
      }
    }

    /**
     * Loads the Embla script from CDN
     * @private
     * @returns {Promise<void>}
     */
    async loadEmblaScript() {
      await this.loadScript(EmblaCarousel.EMBLA_CDN_URL, 'EmblaCarousel');

      if (this.autoplayConfig) {
        await this.loadScript(EmblaCarousel.EMBLA_AUTOPLAY_CDN_URL, 'EmblaCarouselAutoplay');
      }
      if (this.autoHeight) {
        await this.loadScript(EmblaCarousel.EMBLA_AUTOHEIGHT_CDN_URL, 'EmblaCarouselAutoHeight');
      }
      if (this.wheelGestures) {
        await this.loadScript(EmblaCarousel.EMBLA_WHEEL_GESTURES_CDN_URL, 'EmblaCarouselWheelGestures');
      }
    }

    /**
     * Dynamically loads a script
     * @private
     * @param {string} src - Script source URL
     * @param {string} globalName - Global variable name to check
     * @returns {Promise<void>}
     */
    loadScript(src, globalName) {
      return new Promise((resolve, reject) => {
        if (window[globalName]) {
          resolve();
          return;
        }

        const existingScript = document.querySelector(`script[src="${src}"]`);

        if (existingScript) {
          if (existingScript.complete || existingScript.readyState === 'complete') {
            resolve();
            return;
          }
          existingScript.addEventListener('load', () => resolve(), { once: true });
          existingScript.addEventListener('error', reject, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.defer = true;

        script.onload = () => {
          if (window[globalName]) {
            resolve();
          } else {
            reject(new Error(`${globalName} not available after script load`));
          }
        };

        script.onerror = () => reject(new Error(`Failed to load ${globalName} script`));

        document.head.appendChild(script);
      });
    }

    /**
     * Initializes the Embla carousel
     * @private
     * @returns {void}
     */
    initializeCarousel() {
      if (!this.emblaLoaded || !window.EmblaCarousel || !this.emblaNode) {
        console.warn('EmblaCarousel: Cannot initialize - prerequisites not met');
        return;
      }

      this.destroyEmbla();

      try {
        this.applySlidesPerView();

        this.plugins = [];

        if (this.autoplayConfig && window.EmblaCarouselAutoplay) {
          this.plugins.push(window.EmblaCarouselAutoplay(this.autoplayConfig));
        }
        if (this.autoHeight && window.EmblaCarouselAutoHeight) {
          this.plugins.push(window.EmblaCarouselAutoHeight());
        }
        if (this.wheelGestures && window.EmblaCarouselWheelGestures) {
          this.plugins.push(window.EmblaCarouselWheelGestures());
        }

        this.emblaApi = window.EmblaCarousel(this.emblaNode, this.options, this.plugins);

        this.setupControls();
        this.setupEventListeners();

        this.dispatchEvent(new CustomEvent('carousel-init', {
          detail: { api: this.emblaApi },
          bubbles: true
        }));

      } catch (error) {
        console.error('EmblaCarousel: Failed to initialize', error);
      }
    }

    /**
     * Applies slides per view styling
     * @private
     * @returns {void}
     */
    applySlidesPerView() {
      if (!this.slidesPerView) return;

      const container = this.emblaNode.querySelector('.embla__container');
      const slides = this.emblaNode.querySelectorAll('.embla__slide');

      if (!container || !slides.length) return;

      container.style.display = 'flex';
      container.style.gap = this.gap;

      const percentage = (100 / this.slidesPerView).toFixed(4);

      slides.forEach(slide => {
        slide.style.flex = `0 0 calc(${percentage}% - ${this.gap} + (${this.gap} / ${this.slidesPerView}))`;
        slide.style.minWidth = '0';
      });
    }

    /**
     * Sets up carousel controls (prev/next/dots)
     * @private
     * @returns {void}
     */
    setupControls() {
      this.prevBtn = this.querySelector('[data-carousel-prev]');
      this.nextBtn = this.querySelector('[data-carousel-next]');
      this.dotButtons = this.querySelectorAll('[data-carousel-dot]');

      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', this.handlePrevClick);
      }

      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', this.handleNextClick);
      }

      if (this.dotButtons.length > 0) {
        this.dotButtons.forEach((dot, index) => {
          dot.addEventListener('click', () => this.handleDotClick(index));

          if (this.showProgress && !dot.querySelector('.dot-progress')) {
            const progress = document.createElement('span');
            progress.className = 'dot-progress';
            if (dot.children.length > 0) {
              dot.children[0].appendChild(progress);
              return;
            }
            dot.appendChild(progress);
          }
        });
      }

      this.updateUI();
    }

    /**
     * Sets up event listeners for carousel events
     * @private
     * @returns {void}
     */
    setupEventListeners() {
      if (!this.emblaApi) return;

      this.emblaApi.on('select', this.updateUI);
      this.emblaApi.on('reinit', this.updateUI);

      if (this.showProgress) {
        this.emblaApi.on('pointerdown', this.handlePointerDown);
      }
      if (this.autoplayConfig && this.emblaApi.snapList().length > 1) {
        this.emblaApi.plugins().autoplay?.play();
      }
    }

    /**
     * Handles pointer down event (pause progress animation)
     * @private
     * @returns {void}
     */
    handlePointerDown() {
      this.stopProgressAnimation();
    }

    /**
     * Handles previous button click
     * @private
     * @returns {void}
     */
    handlePrevClick() {
      if (this.emblaApi) {
        this.emblaApi.goToPrev();
      }
    }

    /**
     * Handles next button click
     * @private
     * @returns {void}
     */
    handleNextClick() {
      if (this.emblaApi) {
        this.emblaApi.goToNext();
      }
    }

    /**
     * Handles dot button click
     * @private
     * @param {number} index - Slide index
     * @returns {void}
     */
    handleDotClick(index) {
      if (this.emblaApi) {
        this.emblaApi.goTo(index);
      }
    }

    /**
     * Updates UI state (button states, active dots)
     * @private
     * @returns {void}
     */
    updateUI() {
      if (!this.emblaApi) return;

      const canGoToPrev = this.emblaApi.canGoToPrev();
      const canGoToNext = this.emblaApi.canGoToNext();
      const selectedIndex = this.emblaApi.selectedSnap();

      if (this.prevBtn) {
        this.prevBtn.disabled = !canGoToPrev;
        this.prevBtn.classList.toggle('opacity-50', !canGoToPrev);
        this.prevBtn.classList.toggle('cursor-not-allowed', !canGoToPrev);
        this.prevBtn.setAttribute('aria-disabled', (!canGoToPrev).toString());
      }

      if (this.nextBtn) {
        this.nextBtn.disabled = !canGoToNext;
        this.nextBtn.classList.toggle('opacity-50', !canGoToNext);
        this.nextBtn.classList.toggle('cursor-not-allowed', !canGoToNext);
        this.nextBtn.setAttribute('aria-disabled', (!canGoToNext).toString());
      }

      if (this.nextBtn && this.prevBtn) {
        const bothDisabled = !canGoToPrev && !canGoToNext;
        this.nextBtn.classList.toggle('invisible', bothDisabled);
        this.prevBtn.classList.toggle('invisible', bothDisabled);
      }

      if (this.dotButtons.length > 0) {
        this.dotButtons.forEach((dot, index) => {
          const isActive = index === selectedIndex;
          dot.classList.toggle('active', isActive);
          dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
      }

      if (this.showProgress && this.autoplayConfig) {
        this.startProgressAnimation(selectedIndex);
      }

      this.dispatchEvent(new CustomEvent('carousel-select', {
        detail: {
          selectedIndex,
          canGoToPrev,
          canGoToNext
        },
        bubbles: true
      }));
    }

    /**
     * Starts progress animation on active dot
     * @private
     * @param {number} activeIndex - Index of active slide
     * @returns {void}
     */
    startProgressAnimation(activeIndex) {
      this.stopProgressAnimation();

      if (!this.dotButtons || !this.dotButtons.length) return;

      const activeDot = this.dotButtons[activeIndex];
      if (!activeDot) return;

      const progress = activeDot.querySelector('.dot-progress');
      if (!progress) {
        console.error('Progress element not found for dot', activeIndex);
        return;
      }

      progress.classList.remove('animating');
      progress.style.width = '0%';
      progress.style.setProperty('--dot-duration', `${this.autoplayConfig.delay}ms`);

      this.progressTimeoutId = setTimeout(() => {
        progress.classList.add('animating');
      }, 50);
    }

    /**
     * Stops all progress animations
     * @private
     * @returns {void}
     */
    stopProgressAnimation() {
      if (this.progressTimeoutId) {
        clearTimeout(this.progressTimeoutId);
        this.progressTimeoutId = null;
      }

      if (!this.dotButtons || !this.dotButtons.length) return;

      this.dotButtons.forEach(dot => {
        const progress = dot.querySelector('.dot-progress');
        if (progress) {
          progress.classList.remove('animating');
          progress.style.width = '0%';
        }
      });
    }

    /**
     * Destroys the Embla instance
     * @private
     * @returns {void}
     */
    destroyEmbla() {
      this.stopProgressAnimation();

      if (this.emblaApi) {
        this.emblaApi.destroy();
        this.emblaApi = null;
      }

      if (this.prevBtn) {
        this.prevBtn.removeEventListener('click', this.handlePrevClick);
      }

      if (this.nextBtn) {
        this.nextBtn.removeEventListener('click', this.handleNextClick);
      }
    }

    /**
     * Public API: Scroll to next slide
     * @public
     * @returns {void}
     */
    goToNext() {
      if (this.emblaApi) {
        this.emblaApi.goToNext();
      }
    }

    /**
     * Public API: Scroll to previous slide
     * @public
     * @returns {void}
     */
    goToPrev() {
      if (this.emblaApi) {
        this.emblaApi.goToPrev();
      }
    }

    /**
     * Public API: Scroll to specific slide
     * @public
     * @param {number} index - Slide index
     * @returns {void}
     */
    goTo(index) {
      if (this.emblaApi) {
        this.emblaApi.goTo(index);
      }
    }

    /**
     * Public API: Re-initialize carousel
     * @public
     * @returns {void}
     */
    reInit() {
      if (this.emblaApi) {
        this.emblaApi.reInit();
      }
    }

    /**
     * Public API: Get Embla API instance
     * @public
     * @returns {EmblaCarouselType|null}
     */
    getApi() {
      return this.emblaApi;
    }
  }

  customElements.define('carousel-embla', EmblaCarousel);
}
