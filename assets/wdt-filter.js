document.addEventListener("DOMContentLoaded", function () {
  let isTabPressed = false;
  let calledFromSidebarFilters = false;
  let clickListenerAdded = false;
  let minRangeValue = 0;
  let maxRangeValue = 0;
  let isArrowKeyPressed = false;
  const paginationType = document.querySelector("#AjaxinatePagination");
  if (paginationType) {
    endlessScroll = new Ajaxinate();
  }

const fetchProducts = async () => {   
  if(calledFromSidebarFilters === true){
  const filterLayoutStyle = document.querySelector("div[data-filter-layout]");
  if (window.innerWidth > 991) {   
    if (filterLayoutStyle) {
      const layout = filterLayoutStyle.getAttribute('data-filter-layout');         
      if (layout === 'vertical' || layout === 'horizontal') {                
        calledFromSidebarFilters = false;
      } else {
        calledFromSidebarFilters = true;
      }
    } else {
      calledFromSidebarFilters = true;
    }    
  } else {
    calledFromSidebarFilters = true;
  }
}
  
  
    const oldProducts = document.querySelector(".product-section");
    const oldActiveFilter = document.getElementById("selected-filters");
    const oldClearAll = document.getElementById("clear-all-filters");
    const oldSorting = document.querySelector('product-sorting');
    const oldCount = document.querySelector('.number-of-products-count');
  
  
    if (!oldProducts) {
      return;
    }
    
  
    const productGridContainer = oldProducts.querySelector(".product-grid-container");
    if (!productGridContainer) {
      return;
    }

    const filters = document.querySelector("product-filters");
    const offcanvasElement = document.getElementById("filtersOffcanvas");
    const lastFocusedElement = document.activeElement;
  

    // Save current range values
    const minRangeInput = document.querySelector("input[data-min-price]");
    const maxRangeInput = document.querySelector("input[data-max-price]");
    const minNumberInput = document.querySelector(".field__input_min"); 
    const maxNumberInput = document.querySelector(".field__input_max");  

    let minRangeValue = minRangeInput ? minRangeInput.value : "";
    let maxRangeValue = maxRangeInput ? maxRangeInput.value : "";
    let minNumberValue = minNumberInput ? minNumberInput.value : "";
    let maxNumberValue = maxNumberInput ? maxNumberInput.value : "";

   const filterLayoutSelector = document.querySelector("div[data-filter-layout]");
   const layoutCheck = filterLayoutSelector.getAttribute('data-filter-layout');        
    // Add loading class
    productGridContainer.classList.add("loading");
    setTimeout(() => {
      productGridContainer.classList.remove("loading");
    }, 1000);
    
    try {
      // Fetch the updated product data
      const response = await fetch(window.location.href);
      const data = await response.text();
      const parser = new DOMParser();
      const newProducts = parser.parseFromString(data, "text/html");

      // Get updated filters section
      const newFilters = newProducts.querySelector("product-filters");
      const newProductSection = newProducts.querySelector(".product-section");
      const newActiveFilter = newProducts.getElementById("selected-filters");
      const newClearAll = newProducts.getElementById("clear-all-filters");
      const newSorting = newProducts.getElementById("product-sorting");
      const newCount = newProducts.querySelector('.number-of-products-count');
    
      
      // Ensure Offcanvas remains open
      const filtersOffcanvas = newProducts.querySelector("#filtersOffcanvas");
      if (filtersOffcanvas && calledFromSidebarFilters) {
        const offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(filtersOffcanvas);
        offcanvasInstance.show();
      }

      // Replace product section and filters
       if (layoutCheck === 'vertical' || layoutCheck === 'horizontal') {     
      if (oldActiveFilter && newActiveFilter) {
  oldActiveFilter.textContent = "";
  newActiveFilter.childNodes.forEach(node => {
    oldActiveFilter.appendChild(node.cloneNode(true));
  });
} 
      oldClearAll?.replaceWith(newClearAll);        
      }
      toggleClearAllButton();
     
      if(oldProducts){
      oldProducts?.replaceWith(newProductSection);       
      }
       if (layoutCheck === 'drawer') {     
       if(oldCount){
      oldCount?.replaceWith(newCount);       
      }
       }      
       
       if (filters && newFilters) {
        filters.replaceWith(newFilters);
      }
    

       if (layoutCheck === 'vertical') {
         if(oldSorting){
        oldSorting.replaceWith(newSorting); 
         }
       }
      // Reinitialize functionalities
      setupFilterRemoval();
      customSortSelect();
      initQuickModal();
      if (paginationType) {
        if (endlessScroll && typeof endlessScroll.destroy === "function") {
          endlessScroll.destroy();
        }
        initEndlessScroll();
      }
      new SidebarFilters();

      // Restore range values
      if (minRangeInput) minRangeInput.value = minRangeValue;
      if (maxRangeInput) maxRangeInput.value = maxRangeValue;
      if (minNumberInput) minNumberInput.value = minNumberValue;
      if (maxNumberInput) maxNumberInput.value = maxNumberValue;

      // Ensure the Offcanvas Close Button Works After AJAX Update
      reinitializeOffcanvas();

      if (lastFocusedElement && lastFocusedElement.id) {
        const restoredElement = document.getElementById(lastFocusedElement.id);
        if (restoredElement) {
          restoredElement.focus();
        }
      }

      // Ensure backdrop click works
      if (!clickListenerAdded) {    
        document.addEventListener("click", offcanvasBackdropHandler);
        clickListenerAdded = true; 
      }

      // Reinitialize PriceRange component after fetching
    //  document.querySelectorAll("price-range").forEach((el) => new PriceRange(el));

    } catch (error) {
    }

    const bodyElement = document.querySelector("body");
  const wrapperFilter = document.querySelector('.facts_wrapper_filter');
    if (bodyElement) {
      bodyElement.removeAttribute("style");
    }
  if (wrapperFilter) {
      wrapperFilter.classList.toggle("wdt-filter-in-active");
    }

  setTimeout(() => {
  restoreShowMoreVisibility();
}, 50); 

  
  
};

 function restoreShowMoreVisibility() {
  document.querySelectorAll('.filter-panel').forEach(panel => {
    const showMoreItems = panel.querySelectorAll('.show-more-item');
    const hasChecked = Array.from(showMoreItems).some(item => {
      const input = item.querySelector("input[type='checkbox']");
      return input && input.checked;
    });

    if (hasChecked) {
      showMoreItems.forEach(item => item.classList.remove('hidden'));

      const showMoreBtn = panel.querySelector('show-more-button');
      if (showMoreBtn) {
        const showMoreLabel = showMoreBtn.querySelector('.label-show-more');
        const showLessLabel = showMoreBtn.querySelector('.label-show-less');

        // Hide "Show more", show "Show less"
        if (showMoreLabel) showMoreLabel.classList.add('hidden');
        if (showLessLabel) showLessLabel.classList.remove('hidden');

        showMoreBtn.classList.remove('hidden');
      }
    }
  });
}

  
function reinitializeOffcanvas() {
    const offcanvasElement = document.getElementById("filtersOffcanvas");
    if (!offcanvasElement) return;    
    const offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
    const closeButton = offcanvasElement.querySelector(".btn-close");
    if (closeButton && !closeButton.dataset.listenerAdded) {
        closeButton.addEventListener("click", (event) => {
            const calledFromSidebarFilters = determineSidebarSource(event);
            const filterTag = closeButton.closest(".filter-tag");
            if (filterTag) {
                filterTag.style.display = "none";
            }
            offcanvasInstance.hide();
        });
        closeButton.dataset.listenerAdded = "true"; 
    }
    if (!window.offcanvasBackdropListenerAdded) {
        document.addEventListener("click", (event) => {
            if (event.target.classList.contains("offcanvas-backdrop")) {
                offcanvasInstance.hide();
                event.target.remove();
            }
        });
        window.offcanvasBackdropListenerAdded = true;
    }
}

 
  const offcanvasBackdropHandler = (event) => {
  const offcanvasElement = document.getElementById("filtersOffcanvas");
  const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);

  if (event.target.classList.contains("offcanvas-backdrop")) {
    if (offcanvasInstance && offcanvasInstance._isShown) {
      offcanvasInstance.hide();
      event.target.parentNode.removeChild(event.target);
      const bodyElement = document.querySelector("body");
      if (bodyElement) {
        bodyElement.removeAttribute("style");
      }
    }
  } else {
    const bodyElement = document.querySelector("body");
    if (bodyElement) {
      bodyElement.removeAttribute("style");
    }
  }
};

const removeClickListener = () => {
  if (clickListenerAdded) {
    document.removeEventListener("click", offcanvasBackdropHandler);
    clickListenerAdded = false;
  }
};

  function determineSidebarSource(event) {

    if (!event || !event.target) {
        return false; // Default assumption: desktop
    }

  const desktopForm = document.getElementById("FacetFiltersFormDesktop");
  const mobileForm = document.getElementById("FacetFiltersFormMobile");

  let formElement;

  if (event.target.tagName === "LABEL") {
    const forAttr = event.target.getAttribute("for");
    if (forAttr) {
      const relatedInput = document.getElementById(forAttr);
      if (relatedInput) {
        formElement = relatedInput.closest("form");
      }
    }
  } else {
    formElement = event.target.closest("form");
  }

    if (!formElement) {
        return false; // Assume desktop if form is not found
    }
    return formElement === mobileForm;
}

  
  function setupFilterRemoval() {
    document.querySelectorAll("#selected-filters .filter-tag").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        calledFromSidebarFilters = false;
        event.preventDefault();
        const hrefUrl = btn.getAttribute("href");
        window.history.replaceState({}, "", hrefUrl);
        fetchProducts(hrefUrl);
      });
    });
  }


 
  
  
  class SidebarFilters extends HTMLElement {
  constructor() {
    super();
    this.desktopForm = document.getElementById("FacetFiltersFormDesktop");
    this.mobileForm = document.getElementById("FacetFiltersFormMobile");

    // Initialize form handlers
    this.initializeForm(this.desktopForm);
    this.initializeForm(this.mobileForm);

    // Clear all filters
    this.setupClearAllFilters();
  }

    
 initializeForm(form) {
  if (!form) return;
  form.querySelectorAll("input[type='checkbox']").forEach((input) => {
    const label = input.closest("label");

    input.addEventListener("change", (event) => {
      this.handleInputChange(input, event, form);      
    });

    if (label) {
      label.addEventListener("click", (event) => {
        event.preventDefault(); 
        if (input.disabled) return; // Ensure no action if input is disabled
        input.checked = !input.checked; // Toggle the checkbox state
        // Manually dispatch the 'change' event
        const changeEvent = new Event("change", {
          bubbles: true,
          cancelable: true,
        });
        input.dispatchEvent(changeEvent);
      });
    }

    // Add 'active' class to label if the input is pre-checked
    if (input.checked && label) {
      label.classList.add("active");
    }
  });

  // Handle pre-checked checkboxes without triggering an infinite loop
  form.querySelectorAll("input[type='checkbox']:checked").forEach((input) => {
    const filterOptions = input.closest("ul.filter-options");
    const filterLabel = input.closest('.filter-item').querySelector('h4.filter_item_label');

    if (filterOptions) {
      filterOptions.classList.add("show");
      filterOptions.classList.remove("collapse");
      filterOptions.setAttribute("aria-expanded", "true");
      if (filterLabel) {
        filterLabel.setAttribute("aria-expanded", "true");
        filterLabel.classList.add("open");
      }
    }
    this.toggleActiveClass(input);
  });
}

handleInputChange(input, event, form) {
  this.toggleActiveClass(input);
  
  const calledFromSidebarFilters = determineSidebarSource(event);
  const filterOptions = input.closest("ul.filter-options");
  const filterLabel = input.closest('.filter-item').querySelector('h4.filter_item_label');

  if (filterOptions) {
    if (input.checked) {
     // filterOptions.parentElement.classList.add("show");
      filterOptions.classList.remove("collapse");
      filterOptions.setAttribute("aria-expanded", "true");
      if (filterLabel) {
        filterLabel.setAttribute("aria-expanded", "true");
        filterLabel.classList.add("open");
      }
    } else {
    //  filterOptions.parentElement.classList.remove("show");
      filterOptions.classList.add("collapse");
      filterOptions.setAttribute("aria-expanded", "false");
      if (filterLabel) {
        filterLabel.setAttribute("aria-expanded", "false");
        filterLabel.classList.remove("open");
      }
    }
  }

   // Get current URL parameters
  const currentParams = new URLSearchParams(window.location.search);
  const formParams = new URLSearchParams(new FormData(form));

  // Preserve 'sort_by' if it exists in current URL
  if (currentParams.has("sort_by")) {
    formParams.set("sort_by", currentParams.get("sort_by"));
  }

  // Preserve unique filters
  const uniqueParams = new URLSearchParams();
  formParams.forEach((value, key) => {
    if (!uniqueParams.has(key) || !key.includes("filter.v.price")) {
      uniqueParams.append(key, value);
    }
  });  
 
  const url = `${window.location.pathname}?${uniqueParams.toString()}`;
  window.history.replaceState({}, "", url);
  fetchProducts();
}

toggleActiveClass(input) {
  const label = input.closest("label");
  if (!label) {
    return;
  }
  if (input.checked) {
    label.classList.add("active");
  } else {
    label.classList.remove("active");
  }
}


setupClearAllFilters() {
document.querySelectorAll(".clear-all-filters").forEach((clearBtn) => {
const params = new URLSearchParams(window.location.search);

// Check if any filters exist in URL
let hasFilters = false;
for (const key of params.keys()) {
  if (key.includes("filter.")) {
    hasFilters = true;
    break;
  }
}

// Show or hide the "Clear All Filters" button based on filters
if (hasFilters) {
  clearBtn.removeAttribute("hidden");
} else {
  clearBtn.setAttribute("hidden", "true");
}

clearBtn.addEventListener("click", () => {
         calledFromSidebarFilters = false;
 
  let dataPath = clearBtn.getAttribute("data-path") || "";      
  let url = window.location.pathname + dataPath;
   window.history.replaceState({}, "", url);

  // Uncheck all filters in both desktop & mobile forms
  ["FacetFiltersFormDesktop", "FacetFiltersFormMobile"].forEach((formId) => {
    const form = document.getElementById(formId);
    if (form) {
      form.querySelectorAll("input[type='checkbox']").forEach((input) => {
        input.checked = false;
        this.toggleActiveClass(input);
      });
    }
  });

  
  fetchProducts();
});
});
}



}

