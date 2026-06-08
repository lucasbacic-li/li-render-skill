// <ora-hero> — controlador do hero editorial com transição FADE.
// Auto-contido (não usa Embla): faz crossfade entre slides, autoplay, navegação
// pelos títulos ([.ora-hero__navrow]) e a progress bar (.ora-hero__navfill) que
// enche no slide ativo. Fade conflita com o modelo de slide do Embla, por isso
// este controlador dedicado em vez do <carousel-embla> compartilhado.
//
// Markup esperado:
//   <ora-hero data-delay="7000">
//     <div class="ora-hero__stage">
//       <div class="ora-hero__slide">…</div>  (N, empilhados via CSS absolute)
//     </div>
//     <div class="ora-hero__nav">
//       <button class="ora-hero__navrow">…<span class="ora-hero__navfill"></span>…</button>
//     </div>
//   </ora-hero>
if (!customElements.get('ora-hero')) {
  class OraHero extends HTMLElement {
    connectedCallback() {
      this.slides = Array.from(this.querySelectorAll('.ora-hero__slide'));
      this.rows = Array.from(this.querySelectorAll('.ora-hero__navrow'));
      this.delay = parseInt(this.getAttribute('data-delay'), 10) || 7000;
      this.index = 0;
      this.timer = null;
      this.startedAt = 0;
      this.remaining = this.delay;
      if (!this.slides.length) return;

      this.mtitle = this.querySelector('.ora-hero__mtitle'); // título ativo (mobile)
      this.madd = this.querySelector('.ora-hero__madd');     // "+" → link do produto (mobile)
      this.rows.forEach((row, i) => row.addEventListener('click', () => this.go(i)));
      // pausa enquanto o usuário interage (ler o título, usar o card)
      this.addEventListener('mouseenter', () => this.pause());
      this.addEventListener('mouseleave', () => this.resume());

      // GESTO: arrastar pro lado troca o slide (touch + mouse via Pointer Events).
      // Slides em fade ficam empilhados (sem follow-finger), então detectamos o
      // swipe e fazemos crossfade pro próximo/anterior. Só dispara em gesto
      // horizontal dominante — scroll vertical passa livre.
      this.stage = this.querySelector('.ora-hero__stage') || this;
      this._sx = 0; this._sy = 0; this._sw = false;
      this.stage.addEventListener('pointerdown', (e) => {
        this._sx = e.clientX; this._sy = e.clientY; this._sw = true;
      });
      this.stage.addEventListener('pointerup', (e) => {
        if (!this._sw) return; this._sw = false;
        const dx = e.clientX - this._sx, dy = e.clientY - this._sy;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) this.next(); else this.prev();
        }
      });
      this.stage.addEventListener('pointercancel', () => { this._sw = false; });

      this.render();
      if (this.slides.length > 1) this.play(this.delay);
    }

    disconnectedCallback() { this.clear(); }

    render() {
      this.slides.forEach((s, j) => s.classList.toggle('is-current', j === this.index));
      this.rows.forEach((row, j) => {
        const active = j === this.index;
        row.classList.toggle('is-active', active);
        row.setAttribute('aria-current', active ? 'true' : 'false');
        const fill = row.querySelector('.ora-hero__navfill');
        if (!fill) return;
        // reinicia a animação da barra (none → reflow → set)
        fill.style.animation = 'none';
        void fill.offsetWidth;
        fill.style.animation = active ? ('ora-hero-fill ' + this.delay + 'ms linear forwards') : 'none';
      });
      // barra mobile: título do slide ativo + "+" apontando p/ o produto do slide
      if (this.mtitle) {
        const t = this.rows[this.index] && this.rows[this.index].querySelector('.ora-hero__navtitle');
        this.mtitle.textContent = t ? t.textContent : '';
      }
      if (this.madd) {
        const cur = this.slides[this.index];
        const card = cur && cur.querySelector('product-card');
        const url = card && card.getAttribute('data-url');
        if (url) { this.madd.setAttribute('href', url); this.madd.removeAttribute('hidden'); }
        else { this.madd.removeAttribute('href'); this.madd.setAttribute('hidden', ''); }
      }
    }

    go(i) {
      const n = this.slides.length;
      this.index = ((i % n) + n) % n;
      this.classList.remove('is-paused');
      this.render();
      if (n > 1) this.play(this.delay);
    }

    next() { this.go(this.index + 1); }

    prev() { this.go(this.index - 1); }

    play(ms) {
      this.clear();
      this.remaining = ms;
      this.startedAt = performance.now();
      this.classList.remove('is-paused');
      this.timer = setTimeout(() => this.next(), ms);
    }

    pause() {
      if (!this.timer) return;
      this.clear();
      this.remaining = Math.max(0, this.remaining - (performance.now() - this.startedAt));
      this.classList.add('is-paused'); // congela a barra (animation-play-state)
    }

    resume() {
      if (this.slides.length <= 1) return;
      if (this.remaining <= 0) { this.next(); return; }
      this.clear();
      this.startedAt = performance.now();
      this.classList.remove('is-paused'); // a barra continua de onde parou
      this.timer = setTimeout(() => this.next(), this.remaining);
    }

    clear() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } }
  }
  customElements.define('ora-hero', OraHero);
}

