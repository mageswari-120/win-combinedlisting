if (!customElements.get('hotspot-product-section')) {
  class HotspotProductSection extends HTMLElement {
    constructor() {
      super();
      this._activeIndex    = 0;
      this._cards          = [];
      this._allItems       = [];
      this._dots           = [];
      this._isMobile       = false;
      this._naturalOffsets = [];
      this._total          = 0;
      this._realStart      = 0;
      this._jumping        = false;    
      this._resizeTimer    = null;
      this._wheelTimer     = null;
      this._wheelDelta     = 0;
      this._wheelLocked    = false;

      this._onDotClick  = this._handleDotClick.bind(this);
      this._onCardClick = this._handleCardClick.bind(this);
      this._onResize    = this._handleResize.bind(this);
      this._onWheel     = this._handleWheel.bind(this);
    }

    connectedCallback() {
      this._list  = this.querySelector('.hsp-list');
      this._cards = Array.from(this.querySelectorAll('.hsp-card:not(.hsp-clone)'));
      this._dots  = Array.from(this.querySelectorAll('.hsp-dot'));

      if (!this._list || !this._cards.length) return;

      this._total   = this._cards.length;
      this._jumping = false;

      this._applyCSSVars();
      this._checkMobile();
      this._bindEvents();
 
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this._buildClones();
        this._cacheNaturalOffsets(); 
        this._syncActiveHighlights(this._activeIndex); 
        this._goToAllIndex(this._realStart, false);
      }));
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      this.querySelector('.hsp-panel')?.removeEventListener('wheel', this._onWheel);
    }
 
    _applyCSSVars() {
      const s = this.style;
      const { sectionHeight, panelWidth, accentColor, cardRadius } = this.dataset;
      if (sectionHeight) s.setProperty('--hsp-height',       sectionHeight);
      if (panelWidth)    s.setProperty('--hsp-panel-width',  panelWidth + 'px');
      if (accentColor)   s.setProperty('--hsp-accent',       accentColor);
      if (cardRadius)    s.setProperty('--hsp-card-radius',  cardRadius + 'px');
    } 
    _buildClones() {
      this._list.querySelectorAll('.hsp-clone').forEach(el => el.remove());

      const panel = this.querySelector('.hsp-panel');
      const first = this._cards[0];
      const panelSize = this._isMobile ? panel?.offsetWidth : panel?.offsetHeight;
      const itemSize = this._isMobile ? first.offsetWidth : first.offsetHeight;
      const styles = window.getComputedStyle(this._list);
      const gap = parseFloat(this._isMobile ? styles.columnGap : styles.rowGap) || 0;
      const visibleCount = Math.ceil((panelSize || itemSize) / Math.max(itemSize + gap, 1));
      const bufferCount = Math.max(this._total, visibleCount + 1);

      const makeClone = (realIndex) => {
        const clone = this._cards[realIndex].cloneNode(true);
        clone.classList.add('hsp-clone');
        clone.removeAttribute('data-card-index');
        clone.dataset.loopIndex = realIndex;
        clone.setAttribute('aria-hidden', 'true');
        return clone;
      };

      const before = document.createDocumentFragment();
      const after = document.createDocumentFragment();

      for (let i = -bufferCount; i < 0; i += 1) {
        before.appendChild(makeClone(((i % this._total) + this._total) % this._total));
      }
      for (let i = 0; i < bufferCount; i += 1) {
        after.appendChild(makeClone(i % this._total));
      }

      this._cards.forEach((card, index) => {
        card.dataset.loopIndex = index;
      });
      this._list.insertBefore(before, first);
      this._list.appendChild(after);

      this._realStart = bufferCount;
      this._allItems = Array.from(this._list.children);
    }

    _cacheNaturalOffsets() {
      const prev = this._list.style.transform;
      this._list.style.transform = 'none';

      this._naturalOffsets = this._allItems.map(item =>
        this._isMobile
          ? item.offsetLeft - this._list.offsetLeft
          : item.offsetTop  - this._list.offsetTop
      );

      this._list.style.transform = prev;
    }
 
    _bindEvents() {
      this._dots.forEach(dot   => dot.addEventListener('click',  this._onDotClick));
      this._cards.forEach(card => card.addEventListener('click', this._onCardClick));
      window.addEventListener('resize', this._onResize, { passive: true });
      this.querySelector('.hsp-panel')?.addEventListener('wheel', this._onWheel, { passive: false });

      const prev = this.querySelector('.hsp-nav--prev');
      const next = this.querySelector('.hsp-nav--next');
      if (prev) prev.addEventListener('click', () => this._step(-1));
      if (next) next.addEventListener('click', () => this._step(+1));

      this._initDrag();
    }
 
    _initDrag() {
      const list = this._list;
      if (!list) return;

      let dragging  = false;
      let startPos  = 0;
      let startTx   = 0;
      let dragAxis  = null;
      let dragMoved = 0;

      const onDown = (e) => {
        dragging  = true;
        dragMoved = 0;
        dragAxis  = this._isMobile ? 'X' : 'Y';
        startPos  = dragAxis === 'X'
          ? (e.touches ? e.touches[0].clientX : e.clientX)
          : (e.touches ? e.touches[0].clientY : e.clientY);
        startTx = this._getCurrentTranslate(list, dragAxis);
        list.style.transition = 'none';
        list.style.cursor     = 'grabbing';
      };

      const onMove = (e) => {
        if (!dragging) return;
        e.preventDefault();
        const pos   = dragAxis === 'X'
          ? (e.touches ? e.touches[0].clientX : e.clientX)
          : (e.touches ? e.touches[0].clientY : e.clientY);
        const delta = pos - startPos;
        dragMoved   = Math.abs(delta);
        list.style.transform = dragAxis === 'X'
          ? `translateX(${startTx + delta}px)`
          : `translateY(${startTx + delta}px)`;
      };

      const onUp = () => {
        if (!dragging) return;
        dragging          = false;
        list.style.cursor = '';
        list.style.transition = '';
        if (dragMoved < 6) return;
        this._snapToNearest();
      };
 
      list.addEventListener('click', (e) => {
        if (dragMoved > 6) { e.stopImmediatePropagation(); dragMoved = 0; }
      }, true);

      list.addEventListener('mousedown',  onDown, { passive: true });
      list.addEventListener('touchstart', onDown, { passive: true });
      window.addEventListener('mousemove',  onMove);
      window.addEventListener('touchmove',  onMove, { passive: false });
      window.addEventListener('mouseup',    onUp);
      window.addEventListener('touchend',   onUp);
    }
 
    _step(dir) {
      this._goTo(this._activeIndex + dir);
    }
 
    _goTo(realIndex) {
      if (this._jumping || this._total < 2) return;

      const n = this._total;
      realIndex = ((realIndex % n) + n) % n;
      let allIndex = this._realStart + realIndex;
 
      if (this._activeIndex === n - 1 && realIndex === 0) allIndex = this._realStart + n;
      if (this._activeIndex === 0 && realIndex === n - 1) allIndex = this._realStart - 1;

      this._activeIndex = realIndex;
      this._syncActiveHighlights(realIndex);
      this._goToAllIndex(allIndex, true);
    } 
    _syncActiveHighlights(realIndex) {
      this._dots.forEach((dot, i)   => dot.classList.toggle('is-active',  i === realIndex));
      this._allItems.forEach(card => card.classList.remove('is-active'));
      this._cards[realIndex]?.classList.add('is-active');
    }
 
    _goToAllIndex(allIdx, animate) {
      const list  = this._list;
      const panel = this.querySelector('.hsp-panel');
      if (!panel || !list) return;

      const panelSize = this._isMobile ? panel.offsetWidth : panel.offsetHeight;
 
      if (panelSize === 0) {
        requestAnimationFrame(() => this._goToAllIndex(allIdx, animate));
        return;
      }

      if (!animate) list.style.transition = 'none';

      const item = this._allItems[allIdx];
      if (!item) return;

      this._allItems.forEach(card => card.classList.toggle('is-active', card === item));

      const itemSize   = this._isMobile ? item.offsetWidth   : item.offsetHeight;
      const itemOffset = this._naturalOffsets[allIdx] != null
        ? this._naturalOffsets[allIdx]
        : (this._isMobile ? item.offsetLeft - list.offsetLeft
                          : item.offsetTop  - list.offsetTop);

      const translate = panelSize / 2 - itemSize / 2 - itemOffset;

      list.style.transform = this._isMobile
        ? `translateX(${translate}px)`
        : `translateY(${translate}px)`;

      if (!animate) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          list.style.transition = '';
        }));
        return;
      }
 
      const n = this._total;
      const realEnd = this._realStart + n - 1;
      if (allIdx < this._realStart || allIdx > realEnd) {
        if (this._jumping) return;    
        this._jumping = true;

        const bufferedJumpRealIdx = ((allIdx - this._realStart) % n + n) % n;
        const bufferedJumpTo = this._realStart + bufferedJumpRealIdx;

        const done = (event) => {
          if (event.target !== list || event.propertyName !== 'transform') return;
          list.removeEventListener('transitionend', done);
          this._goToAllIndex(bufferedJumpTo, false);
          this._activeIndex = bufferedJumpRealIdx;
          this._syncActiveHighlights(bufferedJumpRealIdx);
          this._jumping = false;
        };
        list.addEventListener('transitionend', done);
      }
    }
 
    _snapToNearest() {
      const panel = this.querySelector('.hsp-panel');
      if (!panel) return;

      const axis        = this._isMobile ? 'X' : 'Y';
      const panelSize   = this._isMobile ? panel.offsetWidth : panel.offsetHeight;
      if (panelSize === 0) return;
      const currentTx   = this._getCurrentTranslate(this._list, axis);
      const panelCenter = panelSize / 2;

      let closestAllIdx = this._realStart;
      let closestDist   = Infinity;

      this._allItems.forEach((item, i) => {
        const itemSize   = this._isMobile ? item.offsetWidth : item.offsetHeight;
        const naturalOff = this._naturalOffsets[i] ?? 0;
        const center     = naturalOff + currentTx + itemSize / 2;
        const dist       = Math.abs(center - panelCenter);
        if (dist < closestDist) { closestDist = dist; closestAllIdx = i; }
      });
 
      const n = this._total;
      const realIdx = ((closestAllIdx - this._realStart) % n + n) % n;

      this._activeIndex = realIdx;
      this._syncActiveHighlights(realIdx);
      this._goToAllIndex(closestAllIdx, true);
    }
 
    _handleDotClick(e) {
      this._goTo(parseInt(e.currentTarget.dataset.productIndex, 10));
    }

    _handleCardClick(e) {
      const idx = parseInt(e.currentTarget.dataset.cardIndex, 10);
      if (!isNaN(idx)) this._goTo(idx);
    }

    _handleWheel(e) {
      if (this._isMobile || this._jumping || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      e.preventDefault();
      if (this._wheelLocked) return;

      this._wheelDelta += e.deltaY;

      clearTimeout(this._wheelTimer);
      this._wheelTimer = setTimeout(() => {
        this._wheelDelta = 0;
      }, 180);
 
      if (Math.abs(this._wheelDelta) < 24) return;

      const dir = this._wheelDelta > 0 ? 1 : -1;
      this._wheelDelta = 0;
      this._wheelLocked = true;
      setTimeout(() => {
        this._wheelLocked = false;
      }, 600);
      this._step(dir);
    }

    _handleResize() {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        this._checkMobile();
        this._jumping = false;
        this._buildClones();
        this._cacheNaturalOffsets();
        this._syncActiveHighlights(this._activeIndex);
        this._goToAllIndex(this._realStart + this._activeIndex, false);
      }, 120);
    }

    _checkMobile() {
      this._isMobile = window.innerWidth < 750;
    }

    _getCurrentTranslate(el, axis) {
      const matrix = new DOMMatrix(window.getComputedStyle(el).transform);
      return axis === 'X' ? matrix.m41 : matrix.m42;
    }
  }

  customElements.define('hotspot-product-section', HotspotProductSection);
}
 
document.addEventListener('shopify:section:load', (e) => {
  const el = e.target.querySelector('hotspot-product-section');
  if (!el) return;
  el._cards          = [];
  el._allItems       = [];
  el._dots           = [];
  el._naturalOffsets = [];
  el._jumping        = false;
  el.connectedCallback();
});
