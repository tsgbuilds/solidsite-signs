import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { createApp } from '../server.mjs';
import { getCatalog, quoteUrl, renderCatalog } from '../lib/catalog.mjs';

async function fixture(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'solidsite-signs-catalog-'));
  const { server } = createApp({ dataDir, siteUrl: 'https://solidsitesigns.com' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${server.address().port}`;
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

test('catalog exposes the complete sourced product selection without exposing supplier provenance', async t => {
  const base = await fixture(t);
  const response = await fetch(`${base}/catalog/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const catalog = getCatalog();
  assert.ok(catalog.count > 20, 'The completed catalog covers the broader supplier selection');
  assert.equal((html.match(/data-product data-search=/g) || []).length, catalog.count);
  assert.equal((html.match(/data-product-image /g) || []).length, catalog.count);
  for (const category of catalog.categories) {
    assert.ok(html.includes(`id="category-${category.id}"`));
    for (const item of category.items) {
      assert.ok(html.includes(`<h3>${escapeHtml(item.name)}</h3>`), item.name);
      const imagePath = `/assets/products/${item.id}.webp`;
      const card = html.match(new RegExp(`<article class="catalog-product" id="product-${item.id}"[^]*?</article>`))[0];
      assert.ok(card.includes(`href="${imagePath}" data-product-image`), `${item.name} has a direct image link without JavaScript`);
      assert.ok(card.includes(`<img src="${imagePath}" width="640" height="480" loading="lazy" decoding="async"`), `${item.name} has a lazy product image with reserved space`);
      assert.ok(card.includes(`alt="${escapeHtml(item.name)} — ${escapeHtml(item.imageLabel.toLowerCase())}"`), `${item.name} has a specific image description`);
      const link = new URL(quoteUrl(item), 'https://solidsitesigns.com');
      assert.equal(link.origin, 'https://solidsitesigns.com');
      assert.equal(link.pathname, '/');
      assert.equal(link.hash, '#quote');
      assert.equal(link.searchParams.get('service'), item.service);
      assert.equal(link.searchParams.get('product'), item.name);
      assert.equal(Object.hasOwn(item, 'sources'), false);
    }
  }
  assert.doesNotMatch(html, /<!-- CATALOG_PRODUCTS -->|signs365\.com|b2sign\.com|railway-verify|Starting at \$/i);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1])['@graph'];
  const collection = graph.find(item => item['@type'] === 'CollectionPage');
  const list = graph.find(item => item['@type'] === 'ItemList');
  assert.equal(collection.mainEntity['@id'], list['@id']);
  assert.equal(list.numberOfItems, catalog.count);
  assert.equal(list.itemListElement.length, catalog.count);
  assert.ok(list.itemListElement.every(item => item.url.startsWith('https://solidsitesigns.com/catalog/#product-')));
  assert.match(html, /<dialog[^>]+aria-labelledby="catalog-image-title" aria-describedby="catalog-image-note"/);
  assert.match(html, /<form method="dialog"><button[^>]+aria-label="Close product image"/);
  assert.match(html, /Product examples\. Your artwork, size, finish and included hardware are confirmed with your quote\./);
});

