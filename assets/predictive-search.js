class PredictiveSearch extends HTMLElement {
  constructor() {
    super();

    this.input = this.querySelector('input[type="search"]');
    this.predictiveSearchResults = this.querySelector('[data-predictive-search]');
    this.searchModal = this.closest('#searchBox'); 
    this.resetBtn =  this.querySelector('.reset__button');
    this.input.addEventListener('input', this.debounce(this.onInputChange.bind(this), 300)); 
    document.addEventListener('click', (e) => this.handleOutsideClick(e));
    if (this.resetBtn) {
    this.resetBtn.addEventListener('click', () => this.resetSearch());
    }
    this.input.addEventListener('input', (e) => {
  const result = this.querySelector('.predictive-search');
  if (!result) return;

  const hasValue = e.target.value.trim().length > 0;

  result.style.display = hasValue ? 'block' : 'none';
});
  }

 
  async onInputChange() {
    const searchTerm = this.input.value.trim();        
    if (!searchTerm.length) {
      this.close();
      return;
    }
    await this.getSearchResults(searchTerm); 
  }

  async getSearchResults(searchTerm) {
    try {
      const response = await fetch(
  `${window.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&resources[type]=product,page,collection,article&section_id=predictive-search`
);
      if (!response.ok) {
        this.close();
        throw new Error(response.status);        
      }

      // Parse the HTML response from the server
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const resultsMarkup = doc.querySelector('#predictive-search-results-groups-wrapper').innerHTML;

      this.predictiveSearchResults.innerHTML = resultsMarkup;          
         if (resultsMarkup.includes('No results found')) {
        this.searchModal.classList.remove('open');
        this.searchModal.classList.add('no-result');
           this.open();
      } else {
        this.searchModal.classList.add('open');
        this.searchModal.classList.remove('no-result');
        this.open();
      } 
    } catch (error) {
      this.close();
      console.error('Error fetching search results:', error);
    }
  }
 open() {
  if (this.searchModal) {
    this.searchModal.classList.add('open'); 
    this.resetBtn.classList.remove('hidden', 'd-none'); 
  }

  if (this.predictiveSearchResults) {
    this.predictiveSearchResults.style.display = 'block';
  }

  this.input.setAttribute('aria-expanded', 'true');     
}
 
  close() {
  if (document.activeElement === this.input) return;

  if (this.searchModal) {
    this.searchModal.classList.remove('open'); 
    this.resetBtn.classList.add('hidden', 'd-none'); 
  }


  if (this.predictiveSearchResults) {
    this.predictiveSearchResults.style.display = 'none';
  }

  this.input.setAttribute('aria-expanded', 'false');      
}
  resetSearch() {
     this.input.value = '';
     this.close(); 
     this.input.focus(); 
  }
  debounce(fn, wait) {
    let timeout;
    return (...args) => {
        this.input.classList.add("loading");
        clearTimeout(timeout);
        timeout = setTimeout(() => {
        this.input.classList.remove("loading");            
            fn.apply(this, args);
        }, wait);
    };
}


  handleOutsideClick(event) {
  const result = this.querySelector('.predictive-search');
  if (!this.contains(event.target)) {

    if (result) {
      const isHidden = window.getComputedStyle(result).display === 'none';
      if (isHidden) return;
      result.style.display = 'none';
    }
    this.close();
  }
}


}

customElements.define('predictive-search', PredictiveSearch);
