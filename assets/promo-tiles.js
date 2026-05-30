window.addEventListener('load', () => {
  document.querySelectorAll('[data-promo-tiles]').forEach((el) => {
    const columns = parseInt(el.dataset.columns || '3', 10);
    const gap = parseInt(el.dataset.gap || '16', 10);

    new Swiper(el, {
      slidesPerView: 1,
      spaceBetween: gap,
      grabCursor: true,
      navigation: {
        nextEl: el.querySelector('.swiper-button-next'),
        prevEl: el.querySelector('.swiper-button-prev'),
      },
      pagination: {
        el: el.querySelector('.swiper-pagination'),
        clickable: true,
      },
      breakpoints: {
        640:  { slidesPerView: 2, spaceBetween: gap },
        1024: { slidesPerView: columns, spaceBetween: gap },
      },
    });
  });
});

document.addEventListener('shopify:section:load', (e) => {
  const el = e.target.querySelector('[data-promo-tiles]');
  if (!el || typeof Swiper === 'undefined') return;
  const columns = parseInt(el.dataset.columns || '3', 10);
  const gap = parseInt(el.dataset.gap || '16', 10);

  new Swiper(el, {
    slidesPerView: 1,
    spaceBetween: gap,
    grabCursor: true,
    navigation: {
      nextEl: el.querySelector('.swiper-button-next'),
      prevEl: el.querySelector('.swiper-button-prev'),
    },
    pagination: {
      el: el.querySelector('.swiper-pagination'),
      clickable: true,
    },
    breakpoints: {
      640:  { slidesPerView: 2, spaceBetween: gap },
      1024: { slidesPerView: columns, spaceBetween: gap },
    },
  });
});