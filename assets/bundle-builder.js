/**
 * bundle-builder.js
 * Collection-based Bundle Builder
 * - Swiper for product cards per pane
 * - Right-side sticky panel
 * - Shopify /cart/add.js AJAX
 */
(function () {
  'use strict';

  /* ── Money formatter ──────────────────────────────────── */
  function formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    var priceParts = /\{\{\s*(\w+)\s*\}\}/;
    format = format || '${{ amount }}';

    function delimit(n, precision, thou, dec) {
      thou = thou || ','; dec = dec || '.';
      if (isNaN(n) || n == null) return 0;
      n = (n / 100.0).toFixed(precision);
      var parts = n.split('.');
      var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thou);
      var cents2 = parts[1] ? dec + parts[1] : '';
      return dollars + cents2;
    }

    var value;
    switch (format.match(priceParts)[1]) {
      case 'amount':                                  value = delimit(cents, 2); break;
      case 'amount_no_decimals':                      value = delimit(cents, 0); break;
      case 'amount_with_comma_separator':             value = delimit(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = delimit(cents, 0, '.', ','); break;
      default:                                        value = delimit(cents, 2);
    }
    return format.replace(priceParts, value);
  }

  function qs(sel, ctx)  { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* ── BundleBuilder ────────────────────────────────────── */
  function BundleBuilder(cfg) {
    var sid         = cfg.sectionId;
    var fmt         = cfg.moneyFormat;
    var tabs        = cfg.tabs;
    var i18n        = cfg.i18n;
    var bundle      = {};
    var activeTab   = 0;
    var pillStyle   = null;
    var cardSwipers = {}; // keyed by tab index

    tabs.forEach(function (t) { bundle[t.index] = []; });

    var root = qs('#bb-' + sid);
    if (!root) return;

    /* ── Helpers ──────────────────────────────────────────── */
    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function totalItems() {
      return tabs.reduce(function (s, t) { return s + bundle[t.index].length; }, 0);
    }

    function rawTotal() {
      return tabs.reduce(function (s, t) {
        return s + bundle[t.index].reduce(function (a, p) { return a + p.price; }, 0);
      }, 0);
    }

    /* ── Pill style ───────────────────────────────────────── */
    function injectPillStyle() {
      var el = document.createElement('style');
      el.id  = '_bbPill_' + sid;
      document.head.appendChild(el);
      pillStyle = el;
    }

    function positionPill(idx) {
      var tabBtns = qsa('.bb-tab', root);
      var btn  = tabBtns[idx];
      var wrap = qs('.bb-tab-wrap', root);
      if (!btn || !wrap) return;
      var btnRect  = btn.getBoundingClientRect();
      var wrapRect = wrap.getBoundingClientRect();
      var left = btnRect.left - wrapRect.left;
      pillStyle.textContent =
        '#bb-' + sid + ' .bb-tab-wrap::before{' +
        'left:' + left + 'px;width:' + btn.offsetWidth + 'px}';
    }

    /* ── Tab switching ────────────────────────────────────── */
    function switchTab(idx) {
      activeTab = Math.max(0, Math.min(tabs.length - 1, idx));

      qsa('.bb-tab', root).forEach(function (b, i) {
        b.classList.toggle('active', i === activeTab);
        b.setAttribute('aria-selected', i === activeTab ? 'true' : 'false');
      });
      qsa('.bb-pane', root).forEach(function (p, i) {
        p.classList.toggle('active', i === activeTab);
      });

      setTimeout(function () { positionPill(activeTab); }, 10);

      // Recalculate the newly-visible swiper (hidden panes have 0 width)
      var sw = cardSwipers[activeTab];
      if (sw) sw.update();
    }

    function initTabs() {
      qsa('.bb-tab', root).forEach(function (btn, i) {
        btn.addEventListener('click', function () { switchTab(i); });
      });

      var prevBtn = qs('#bb-prev-' + sid, root);
      var nextBtn = qs('#bb-next-' + sid, root);
      if (prevBtn) prevBtn.addEventListener('click', function () { switchTab(activeTab - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { switchTab(activeTab + 1); });

      window.addEventListener('resize', function () { positionPill(activeTab); });
      setTimeout(function () { positionPill(0); }, 60);
    }

    /* ── Card Swipers ─────────────────────────────────────── */
    function initCardSwipers() {
      function run() {
        if (typeof Swiper !== 'undefined') {
          createCardSwipers();
          return;
        }
        // Swiper not yet available — poll every 100ms up to 5s
        var attempt = 0;
        var timer = setInterval(function () {
          attempt++;
          if (typeof Swiper !== 'undefined') {
            clearInterval(timer);
            createCardSwipers();
          } else if (attempt >= 50) {
            clearInterval(timer);
            console.warn('[BundleBuilder] Swiper never loaded.');
          }
        }, 100);
      }

      // Run after full page load (guarantees Swiper script has executed)
      if (document.readyState === 'complete') {
        run();
      } else {
        window.addEventListener('load', run);
      }
    }

    function createCardSwipers() {
      qsa('.bb-cards-swiper', root).forEach(function (el) {
        var pane     = el.closest('.bb-pane');
        var tabIndex = pane ? parseInt(pane.dataset.catIndex, 10) : null; 
        var prevEl = el.querySelector('.swiper-button-prev');
        var nextEl = el.querySelector('.swiper-button-next');

        var options = {
          slidesPerView: 4,
          spaceBetween:  16,
          grabCursor:    true,
          watchOverflow: true,
          freeMode:      { enabled: true }
        };

        if (prevEl && nextEl) {
          options.navigation = {
            prevEl:        prevEl,
            nextEl:        nextEl,
            disabledClass: 'swiper-button-disabled'
          };
        }

        // Swiper 9+ modular build — pass modules in options
        var mods = [];
        if (typeof SwiperFreeMode    !== 'undefined') mods.push(SwiperFreeMode);
        if (typeof SwiperNavigation  !== 'undefined') mods.push(SwiperNavigation);
        if (mods.length) options.modules = mods;

        try {
          var sw = new Swiper(el, options);
          if (tabIndex !== null) cardSwipers[tabIndex] = sw;
        } catch (e) {
          console.warn('[BundleBuilder] Card swiper init error:', e);
        }
      });
    }

    /* ── Cards ────────────────────────────────────────────── */
    function openPanelCat(catIndex) {
      var cat = qs('#bb-pcat-' + sid + '-' + catIndex, root);
      if (cat) cat.classList.add('open');
    }

    function toggleProduct(card) {
      var catIndex  = parseInt(card.dataset.catIndex, 10);
      var variantId = card.dataset.variantId;
      var arr       = bundle[catIndex];
      if (!arr) return;
      var existIdx  = arr.findIndex(function (p) { return p.variantId === variantId; });

      if (existIdx >= 0) {
        arr.splice(existIdx, 1);
      } else {
        arr.push({
          variantId: variantId,
          productId: card.dataset.productId,
          title:     card.dataset.productTitle,
          price:     parseInt(card.dataset.productPrice, 10),
          catKey:    card.dataset.catKey,
          catIndex:  catIndex
        });
        openPanelCat(catIndex);
      }
      render();
    }

    function bindCards() {
      root.addEventListener('click', function (e) {
        var btn = e.target.closest('.bb-btn');
        if (!btn) return;
        var card = btn.closest('.bb-card');
        if (!card) return;
        toggleProduct(card);
      });
    }

    /* ── Panel ────────────────────────────────────────────── */
    function bindPanel() {
      root.addEventListener('click', function (e) {
        var head = e.target.closest('.bb-panel-cat-head');
        if (!head) return;
        var idx = parseInt(head.dataset.toggle, 10);
        var cat = qs('#bb-pcat-' + sid + '-' + idx, root);
        if (cat) cat.classList.toggle('open');
      });

      root.addEventListener('click', function (e) {
        var rem = e.target.closest('.bb-item-remove');
        if (!rem) return;
        var variantId = rem.dataset.variantId;
        var catIndex  = parseInt(rem.dataset.catIndex, 10);
        bundle[catIndex] = bundle[catIndex].filter(function (p) {
          return p.variantId !== variantId;
        });
        render();
      });
    }

    /* ── Add All to Cart ──────────────────────────────────── */
    function addAllToCart(btn) {
      var items = [];
      tabs.forEach(function (t) {
        bundle[t.index].forEach(function (p) {
          items.push({ id: parseInt(p.variantId, 10), quantity: 1 });
        });
      });
      if (!items.length) return;

      var origText    = btn.textContent;
      btn.textContent = '...';
      btn.disabled    = true;

      fetch('/cart/add.js', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body:    JSON.stringify({ items: items })
      })
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (body) {
            throw new Error(body.description || body.message || r.status);
          });
        }
        return r.json();
      })
      .then(function () {
        document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
        fetch('/cart.js').then(function (r) { return r.json(); }).then(function (cart) {
          document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true, detail: { cart: cart } }));
          qsa('[data-cart-count],.cart-count,#CartCount,.js-cart-count').forEach(function (el) {
            el.textContent = cart.item_count;
          });
        });

        tabs.forEach(function (t) { bundle[t.index] = []; });
        render();

        btn.textContent = '✓ ' + (i18n.addedToCart || 'Added!');
        setTimeout(function () {
          btn.textContent = origText;
          btn.disabled    = true;
          btn.setAttribute('aria-disabled', 'true');
        }, 2500);
      })
      .catch(function (err) {
        console.error('[BundleBuilder]', err);
        var msg = err.message || 'Error – try again';
        // 422 = unavailable variant — tell the user clearly
        btn.textContent = msg.length < 60 ? msg : 'Some items unavailable';
        btn.disabled    = false;
        btn.setAttribute('aria-disabled', 'false');
        setTimeout(function () { btn.textContent = origText; btn.disabled = false; }, 3000);
      });
    }

    function bindAddAll() {
      var btn = qs('#bb-add-all-' + sid, root);
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        addAllToCart(btn);
      });
    }

    /* ── Render ───────────────────────────────────────────── */
    function render() {
      var n     = totalItems();
      var total = rawTotal();

      var hdrCount = qs('#bb-hdr-count-' + sid, root);
      if (hdrCount) hdrCount.textContent = n;

      tabs.forEach(function (t) {
        var tc = qs('#bb-tc-' + sid + '-' + t.index, root);
        if (tc) tc.textContent = bundle[t.index].length;
      });

      var panelTotal = qs('#bb-tray-total-' + sid, root);
      if (panelTotal) panelTotal.textContent = formatMoney(total, fmt);

      tabs.forEach(function (t) {
        var colEl   = qs('#bb-col-' + sid + '-' + t.index, root);
        var countEl = qs('#bb-col-count-' + sid + '-' + t.index, root);
        var items   = bundle[t.index];

        if (countEl) {
          countEl.textContent = items.length + ' ' + (i18n.added || 'added');
          countEl.classList.toggle('bb-zero', items.length === 0);
        }

        if (!colEl) return;
        colEl.innerHTML = '';

        if (items.length === 0) {
          colEl.innerHTML = '<div class="bb-empty-state">' + (i18n.nothingSelected || 'No product chosen') + '</div>';
        } else {
          items.forEach(function (p) {
            var row = document.createElement('div');
            row.className = 'bb-item-row';
            row.innerHTML =
              '<span class="bb-item-row-name">' + esc(p.title) + '</span>' +
              '<span class="bb-item-row-price">' + formatMoney(p.price, fmt) + '</span>' +
              '<button class="bb-item-remove" data-variant-id="' + p.variantId + '" data-cat-index="' + p.catIndex + '" aria-label="Remove">&times;</button>';
            colEl.appendChild(row);
          });
        }
      });

      var itemTotalEl = qs('#bb-item-total-' + sid, root);
      if (itemTotalEl) {
        itemTotalEl.textContent = n + ' ' + (i18n.items || 'items') + ' · ' + formatMoney(total, fmt);
      }

      var addBtn = qs('#bb-add-all-' + sid, root);
      if (addBtn) {
        addBtn.disabled = n === 0;
        addBtn.setAttribute('aria-disabled', n === 0 ? 'true' : 'false');
      }

      qsa('.bb-card', root).forEach(function (card) {
        var variantId = card.dataset.variantId;
        var catIndex  = parseInt(card.dataset.catIndex, 10);
        var inBundle  = bundle[catIndex] && bundle[catIndex].some(function (p) { return p.variantId === variantId; });
        card.classList.toggle('bb-selected', inBundle);
        var btn = card.querySelector('.bb-btn');
        if (!btn) return;
        btn.textContent = inBundle
          ? (btn.dataset.removeLabel || i18n.removeFromBundle || 'Remove from Bundle')
          : (btn.dataset.addLabel    || i18n.addToBundle     || 'Add to Bundle');
        btn.classList.toggle('bb-btn-active', inBundle);
        btn.setAttribute('aria-pressed', inBundle ? 'true' : 'false');
      });
    }

    /* ── Init ─────────────────────────────────────────────── */
    injectPillStyle();
    initTabs();
    initCardSwipers();
    bindCards();
    bindPanel();
    bindAddAll();
    render();
  }

  /* ── Boot ─────────────────────────────────────────────── */
  function boot() {
    var data = window.bbSectionData;
    if (!data) return;
    Object.keys(data).forEach(function (sid) {
      if (data[sid]._initialized) return;
      data[sid]._initialized = true;
      BundleBuilder(data[sid]);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function () {
    var data = window.bbSectionData;
    if (!data) return;
    Object.keys(data).forEach(function (sid) { delete data[sid]._initialized; });
    boot();
  });

})();