if (Shopify.designMode) {
        document.documentElement.classList.add('shopify-design-mode');
}

document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');
 
 
class ProductDetailGallery {
  constructor(selector) {
    this.container = document;
    this.thumbnailContainers = this.container.querySelectorAll(".product-thumbnails");
    this.mainGalleryContainers = this.container.querySelectorAll(".product-main-gallery");
    this.swipers = [];
    // Destroy existing swipers  
    this.container.querySelectorAll(".swiper-initialized").forEach((el) => {
      if (el.swiper) {
        el.swiper.destroy(true, true);
      }
    });

    if (this.thumbnailContainers.length > 0) {
      const thumbnailContainerFirst = this.thumbnailContainers[0];
      const directionAttributeFirst = thumbnailContainerFirst?.dataset.direction?.trim();
      const thumbnailType = thumbnailContainerFirst?.dataset.thumbnail_type?.trim();  

      if (directionAttributeFirst === "modern_view") {
        this.initModernGallery(this.mainGalleryContainers);

      } else if (directionAttributeFirst === "carousel") { 
        this.initCarouselGallery(this.mainGalleryContainers, this.thumbnailContainers, thumbnailType);

      } else {
        this.initDefaultGallery(this.mainGalleryContainers);
      }

    
    }
  }

  initModernGallery(containers) { 
    containers.forEach((container) => {
      const swiper = new Swiper(container, {
        slidesPerView: "auto",
        spaceBetween: 12,
        pagination: {
          el: container.querySelector(".swiper-pagination"),
          clickable: true,
        },
        navigation: {
          nextEl: container.querySelector(".swiper-button-next"),
          prevEl: container.querySelector(".swiper-button-prev"),
        },
      });
      this.swipers.push(swiper);
      console.log(swiper,"swiper")
    });
  }

  initCarouselGallery(mainContainers, thumbContainers, thumbnailType) {
    mainContainers.forEach((mainContainer, index) => {
      const thumbContainer = thumbContainers[index];  
      const isHorizontal = thumbnailType === "horizontal";

      const thumbSwiper = new Swiper(thumbContainer, {
        slidesPerView: "auto",
        spaceBetween: 8,
        direction: isHorizontal ? "horizontal" : "vertical", 
        watchSlidesProgress: true,  
        freeMode: true,
      });
 
      const mainSwiper = new Swiper(mainContainer, {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: false,
       // autoplay: { delay: 3000 },
        pagination: {
          el: mainContainer.querySelector(".swiper-pagination"),
          clickable: true,
        },
        navigation: {
          nextEl: mainContainer.querySelector(".swiper-button-next"),
          prevEl: mainContainer.querySelector(".swiper-button-prev"),
        },
        thumbs: {
          swiper: thumbSwiper,  
        },
      });

      this.swipers.push(mainSwiper, thumbSwiper);
    });
  }

  initDefaultGallery(containers) {
    
  }
}
  