customElements.define("product-filters", SidebarFilters);

class productSorting extends HTMLElement {
  constructor() {
    super();
    this.menuItems = this.querySelectorAll('[role="menuitem"]');
    calledFromSidebarFilters = true; 
    this.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
         calledFromSidebarFilters = determineSidebarSource(event);
        this.updateURL(input.value);
       fetchProducts();
      });
    });

    // Add keyboard event listeners to menu items
    this.menuItems.forEach((menuItem) => {
      menuItem.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault(); // Prevent default action
           calledFromSidebarFilters = determineSidebarSource(event);
          this.handleItemInteraction(menuItem);
        }
      });

      menuItem.addEventListener("click", (event) => {
        calledFromSidebarFilters = determineSidebarSource(event);
        this.handleItemInteraction(menuItem);
      });
    });
  }

  handleItemInteraction(menuItem) {
    const input = menuItem.querySelector("input");
    if (input) {
      input.checked = true; 
      input.dispatchEvent(new Event("change")); 
    }
  }

  updateURL(value) {
    const params = new URLSearchParams(window.location.search);
    params.set("sort_by", value);
    params.delete("page"); 
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", url);
  }
  }

customElements.define("product-sorting", productSorting);


  



  class productPagination extends HTMLElement {
    constructor() {
      super();

      this.querySelectorAll(".page-link").forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
          event.preventDefault();
          calledFromSidebarFilters = false; // Set flag
          this.updateURL(anchor.dataset.linkTarget);
          fetchProducts();
           const drawerLayout = document.querySelector(".filter_layout-drawer");      
          const filtersOffcanvas = drawerLayout?.closest(".filtersOffcanvas");
      
       if (filtersOffcanvas) {
          const offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(filtersOffcanvas);
          offcanvasInstance.hide();
        }
        });
      });
    }

    updateURL(value) {
      const params = new URLSearchParams(window.location.search);
      params.set("page", value);
      const url = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", url);
    }
  }
  customElements.define("product-pagination", productPagination);

  