test('every catalog product image is served as a complete WebP asset', async t => {
  const base = await fixture(t);
  const items = getCatalog().categories.flatMap(category => category.items);
  const results = await Promise.all(items.map(async item => {
    const path = `/assets/products/${item.id}.webp`;
    const response = await fetch(base + path);
    if (response.status !== 200) return `${path}: HTTP ${response.status}${response.status === 404 ? ' (missing product image)' : ''}`;
    if (response.headers.get('content-type') !== 'image/webp') return `${path}: incorrect content-type ${response.headers.get('content-type')}`;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') return `${path}: invalid RIFF/WEBP signature`;
    if (bytes.readUInt32LE(4) + 8 !== bytes.length) return `${path}: incomplete or malformed RIFF container`;
    if (!['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16))) return `${path}: invalid WebP image chunk`;
    return null;
  }));
  assert.deepEqual(results.filter(Boolean), [], `All ${items.length} product images must be available and valid`);
});

test('catalog illustrations are served while internal catalog and image sources stay private', async t => {
  const base = await fixture(t);
  for (const category of getCatalog().categories) {
    const illustration = await fetch(`${base}/assets/catalog/${category.id}.svg`);
    assert.equal(illustration.status, 200, category.id);
    assert.match(illustration.headers.get('content-type'), /image\/svg\+xml/);
  }
  for (const path of ['/data/catalog.json', '/catalog.json', '/lib/catalog.mjs', '/data/quotes.sqlite', '/docs/catalog-image-sources.json', '/catalog-image-sources.json']) {
    const privateSource = await fetch(base + path);
    assert.equal(privateSource.status, 404, path);
    assert.equal(privateSource.headers.get('x-robots-tag'), 'noindex');
  }
});

test('catalog PDF download URL is versioned from the bytes served to customers', async t => {
  const base = await fixture(t);
  const page = await fetch(`${base}/catalog/`);
  assert.equal(page.status, 200);
  const html = await page.text();
  const link = html.match(/href="(\/downloads\/solidsite-signs-catalog\.pdf\?v=([a-f0-9]{16}))"/);
  assert.ok(link, 'The catalog includes a content-versioned PDF download link');
  assert.doesNotMatch(html, /href="\/downloads\/solidsite-signs-catalog\.pdf"/);
  const pdf = await fetch(base + link[1]);
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get('content-type'), 'application/pdf');
  assert.equal(pdf.headers.get('x-robots-tag'), 'noindex');
  const bytes = Buffer.from(await pdf.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  assert.ok(bytes.length > 1000);
  assert.equal(link[2], createHash('sha256').update(bytes).digest('hex').slice(0, 16), 'The download version matches the actual PDF response');
});

test('catalog content is escaped and quote destinations remain local even with hostile text', () => {
  const item = { id: 'escape-test', name: '\"><script>alert(1)</script>', description: '<img src=x onerror=alert(1)>', options: 'a & b', service: 'Graphics', sources: ['https://supplier.example/private'], imageLabel: '<img src=x onerror=alert(1)>', imageUrl: 'https://supplier.example/private.webp' };
  const html = renderCatalog({ count: 1, categories: [{ id: 'test', title: 'A < B', intro: 'An "example"', items: [item] }] });
  assert.doesNotMatch(html, /<script>|<img src=x|supplier\.example/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /a &amp; b/);
  assert.match(html, /href="\/assets\/products\/escape-test.webp" data-product-image/);
  assert.match(html, /data-product-name="&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;"/);
  assert.match(html, /data-image-label="Product example"/);
  assert.match(html, /alt="&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt; — product example"/);
  const link = new URL(quoteUrl(item), 'https://solidsitesigns.com');
  assert.equal(link.origin, 'https://solidsitesigns.com');
  assert.equal(link.searchParams.get('product'), item.name);
});

test('product image labels use the public whitelist and asset routes reject invalid IDs', () => {
  const item = { id: 'test-banner', name: 'Banner', description: 'A banner.', options: '', service: 'Banners' };
  const render = candidate => renderCatalog({ count: 1, categories: [{ id: 'test', title: 'Test', intro: 'Test.', items: [candidate] }] });
  for (const imageLabel of ['Product example', 'Related product example', 'Illustrative mockup', 'AI-generated example']) {
    const html = render({ ...item, imageLabel });
    assert.ok(html.includes(`<figcaption>${imageLabel}</figcaption>`));
    assert.ok(html.includes(`alt="Banner — ${imageLabel.toLowerCase()}"`));
  }
  assert.match(render({ ...item, imageLabel: 'unreviewed supplier text' }), /<figcaption>Product example<\/figcaption>/);
  assert.throws(() => render({ ...item, id: '../private' }), /Invalid catalog product image/);
});

async function imageViewerFixture({ supported = true } = {}) {
  const handlers = new Map();
  const dialog = {
    open: false,
    addEventListener(type, listener) { handlers.set(type, listener); },
    getBoundingClientRect() { return { left: 100, right: 900, top: 100, bottom: 700 }; },
    close() { this.open = false; handlers.get('close')(); }
  };
  if (supported) dialog.showModal = () => { dialog.open = true; };
  const image = { alt: 'Banner — illustrative mockup' };
  const preview = { removeAttribute(name) { delete this[name]; } };
  const title = {};
  const label = {};
  const attributes = new Map([['href', '/assets/products/test-banner.webp']]);
  const linkHandlers = new Map();
  const link = {
    dataset: { productName: '<b>A custom banner</b>', imageLabel: 'Illustrative mockup' },
    addEventListener(type, listener) { linkHandlers.set(type, listener); },
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name); },
    querySelector() { return image; },
    focus() { this.focused = true; }
  };
  const classes = new Set();
  const nodes = new Map([['#catalog-image-dialog', dialog], ['#catalog-image-preview', preview], ['#catalog-image-title', title], ['#catalog-image-label', label]]);
  const document = {
    body: { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } },
    querySelector: selector => nodes.get(selector) || null,
    querySelectorAll: selector => selector === '[data-product-image]' ? [link] : []
  };
  const script = await readFile(new URL('../public/catalog.js', import.meta.url), 'utf8');
  runInNewContext(script, { document });
  const click = (overrides = {}) => {
    const event = { button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...overrides };
    linkHandlers.get('click')?.(event);
    return event;
  };
  return { dialog, image, preview, title, label, link, attributes, classes, handlers, click };
}