document.addEventListener("DOMContentLoaded", () => {
  const gallery = new ProductDetailGallery(".product-main-gallery");

  const productSection = document.querySelector('[data-section-id]');
  if (!productSection) {
   // console.warn("No product section with [data-section-id] found");
    return;
  }

  const sectionId = productSection.dataset.sectionId;
  const variantLists = productSection.querySelectorAll(".variant-list");

  console.log("Found variant lists:", variantLists.length, "in section:", sectionId);

  if (!variantLists.length) {
    console.warn("No .variant-list elements found inside product section");
    return;
  }
function initVariantSelection() {
  document.querySelectorAll("variant-selector").forEach((variantSelector) => {
    variantSelector.querySelectorAll(".variant-list").forEach((ul) => {
      const hasSelected = ul.querySelector(".variant-list-item.selected");
      if (!hasSelected) {
        ul.querySelector(".variant-list-item")?.classList.add("selected");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", initVariantSelection);

  
document.addEventListener("click", (e) => {
  const item = e.target.closest(".variant-list-item");
  if (!item) return;

  const variantSelector = item.closest("variant-selector");
  if (!variantSelector) return;

  const dataUrl = variantSelector.dataset.url;
  const dataSection = variantSelector.dataset.section;
 
  const connectedUrl = item.dataset.connectedProductUrl;
  if (connectedUrl && connectedUrl !== '' && connectedUrl !== 'nil') {
    window.history.pushState({}, '', connectedUrl);
    onVariantChanged(null, connectedUrl, dataSection);
    return;
  }
 
  const variantList = item.closest(".variant-list");
  if (!variantList) return;

  variantList.querySelectorAll(".variant-list-item").forEach((li) => {
    li.classList.remove("selected");
  });
  item.classList.add("selected");

  const optionValues = Array.from(
    variantSelector.querySelectorAll(".variant-list"),
    (ul) => {
      const selected = ul.querySelector(".variant-list-item.selected");
      return selected ? selected.getAttribute("data-value-id") : null
    }
  ).filter(Boolean).join(",");

  console.log("selectedValues:", optionValues);
 
  onVariantChanged(optionValues, dataUrl, dataSection);
});
function updateUrlForVariants(variantId) {
  if (!variantId) return;
  const url = new URL(window.location);
  const base = url.origin + url.pathname;
  const params = new URLSearchParams(url.search);
  params.set('variant', variantId);
  window.history.replaceState(
    {},
    '',
    base + '?' + params.toString().replace(/%2C/gi, ',')
  );
} 
async function onVariantChanged(optionValues, dataUrl, dataSection) { 
  if (!dataUrl || !dataSection) {
    console.warn("onVariantChanged: missing dataUrl or dataSection", { dataUrl, dataSection });
    return;
  }

  try {
    const fetchUrl = new URL(dataUrl, window.location.origin);
    fetchUrl.searchParams.set("section_id", dataSection); 
    const finalUrl = optionValues
      ? `${fetchUrl.toString()}&option_values=${optionValues}`
      : fetchUrl.toString();

    console.log("fetching:", finalUrl);

    const response = await fetch(finalUrl);
    if (!response.ok) {
      console.error("Fetch failed:", response.status, finalUrl);
      return;
    }

    const responseText = await response.text();
    const html = new DOMParser().parseFromString(responseText, 'text/html');

    const productTemplate = html.querySelector("product-template");
    const variantId = productTemplate?.dataset.variantid;
    console.log("variantId:", variantId); 
    if (variantId) {
      updateUrlForVariants(variantId);
    }

    updateProductGallery(variantId, html);
    updateProductDetails(variantId, html);

  } catch (e) {
    console.error("onVariantChanged error:", e);
  }
} 
window.addEventListener("popstate", () => {
  const variantSelector = document.querySelector("variant-selector");
  if (!variantSelector) return;

  const path = window.location.pathname;
  const dataSection = variantSelector.dataset.section;

  onVariantChanged(null, path, dataSection);
});





function updateProductGallery(variantId, html) {
  console.log(variantId, "variantId", "html", html); 
  const newGallery = html.querySelector("product-gallery");
  const currentGallery = document.querySelector("product-gallery");
  if (!newGallery || !currentGallery) return; 
  // Destroy swipers before replacing
  currentGallery.querySelectorAll(".swiper-initialized").forEach((el) => {
    if (el.swiper) el.swiper.destroy(true, true);
  });



  const swapGallery = () => {
    if (newGallery && currentGallery) { 
  currentGallery.replaceWith(newGallery);

      requestAnimationFrame(() => {
        try {
          const galleryMain = currentGallery.querySelector(".product-main-gallery");
          if (galleryMain) {
            new ProductDetailGallery(".product-main-gallery");
          }
        } catch (e) {
          console.error("Error initializing ProductDetailGallery:", e);
        }
      });
    }
  };

  swapGallery();
}

function updateProductDetails(variantId, html) {
  console.log(variantId, "variantId", "html", html); 
  const SELECTORS = [
    ".price-block",
    ".product__variants",
    "[data-product-availability]",
    ".variant_selector",
    ".inventory"
  ];

  SELECTORS.forEach((selector) => {
    const current = document.querySelector(selector);
    const incoming = html.querySelector(selector);
    if (current && incoming) {
      current.replaceWith(incoming);
    }
  });

  const currentCta = document.querySelector(".product-detail-page-add-cart");
  const incomingCta = html.querySelector(".product-detail-page-add-cart");

  if (currentCta && incomingCta) {
    const currentHtml = currentCta.outerHTML.trim();
    const incomingHtml = incomingCta.outerHTML.trim();

    if (currentHtml !== incomingHtml) {
      currentCta.replaceWith(incomingCta);
    }
  }
}
  

  function initGiftCardRecipient() {
    const recipientRoots = document.querySelectorAll("gift-card-recipient-form");

    recipientRoots.forEach((root) => {
      const toggle = root.querySelector("[data-recipient-toggle]");
      const fields = root.querySelector("[data-recipient-fields]");
      const requiredFlag = root.querySelector("[data-recipient-required-flag]");
      const emailInput = root.querySelector("[data-recipient-email]");

      if (!toggle || !fields || !requiredFlag) return;

      const updateVisibility = () => {
        const enabled = toggle.checked;
        fields.hidden = !enabled;
        requiredFlag.value = enabled ? "true" : "";
        if (emailInput) emailInput.required = enabled;
      };

      toggle.addEventListener("change", updateVisibility);
      updateVisibility();

      if (emailInput) {
        emailInput.addEventListener("input", () => {
          emailInput.setCustomValidity("");
        });
      }

      const form = root.closest("form[action='/cart/add']")
                || document.querySelector("form[action='/cart/add']");

      if (!form) return;

      form.addEventListener("submit", (e) => {
        if (!toggle.checked) return;
        if (!emailInput) return;

        emailInput.setCustomValidity("");

        if (!emailInput.value.trim()) {
          e.preventDefault();
          emailInput.setCustomValidity("Please enter recipient email");
          emailInput.reportValidity();
          emailInput.focus();
          return;
        }

        // Regex: requires name@domain.tld format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(emailInput.value.trim())) {
          e.preventDefault();
          emailInput.setCustomValidity("Please enter a valid email address (e.g. name@example.com)");
          emailInput.reportValidity();
          emailInput.focus();
          return;
        }
      });
    });
  }
 initGiftCardRecipient();

  
 
});
 
 
 document.addEventListener("click", (event) => {
  const button = event.target.closest(".product-media__play-button[data-media-id]");
  if (!button) return;
  const mediaId = button.getAttribute("data-media-id");
  if (!mediaId) return;
  const mediaRoot = button.closest(".product-media.product-media--video");
  if (!mediaRoot) return;
  const preview = mediaRoot.querySelector(".product-media__preview");
  const videoWrapper = mediaRoot.querySelector(".product-media__video-wrapper");
  if (!videoWrapper) return;
  if (preview) preview.style.display = "none";
  videoWrapper.classList.remove("product-media__video-wrapper--hidden", "d-none");
  const videoEl = videoWrapper.querySelector("video");
  if (videoEl) {
    videoEl.play().catch((e) => console.error("play error:", e));
    videoEl.focus({ preventScroll: true });
  }
});

document.addEventListener("click", (event) => {
  const openTrigger = event.target.closest('[data-model-open]');
  if (!openTrigger) return;
  const media3dId = openTrigger.getAttribute('data-media-id');
  if (!media3dId) return;
  const root = openTrigger.closest('product-model');
  if (!root) return;
  const preview_3d = root.querySelector(`.product-3d-model__preview[data-media-id="${media3dId}"]`);
  const mainViewer = root.querySelector(`.product-3d-model__main[data-image-id="${media3dId}"]`);
  console.log("preview_3d:", preview_3d);
  console.log("mainViewer:", mainViewer);
  if (!mainViewer) return;
  if (preview_3d) preview_3d.style.display = 'none';
  mainViewer.classList.remove('d-none');
});

document.addEventListener("click", (event) => {
  const closeBtn = event.target.closest('[data-model-close]');
  if (!closeBtn) return;
  const dialog = closeBtn.closest('[data-model-dialog]');
  if (dialog) {
    dialog.close ? dialog.close() : dialog.setAttribute('hidden', '');
  }
});
