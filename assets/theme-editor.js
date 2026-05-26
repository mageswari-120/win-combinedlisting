window.addEventListener("load", () => {
  document.addEventListener("shopify:section:load", function (event) {
    const section = event.target;
    
    if (section.classList.contains("main-product-template")) {
      window.dispatchEvent(new Event("resize"));
      if (typeof ProductGallery !== "undefined") {
        new ProductGallery(section);
      } else {
        console.error("ProductGallery class is not defined");
      }
    }

    // if (section.classList.contains("section-collection-gallery")) {
    //   const collectionGalleryElement = section.querySelector(
    //     "wdt-collection-gallery"
    //   );
    //   if (
    //     collectionGalleryElement &&
    //     typeof collectionGalleryElement.initializeSlider === "function"
    //   ) {
    //     collectionGalleryElement.initializeSlider();
    //   }
    // }

    // if (section.classList.contains("wdt-related-products")) {
    //   const productRecommendationsElement = section.querySelector(
    //     "product-recommendations"
    //   );
    //   if (
    //     productRecommendationsElement &&
    //     typeof productRecommendationsElement.connectedCallback === "function"
    //   ) {
    //     productRecommendationsElement.connectedCallback();
    //   }
    // }

    if (section.classList.contains("section-marquee")) {
      window.dispatchEvent(new Event("resize"));
    }

    if (section.classList.contains("text-with-icons")) {
      initWdtIcon();
    }
    if (section.classList.contains("section-newsletter-popup")) {
      initNewsletterModal();
    }

    if (section.querySelector("#sticky-atc-bar")) {
      initializeStickyAtcBar();
    }

  });

 
  function initWdtIcon() {
    let wdtIconItem = document.querySelectorAll(".text-with-icon-item");
    if (wdtIconItem) {
      wdtIconItem.forEach((wdtItem) => {
        let wdtItem_height = wdtItem.clientHeight / 2;
        let wdtItem_parent = wdtItem.closest(".section-text-with-icon");
        if (wdtItem_parent) {
          wdtItem_parent.setAttribute(
            "style",
            `--before-top: ${wdtItem_height}px;`
          );
        }
      });
    }
  }
  initWdtIcon();

  if (window.routes.cart_type == "page") {
    if (!customElements.get("add-to-cart-form")) {
      customElements.define(
        "add-to-cart-form",
        class AddToCartForm extends HTMLElement {
          constructor() {
            super();
            this.form = this.querySelector("form");
            const selectElement = this.form.querySelector("[name=id]");
            this.submitButton = this.querySelector('[type="button"]');
            const variantSelect = this.form.querySelector('select[name="id"]');
            const variantId = selectElement
              ? selectElement.value
              : variantSelect;
            this.submitButton.addEventListener("click", () => {
              this.form.submit();
            });
          }
        }
      );
    }
  }

   document.addEventListener('shopify:section:unload', (event) => {
    const section = event.target;   
  });
});



document.addEventListener('shopify:block:select', function (event) {
  const selectedBlock = event.target;
  const isSlideBlock = selectedBlock.classList.contains('slide-item');

  if (!isSlideBlock) return;

  const parentSliderComponent = selectedBlock.closest('wdt-slideshow');
  if (!parentSliderComponent || !parentSliderComponent.swiperInstance) return;

  const swiper = parentSliderComponent.swiperInstance;
  const slideIndex = Array.from(swiper.slides).indexOf(selectedBlock);

  if (slideIndex !== -1) {
    swiper.slideToLoop(slideIndex, 500); 
  }
});

document.addEventListener('shopify:block:deselect', function (event) {
  const deselectedBlock = event.target;
  const isSlideBlock = deselectedBlock.classList.contains('slide-item');

  if (!isSlideBlock) return;

  const parentSliderComponent = deselectedBlock.closest('wdt-slideshow');
  if (!parentSliderComponent || !parentSliderComponent.swiperInstance) return;

  const swiper = parentSliderComponent.swiperInstance;
  // if (swiper?.autoplay) {
  //   swiper.autoplay.start(); 
  // }
});
document.addEventListener("DOMContentLoaded", email__button);
document.addEventListener("shopify:block:change", email__button);
document.addEventListener("shopify:block:select", email__button);
document.addEventListener("shopify:block:deselect", email__button);


