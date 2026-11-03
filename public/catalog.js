const catalogSearch = document.querySelector('#catalog-search');
const categoryLinks = [...document.querySelectorAll('[data-category]')];
const categorySections = [...document.querySelectorAll('[data-category-section]')];
const productRows = [...document.querySelectorAll('[data-product]')];
const count = document.querySelector('#catalog-count');
const empty = document.querySelector('.catalog-empty');
const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const searchable = new Map(productRows.map(row => [row, normalize(row.dataset.search)]));
let selectedCategory = 'all';

function applyFilters() {
  const words = normalize(catalogSearch.value.trim()).split(/\s+/).filter(Boolean);
  let visibleCount = 0;
  for (const section of categorySections) {
    const matchesCategory = selectedCategory === 'all' || section.dataset.categorySection === selectedCategory;
    let sectionCount = 0;
    for (const row of section.querySelectorAll('[data-product]')) {
      const matches = matchesCategory && words.every(word => searchable.get(row).includes(word));
      row.hidden = !matches;
      if (matches) sectionCount++;
    }
    section.hidden = sectionCount === 0;
    visibleCount += sectionCount;
  }
  for (const link of categoryLinks) {
    if (link.dataset.category === selectedCategory) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  count.textContent = `Showing ${visibleCount} of ${productRows.length} products and services`;
  empty.hidden = visibleCount > 0;
}

if (catalogSearch) {
  document.querySelector('.catalog-tools').hidden = false;
  catalogSearch.addEventListener('input', applyFilters);
  for (const link of categoryLinks) link.addEventListener('click', event => {
    event.preventDefault();
    selectedCategory = link.dataset.category;
    applyFilters();
  });
  document.querySelectorAll('.catalog-reset').forEach(button => button.addEventListener('click', () => {
    selectedCategory = 'all';
    catalogSearch.value = '';
    applyFilters();
    catalogSearch.focus({ preventScroll: true });
  }));
}
