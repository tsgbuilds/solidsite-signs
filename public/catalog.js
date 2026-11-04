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

const imageDialog = document.querySelector('#catalog-image-dialog');
if (imageDialog && typeof imageDialog.showModal === 'function') {
  const preview = document.querySelector('#catalog-image-preview');
  const title = document.querySelector('#catalog-image-title');
  const label = document.querySelector('#catalog-image-label');
  let lastImageLink;
  let backdropPointerDown = false;
  const isBackdrop = event => {
    if (event.target !== imageDialog) return false;
    const bounds = imageDialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  for (const link of document.querySelectorAll('[data-product-image]')) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lastImageLink = link;
      title.textContent = link.dataset.productName;
      label.textContent = link.dataset.imageLabel;
      preview.alt = link.querySelector('img').alt;
      preview.src = link.getAttribute('href');
      imageDialog.showModal();
      document.body.classList.add('catalog-viewer-open');
    });
  }
  imageDialog.addEventListener('pointerdown', event => { backdropPointerDown = isBackdrop(event); });
  imageDialog.addEventListener('click', event => {
    if (backdropPointerDown && isBackdrop(event)) imageDialog.close();
    backdropPointerDown = false;
  });
  // Native dialog handles Escape and its close form, including focus trapping.
  imageDialog.addEventListener('close', () => {
    document.body.classList.remove('catalog-viewer-open');
    preview.removeAttribute('src');
    lastImageLink?.focus({ preventScroll: true });
  });
}
