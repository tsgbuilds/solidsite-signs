import { readFileSync } from 'node:fs';
import { SERVICES } from './quotes.mjs';

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const imageLabels = new Set(['Product example', 'Related product example', 'Cards and mailers shown together', 'Illustrative mockup', 'AI-generated example']);
const imageLabel = item => imageLabels.has(item.imageLabel) ? item.imageLabel : 'Product example';
let savedCatalog;

// The source includes internal provenance. Only the explicitly selected public
// fields below are rendered; the JSON itself is never a public route.
export function getCatalog() {
  if (savedCatalog) return savedCatalog;
  const source = JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8'));
  const identifiers = new Set();
  const categories = source.categories.map(category => {
    if (!/^[a-z0-9-]+$/.test(category.id) || identifiers.has(category.id)) throw new Error('Invalid catalog category');
    identifiers.add(category.id);
    const items = category.items.map(item => {
      if (!/^[a-z0-9-]+$/.test(item.id) || identifiers.has(item.id)) throw new Error('Invalid catalog product');
      if (!SERVICES.includes(item.service)) throw new Error('Invalid catalog service');
      identifiers.add(item.id);
      return Object.freeze({ id: item.id, name: String(item.name), description: String(item.description), options: String(item.options || ''), service: item.service, imageLabel: imageLabel(item) });
    });
    return Object.freeze({ id: category.id, title: String(category.title), intro: String(category.intro), items: Object.freeze(items) });
  });
  savedCatalog = Object.freeze({ categories: Object.freeze(categories), count: categories.reduce((sum, category) => sum + category.items.length, 0) });
  return savedCatalog;
}

export function quoteUrl(item) {
  return `/?${new URLSearchParams({ service: item.service, product: item.name })}#quote`;
}

function renderProduct(item, category) {
  if (!/^[a-z0-9-]+$/.test(item.id)) throw new Error('Invalid catalog product image');
  const imageUrl = `/assets/products/${item.id}.webp`;
  const label = imageLabel(item);
  return `<article class="catalog-product" id="product-${item.id}" data-product data-search="${escapeHtml([category.title, item.name, item.description, item.options].join(' '))}">
    <figure class="catalog-product-figure"><a class="catalog-image" href="${imageUrl}" data-product-image data-product-name="${escapeHtml(item.name)}" data-image-label="${escapeHtml(label)}" aria-label="View larger example of ${escapeHtml(item.name)}"><img src="${imageUrl}" width="640" height="480" loading="lazy" decoding="async" alt="${escapeHtml(item.name)} — ${escapeHtml(label.toLowerCase())}"><span class="catalog-image-action" aria-hidden="true">View example <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4"/></svg></span></a><figcaption>${escapeHtml(label)}</figcaption></figure>
    <div class="catalog-product-copy"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p>${item.options ? `<p class="catalog-options"><span>Options to discuss</span>${escapeHtml(item.options)}</p>` : ''}</div>
    <a class="catalog-quote" href="${escapeHtml(quoteUrl(item))}" aria-label="Request a quote for ${escapeHtml(item.name)}">Request a quote<span aria-hidden="true">↗</span></a>
  </article>`;
}

export function renderCatalog(catalog) {
  const links = catalog.categories.map(category => `<a href="#category-${category.id}" data-category="${category.id}">${escapeHtml(category.title)}</a>`).join('');
  const sections = catalog.categories.map(category => `<section class="catalog-category" id="category-${category.id}" data-category-section="${category.id}" aria-labelledby="heading-${category.id}">
    <div class="catalog-category-intro"><h2 id="heading-${category.id}">${escapeHtml(category.title)}</h2><p>${escapeHtml(category.intro)}</p></div>
    <div class="catalog-product-list">${category.items.map(item => renderProduct(item, category)).join('')}</div>
  </section>`).join('');
  return `<nav class="catalog-categories" aria-label="Catalog categories"><a href="#catalog-products" data-category="all" aria-current="true">All products</a>${links}</nav>
  <div class="catalog-tools" hidden><div class="catalog-search"><label for="catalog-search">Find a product</label><input id="catalog-search" type="search" placeholder="Try window graphics, tents or yard signs" autocomplete="off" aria-describedby="catalog-count"></div><button type="button" class="catalog-reset">Clear filters</button></div>
  <p class="catalog-count" id="catalog-count" role="status" aria-live="polite" aria-atomic="true">${catalog.count} products and services</p>
  <div id="catalog-products" class="catalog-products">${sections}</div>
  <div class="catalog-empty" hidden><h2>No products found.</h2><p>Try a broader term or browse the complete catalog.</p><button type="button" class="button catalog-reset">Show all products</button></div>`;
}

export function catalogSchema(catalog, origin) {
  return {
    '@type': 'ItemList', '@id': `${origin}/catalog/#products`, name: 'SolidSite Signs product and service catalog',
    itemListOrder: 'https://schema.org/ItemListUnordered', numberOfItems: catalog.count,
    itemListElement: catalog.categories.flatMap(category => category.items).map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, url: `${origin}/catalog/#product-${item.id}`
    }))
  };
}
