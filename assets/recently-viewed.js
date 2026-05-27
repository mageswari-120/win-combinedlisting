function renderProduct(product) {
  const template = document.querySelector('[data-recently-viewed-template]');
  const clone = template.content.cloneNode(true);

  // Fill in data
  clone.querySelector('[data-rv-url]').href = `/products/${product.handle}`;
  
  const img = clone.querySelector('[data-rv-image]');
  if (product.featured_image) {
    img.src = product.featured_image;
    img.alt = product.title;
  } else {
    img.remove();
  }

  clone.querySelector('[data-rv-title]').textContent = product.title;
  clone.querySelector('[data-rv-price]').textContent = formatMoney(product.price);

  const compare = clone.querySelector('[data-rv-compare]');
  if (product.compare_at_price_max > product.price) {
    compare.textContent = formatMoney(product.compare_at_price_max);
    compare.style.display = '';
  }

  // Return as HTML string
  const wrapper = document.createElement('div');
  wrapper.appendChild(clone);
  return wrapper.innerHTML;
}