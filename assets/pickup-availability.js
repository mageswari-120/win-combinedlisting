customElements.get("product-availability-check") ||
  customElements.define(
    "product-availability-check",
    class extends HTMLElement {
      constructor() {
        super();

        this.errorTemplate = this.querySelector("template")?.content.firstElementChild.cloneNode(true);
        this.handleClickRefresh = this.handleClickRefresh.bind(this);

        const variantFromURL = new URLSearchParams(window.location.search).get("variant");
        const productId = variantFromURL || this.dataset.productavailabilityId;

        if (this.hasAttribute("in-stock")) {
          this.retrieveAvailability(productId);
        }

       // console.log("Selected product ID === " + productId);
      }

      retrieveAvailability(productId) {
        if (!productId) return;

        let baseUrl = this.dataset.baseUrl;
        if (!baseUrl.endsWith("/")) baseUrl += "/";

        const queryURL = `${baseUrl}variants/${productId}/?section_id=pickup-availability`;
       // console.log("queryURL== " + queryURL);

        fetch(queryURL)
          .then((response) => response.text())
          .then((htmlResponse) => {
            const parser = new DOMParser();
            const parsedDocument = parser.parseFromString(htmlResponse, "text/html");
            const availabilitySection = parsedDocument.querySelector(".shopify-section");

            if (availabilitySection) {
              this.displayPreview(availabilitySection);
            } else {
              this.showError();
            }
          })
          .catch(() => {
            this.showError();
          });
      }

      handleClickRefresh() {
        const variantFromURL = new URLSearchParams(window.location.search).get("variant");
        const productId = variantFromURL || this.dataset.productavailabilityId;
        this.retrieveAvailability(productId);
      }

      refreshProduct(variant) {
        if (variant && variant.available) {
          this.retrieveAvailability(variant.id);
        } else {
          this.removeAttribute("in-stock");
          this.innerHTML = "";
        }
      }

      showError() {
        this.innerHTML = "";
      }

      displayPreview(e) {
        const offcanvas = document.querySelector("#pickupDrawer");
        const preview = e.querySelector("product-availability-preview");
        const details = e.querySelector("product-availability-details");

        if (offcanvas && details?.innerHTML) {
          offcanvas.innerHTML = details.innerHTML;
        } else if (details) {
          document.body.appendChild(details);
        }

        if (preview) {
          this.innerHTML = preview.outerHTML;
        }
      }
    }
  );