test('image viewer opens safely, preserves new-tab gestures, closes on the backdrop and returns focus', async () => {
  const viewer = await imageViewerFixture();
  for (const gesture of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    assert.equal(viewer.click(gesture).defaultPrevented, false);
    assert.equal(viewer.dialog.open, false);
  }
  assert.equal(viewer.attributes.get('aria-haspopup'), 'dialog');
  assert.equal(viewer.click().defaultPrevented, true);
  assert.equal(viewer.dialog.open, true);
  assert.equal(viewer.title.textContent, '<b>A custom banner</b>');
  assert.equal(viewer.title.innerHTML, undefined, 'Product names are inserted as text');
  assert.equal(viewer.preview.src, '/assets/products/test-banner.webp');
  assert.equal(viewer.preview.alt, viewer.image.alt);
  assert.equal(viewer.label.textContent, 'Illustrative mockup');
  assert.equal(viewer.classes.has('catalog-viewer-open'), true);
  const inside = { target: viewer.dialog, clientX: 200, clientY: 200 };
  viewer.handlers.get('pointerdown')(inside);
  viewer.handlers.get('click')(inside);
  assert.equal(viewer.dialog.open, true, 'Dialog padding is not a backdrop click');
  const outside = { target: viewer.dialog, clientX: 10, clientY: 10 };
  viewer.handlers.get('pointerdown')(outside);
  viewer.handlers.get('click')(outside);
  assert.equal(viewer.dialog.open, false);
  assert.equal(viewer.classes.has('catalog-viewer-open'), false);
  assert.equal(viewer.link.focused, true);
  assert.equal(viewer.preview.src, undefined);
  viewer.click();
  viewer.link.focused = false;
  viewer.dialog.close(); // Native Escape and the close form both dispatch this close event.
  assert.equal(viewer.link.focused, true);
  assert.equal(viewer.classes.has('catalog-viewer-open'), false);
});

test('image links retain their normal navigation when native dialog is unavailable', async () => {
  const viewer = await imageViewerFixture({ supported: false });
  assert.equal(viewer.attributes.get('href'), '/assets/products/test-banner.webp');
  assert.equal(viewer.attributes.has('aria-haspopup'), false);
  assert.equal(viewer.click().defaultPrevented, false);
  assert.equal(viewer.dialog.open, false);
});
