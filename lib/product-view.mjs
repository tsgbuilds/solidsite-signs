import { escapeHtml, imageLabel, productPath, quoteUrl } from './catalog.mjs';
import { productGuides } from './product-guides.mjs';

const windowProducts = new Set(['window-perf', 'window-cling', 'clear-vinyl', 'frosted-vinyl', 'double-window']);

function planningLink(item, category) {
  if (category.id === 'banners') return ['/banners-houston/', 'Custom banner planning'];
  if (windowProducts.has(item.id)) return ['/window-graphics-houston/', 'Window graphics planning'];
  if (['rigid-signs', 'adhesive-graphics', 'wall-art', 'specialty-signs'].includes(category.id) || item.id === 'installation-service') {
    return ['/sign-installation-houston/', 'Planning a sign installation'];
  }
  if (item.id === 'artwork-review' || category.id === 'hardware') return ['/catalog/project-coordination/', 'Project coordination'];
  return ['/catalog/artwork-review/', 'Artwork review'];
}

function renderGuideText(value) {
  if (Array.isArray(value)) return `<ul>${value.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
  return `<p>${escapeHtml(value)}</p>`;
}

function renderRelated(item, category) {
  // Catalog order groups related formats. Continue from this item and wrap at the end.
  const index = category.items.findIndex(candidate => candidate.id === item.id);
  const siblings = [...category.items.slice(index + 1), ...category.items.slice(0, index)].slice(0, 3);
  if (!siblings.length) return '';
  const links = siblings.map(sibling => `<li><a href="${productPath(sibling)}">
    <img src="/assets/products/${sibling.id}.webp" alt="" width="160" height="120" loading="lazy" decoding="async">
    <span>${escapeHtml(sibling.name)}</span>
  </a></li>`).join('');
  return `<section class="product-related" aria-labelledby="related-title">
    <div class="product-related-heading"><h2 id="related-title">More in this category</h2><a class="text-link" href="/catalog/#category-${category.id}">Browse ${escapeHtml(category.title.toLowerCase())}</a></div>
    <ul class="product-related-list">${links}</ul>
  </section>`;
}

export function renderProductDetail(item, category) {
  const guide = productGuides[item.id];
  if (!guide?.selection || !guide.brief) throw new Error(`Missing product guidance for ${item.id}`);
  const name = escapeHtml(item.name);
  const label = escapeHtml(imageLabel(item));
  const request = escapeHtml(quoteUrl(item));
  const categoryTitle = escapeHtml(category.title);
  const [resourcePath, resourceName] = planningLink(item, category);
  const isService = category.id === 'services';

  return `<div class="wrap">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li><a href="/catalog/">Catalog</a></li>
      <li><a href="/catalog/#category-${category.id}">${categoryTitle}</a></li><li aria-current="page">${name}</li>
    </ol></nav>
    <section class="product-detail-hero" aria-labelledby="product-title">
      <div class="product-detail-intro"><p class="eyebrow product-market">Greater Houston, Texas</p><h1 id="product-title">${name}</h1><p>${escapeHtml(item.description)}</p></div>
      <figure class="product-detail-photo"><img src="/assets/products/${item.id}.webp" width="640" height="480" fetchpriority="high" alt="${name} — ${escapeHtml(imageLabel(item).toLowerCase())}"><figcaption>${label}</figcaption></figure>
      <div class="product-detail-choice">
        ${item.options ? `<section class="product-options" aria-labelledby="options-title"><h2 id="options-title">Options to discuss</h2><p>${escapeHtml(item.options)}</p></section>` : ''}
        <a class="button" href="${request}" aria-label="Request a quote for ${name}">Request a quote <span aria-hidden="true">↗</span></a>
        <p class="product-local">For help planning your project, call Erik at <a href="tel:+17139122151">(713) 912-2151</a>.</p>
      </div>
    </section>
    <div class="product-detail-guides">
      <section class="product-selection" aria-labelledby="selection-title">
        <h2 id="selection-title">${isService ? 'Planning this service' : 'Choosing this format'}</h2>${renderGuideText(guide.selection)}
        <nav class="product-planning-links" aria-label="Planning resources"><a href="${resourcePath}">${resourceName}</a><a href="/sign-project-checklist/">Sign project checklist</a></nav>
      </section>
      <section class="product-brief" aria-labelledby="brief-title">
        <h2 id="brief-title">What to include in your quote request</h2>${renderGuideText(guide.brief)}
        <a class="text-link" href="${request}">Start your quote</a>
      </section>
    </div>
    ${renderRelated(item, category)}
  </div>`;
}
