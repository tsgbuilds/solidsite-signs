import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
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
  for (const category of catalog.categories) {
    assert.ok(html.includes(`id="category-${category.id}"`));
    for (const item of category.items) {
      assert.ok(html.includes(`<h3>${escapeHtml(item.name)}</h3>`), item.name);
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
});

test('catalog assets and downloadable PDF are served while internal source stays private', async t => {
  const base = await fixture(t);
  for (const category of getCatalog().categories) {
    const illustration = await fetch(`${base}/assets/catalog/${category.id}.svg`);
    assert.equal(illustration.status, 200, category.id);
    assert.match(illustration.headers.get('content-type'), /image\/svg\+xml/);
  }
  const pdf = await fetch(`${base}/downloads/solidsite-signs-catalog.pdf`);
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get('content-type'), 'application/pdf');
  assert.equal(pdf.headers.get('x-robots-tag'), 'noindex');
  const bytes = new Uint8Array(await pdf.arrayBuffer());
  assert.equal(Buffer.from(bytes.subarray(0, 5)).toString(), '%PDF-');
  assert.ok(bytes.length > 1000);
  for (const path of ['/data/catalog.json', '/catalog.json', '/lib/catalog.mjs', '/data/quotes.sqlite']) {
    const privateSource = await fetch(base + path);
    assert.equal(privateSource.status, 404, path);
    assert.equal(privateSource.headers.get('x-robots-tag'), 'noindex');
  }
});

test('catalog content is escaped and quote destinations remain local even with hostile text', () => {
  const item = { id: 'escape-test', name: '\"><script>alert(1)</script>', description: '<img src=x onerror=alert(1)>', options: 'a & b', service: 'Graphics', sources: ['https://supplier.example/private'] };
  const html = renderCatalog({ count: 1, categories: [{ id: 'test', title: 'A < B', intro: 'An "example"', items: [item] }] });
  assert.doesNotMatch(html, /<script>|<img src=x|supplier\.example/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /a &amp; b/);
  const link = new URL(quoteUrl(item), 'https://solidsitesigns.com');
  assert.equal(link.origin, 'https://solidsitesigns.com');
  assert.equal(link.searchParams.get('product'), item.name);
});
