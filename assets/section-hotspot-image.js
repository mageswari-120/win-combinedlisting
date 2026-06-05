/* ============================================================
   Section: Hotspot Image  –  section-hotspot-image.js
   NO Swiper dependency for slide switching – pure CSS + JS
   ============================================================ */

if (!customElements.get('hotspot-image-section')) {
  class HotspotImageSection extends HTMLElement {
    constructor() {
      super();
      this._sectionId   = null;
      this._open        = false;
      this._activeIndex = 0;
      this._slides      = [];

      this._onKeydown  = this._handleKeydown.bind(this);
      this._onDotClick = this._handleDotClick.bind(this);
    }

    connectedCallback() {
      this._sectionId = this.dataset.sectionId;

      this._drawer    = document.getElementById(`hotspot-drawer-${this._sectionId}`);
      this._backdrop  = document.getElementById(`hotspot-backdrop-${this._sectionId}`);
      this._closeBtn  = document.getElementById(`hotspot-drawer-close-${this._sectionId}`);
      this._prevBtn   = document.getElementById(`hotspot-prev-${this._sectionId}`);
      this._nextBtn   = document.getElementById(`hotspot-next-${this._sectionId}`);
      this._currentEl = this._drawer?.querySelector('.hotspot-drawer__pagination-current');
      this._totalEl   = this._drawer?.querySelector('.hotspot-drawer__pagination-total');

      if (!this._drawer) return;

      // Collect slides
      this._slides = Array.from(
        this._drawer.querySelectorAll('.hotspot-drawer__slide')
      );

      this._applyCSSVars();

      // Keep drawer in DOM (never hidden) – off-screen via transform only
      this._drawer.hidden = false;
      this._drawer.setAttribute('aria-hidden', 'true');

      if (this._totalEl) this._totalEl.textContent = this._slides.length;

      this._goTo(0);   // show first slide, update pagination
      this._bindEvents();
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this._onKeydown);
    }

    /* ── CSS VARS ── */
    _applyCSSVars() {
      const s    = this.style;
      const root = document.documentElement;
      const { sectionHeight, drawerWidth, drawerBg, drawerText, accentColor } = this.dataset;

      if (sectionHeight) s.setProperty('--hotspot-section-height', sectionHeight);
      if (drawerWidth)   root.style.setProperty('--hotspot-drawer-width', drawerWidth + 'px');
      if (drawerBg)      root.style.setProperty('--hotspot-drawer-bg',    drawerBg);
      if (drawerText)    root.style.setProperty('--hotspot-drawer-text',  drawerText);
      if (accentColor) {
        root.style.setProperty('--hotspot-accent', accentColor);
        s.setProperty('--hotspot-accent', accentColor);
      }
    }

    /* ── SLIDE SWITCHING (no Swiper, no dimension issues) ── */
    _goTo(index) {
      const total = this._slides.length;
      if (!total) return;

      // Clamp
      index = Math.max(0, Math.min(index, total - 1));
      this._activeIndex = index;

      // Show / hide slides
      this._slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
      });

      // Pagination
      if (this._currentEl) this._currentEl.textContent = index + 1;

      // Prev / next buttons
      const atStart = index === 0;
      const atEnd   = index >= total - 1;

      if (this._prevBtn) {
        this._prevBtn.classList.toggle('is-disabled', atStart);
        this._prevBtn.disabled = atStart;
      }
      if (this._nextBtn) {
        this._nextBtn.classList.toggle('is-disabled', atEnd);
        this._nextBtn.disabled = atEnd;
      }

      // Dot aria-expanded sync
      this.querySelectorAll('.hotspot-dot-btn').forEach((btn, i) => {
        btn.setAttribute('aria-expanded', (i === index && this._open) ? 'true' : 'false');
      });
    }

    /* ── EVENTS ── */
    _bindEvents() {
      this.querySelectorAll('.hotspot-dot-btn').forEach(btn => {
        btn.addEventListener('click', this._onDotClick);
      });

      this._closeBtn?.addEventListener('click', () => this.closeDrawer());
      this._backdrop?.addEventListener('click', () => this.closeDrawer());

      this._prevBtn?.addEventListener('click', () => {
        this._goTo(this._activeIndex - 1);
      });
      this._nextBtn?.addEventListener('click', () => {
        this._goTo(this._activeIndex + 1);
      });

      document.addEventListener('keydown', this._onKeydown);
    }

    _handleDotClick(e) {
      const idx = parseInt(e.currentTarget.dataset.hotspotIndex, 10);
      if (this._open && this._activeIndex === idx) {
        this.closeDrawer();
      } else {
        this.openDrawer(idx);
      }
    }

    _handleKeydown(e) {
      if (!this._open) return;
      if (e.key === 'Escape')     this.closeDrawer();
      if (e.key === 'ArrowLeft')  this._goTo(this._activeIndex - 1);
      if (e.key === 'ArrowRight') this._goTo(this._activeIndex + 1);
    }

    /* ── OPEN / CLOSE ── */
    openDrawer(index = 0) {
      if (!this._drawer) return;

      this._goTo(index);   // instant – no dimensions needed
      this._open = true;

      this._drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        this._drawer.classList.add('is-open');
        this._backdrop?.classList.add('is-open');
      });

      setTimeout(() => this._closeBtn?.focus(), 440);
    }

    closeDrawer() {
      if (!this._drawer) return;

      this._drawer.classList.remove('is-open');
      this._backdrop?.classList.remove('is-open');
      this._open = false;

      this._drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      this.querySelectorAll('.hotspot-dot-btn').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  }

  customElements.define('hotspot-image-section', HotspotImageSection);
}

document.addEventListener('shopify:section:load', (e) => {
  const el = e.target.querySelector('hotspot-image-section');
  if (el) el.connectedCallback();
});