class PriceRange extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.minRangeInput = this.querySelector("input[data='min-price']");
    this.maxRangeInput = this.querySelector("input[data='max-price']");
    this.minNumberInput = this.querySelector(".field__input_min");
    this.maxNumberInput = this.querySelector(".field__input_max");
    this.applyButton = this.querySelector(".apply-price-filter");

    if (!this.minRangeInput || !this.maxRangeInput) return;

    // IMPORTANT: Prefer the values rendered by Liquid first, 
    // then check the URL as a backup.
    this.setValues();
    this.attachEventListeners();
  }

  setValues() {
    const params = new URLSearchParams(window.location.search);
    
    // Get the dynamic names from the inputs themselves
    const minParamName = this.minNumberInput.getAttribute('name') || "filter.v.price.gte";
    const maxParamName = this.maxNumberInput.getAttribute('name') || "filter.v.price.lte";

    const gte = params.get(minParamName);
    const lte = params.get(maxParamName);

    // If URL has values, prioritize them. 
    // Otherwise, the sliders will naturally use the 'value' attribute we set in Liquid.
    if (gte !== null) {
      this.minRangeInput.value = gte;
      this.minNumberInput.value = gte;
    }
    if (lte !== null) {
      this.maxRangeInput.value = lte;
      this.maxNumberInput.value = lte;
    }
  }

  attachEventListeners() {
    const updateValues = (type) => {
      if (type === 'range') {
        this.minNumberInput.value = this.minRangeInput.value;
        this.maxNumberInput.value = this.maxRangeInput.value;
      } else {
        // Prevent min from exceeding max when typing numbers
        if (parseFloat(this.minNumberInput.value) > parseFloat(this.maxNumberInput.value)) {
           this.minNumberInput.value = this.maxNumberInput.value;
        }
        this.minRangeInput.value = this.minNumberInput.value;
        this.maxRangeInput.value = this.maxNumberInput.value;
      }
    };

    // Range Sliders - Live update the numbers as you slide
    this.minRangeInput.addEventListener("input", () => updateValues('range'));
    this.maxRangeInput.addEventListener("input", () => updateValues('range'));

    // Trigger filter ONLY when user lets go of the slider
    this.minRangeInput.addEventListener("change", () => this.applyPriceFilter());
    this.maxRangeInput.addEventListener("change", () => this.applyPriceFilter());

    // Manual Apply Button
    if (this.applyButton) {
      this.applyButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.applyPriceFilter();
      });
    }

    // Number Input Changes
    [this.minNumberInput, this.maxNumberInput].forEach(input => {
      input.addEventListener("change", () => {
        updateValues('number');
        this.applyPriceFilter();
      });
      
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.applyPriceFilter();
        }
      });
    });
  }

  applyPriceFilter() {
    const minParamName = this.minNumberInput.getAttribute('name') || "filter.v.price.gte";
    const maxParamName = this.maxNumberInput.getAttribute('name') || "filter.v.price.lte";
    
    const minVal = this.minNumberInput.value;
    const maxVal = this.maxNumberInput.value;

    const params = new URLSearchParams(window.location.search);
    
    // Set or Clear parameters
    if (minVal !== "" && minVal !== "0") {
      params.set(minParamName, minVal);
    } else {
      params.delete(minParamName);
    }

    if (maxVal !== "" && maxVal !== this.maxRangeInput.getAttribute('max')) {
      params.set(maxParamName, maxVal);
    } else {
      params.delete(maxParamName);
    }
    
    params.delete("page");

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    
    // Update URL without refreshing the whole page
    window.history.replaceState({ path: newUrl }, "", newUrl);

    // Call your global AJAX function
    if (typeof fetchProducts === "function") {
      fetchProducts(newUrl); 
    } else {
      // Fallback if AJAX is broken
      window.location.href = newUrl;
    }
  }
}

if (!customElements.get("price-range")) {
  customElements.define("price-range", PriceRange);
}

  
  setupFilterRemoval();
  customSortSelect();
 // initQuickModal();
  if (paginationType) {
    if (endlessScroll && typeof endlessScroll.destroy === "function") {
      endlessScroll.destroy();
    }
    initEndlessScroll();
  }
});



function customSortSelect() {
  const customList = document.querySelector(".wdt-custom-sorting");
  if (!customList) return;
  const listItems = customList.querySelectorAll("li");
  const button = document.querySelector(".custom-select-buttons");

  function updateButtonText(text) {
    button.textContent = text;
  }

  listItems.forEach((item) => {
    item.addEventListener("click", function () {
      const selectedText = this.textContent.trim();
      updateButtonText(selectedText);
    });
  });
}

if (document.querySelector("#AjaxinatePagination")) {
  function initEndlessScroll() {
    let AjaxMethod = document.querySelector(".pagination-method-loadmore")
      ? "click"
      : "scroll";
    endlessScroll = new Ajaxinate({
      container: "#AjaxinateContainer",
      pagination: "#AjaxinatePagination",
      method: AjaxMethod,
      offset: 0,
      callback: initQuickModal,
    });
  }
}



if (!customElements.get('show-more-button')) {
  customElements.define(
    'show-more-button',
    class ShowMoreButton extends HTMLElement {
      constructor() {
        super();
        const button = this.querySelector('button');
        button.addEventListener('click', (event) => {
          this.expandShowMore(event);
          const nextElementToFocus = event.target.closest('.filter-panel').querySelector('.show-more-item');
          if (nextElementToFocus && !nextElementToFocus.classList.contains('hidden') && nextElementToFocus.querySelector('input')) {
            nextElementToFocus.querySelector('input').focus();
          }
        });
      }
      expandShowMore(event) {
        const parentDisplay = event.target.closest('[id^="Show-More-"]').closest('.filter-panel');        
        const parentWrap = parentDisplay.querySelector('.facets-wrap');        
        this.querySelectorAll('.label-text').forEach((element) => element.classList.toggle('hidden'));
        parentDisplay.querySelectorAll('.show-more-item').forEach((item) => item.classList.toggle('hidden'));
        if (!this.querySelector('.label-show-less')) {
          this.classList.add('hidden');
        }
      }
    }
  );
}



document.addEventListener('DOMContentLoaded', function() {
  // Select all offcanvas elements
  const offcanvasElements = document.querySelectorAll('.offcanvas');
  
  // Add event listeners to each offcanvas
  offcanvasElements.forEach(function(offcanvas) {
    // When offcanvas opens
    offcanvas.addEventListener('show.bs.offcanvas', function() {
      document.body.classList.add('wdt-offcanvas-open');
    });
    
    // When offcanvas closes
    offcanvas.addEventListener('hide.bs.offcanvas', function() {
      document.body.classList.remove('wdt-offcanvas-open');
    });
  });
  
  // Optional: Handle ESC key press to close offcanvas
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.body.classList.contains('offcanvas-open')) {
      const openOffcanvas = document.querySelector('.offcanvas.show');
      if (openOffcanvas) {
        bootstrap.Offcanvas.getInstance(openOffcanvas).hide();
      }
    }
  });
});






document.addEventListener('DOMContentLoaded', function() {
const gridLayoutContainer = document.querySelector('.grid-layout');
if (!gridLayoutContainer) return;

const buttons = gridLayoutContainer.querySelectorAll('button');
const twoColumnBtn = gridLayoutContainer.querySelector('.two_column');
const fourColumnBtn = gridLayoutContainer.querySelector('.four_column');
function handleButtonVisibility(activeButton) {
const isOneColumnActive = activeButton.classList.contains('one_column');

if (twoColumnBtn) {
twoColumnBtn.style.cssText = isOneColumnActive ? 'display: none !important' : '';
}

if (fourColumnBtn) {
fourColumnBtn.style.cssText = isOneColumnActive ? 'display: none !important' : '';
}
}
buttons.forEach(button => {
button.addEventListener('click', function() {
buttons.forEach(btn => btn.classList.remove('active'));
this.classList.add('active');
handleButtonVisibility(this);
});
});
const activeButton = gridLayoutContainer.querySelector('button.active');
if (activeButton) {
handleButtonVisibility(activeButton);
}
});

function toggleClearAllButton() {
  const clearBtn = document.getElementById("clear-all-filters");
  const selectedFiltersContainer = document.getElementById("selected-filters");

  if (!clearBtn || !selectedFiltersContainer) return;

  const hasSelectedFilters =
    selectedFiltersContainer.querySelectorAll(".selected-filters").length > 0;

  if (hasSelectedFilters) {
    clearBtn.style.display = "inline-flex";
  } else {
    clearBtn.style.display = "none";
  }
}