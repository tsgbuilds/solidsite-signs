import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { createApp } from '../server.mjs';

const origin = 'https://signs.example.com';
const marketingPaths = [
  '/', '/banners-houston/', '/window-graphics-houston/', '/sign-installation-houston/',
  '/dealership-signage/', '/sign-project-checklist/', '/catalog/'
];

async function fixture(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'solidsite-signs-seo-'));
  const { server } = createApp({ dataDir, siteUrl: origin });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test('marketing pages return distinct server-rendered metadata, safe linked schema and matching CSP', async t => {
  const base = await fixture(t);
  const titles = new Set();
  const descriptions = new Set();
  for (const path of [...marketingPaths, '/privacy.html']) {
    const response = await fetch(`${base}${path}?utm_source=test&service=Banners`, {
      headers: { 'x-forwarded-host': 'untrusted.example' }
    });
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.doesNotMatch(html, /<!-- SEO_HEAD -->/);
    const title = [...html.matchAll(/<title>([^<]+)<\/title>/g)];
    const description = [...html.matchAll(/<meta name="description" content="([^"]+)">/g)];
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)];
    assert.equal(title.length, 1, `${path} has one title`);
    assert.equal(description.length, 1, `${path} has one description`);
    assert.equal(canonicals.length, 1, `${path} has one canonical`);
    assert.ok(title[0][1].includes('SolidSite Signs'));
    assert.ok(description[0][1].length > 50);
    assert.equal(canonicals[0][1], origin + path);
    titles.add(title[0][1]);
    descriptions.add(description[0][1]);
    assert.ok(html.includes(`<meta property="og:url" content="${origin}${path}">`));
    assert.ok(html.includes(`<meta property="og:image" content="${origin}/assets/storefront.webp">`));
    assert.ok(html.includes(`<meta name="twitter:image" content="${origin}/assets/storefront.webp">`));
    assert.doesNotMatch(html, /utm_source=test|untrusted\.example/);

    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/g)];
    assert.equal(scripts.length, 1, `${path} has one graph`);
    const jsonLd = scripts[0][1];
    const schema = JSON.parse(jsonLd);
    assert.equal(schema['@context'], 'https://schema.org');
    const graph = schema['@graph'];
    const organization = graph.find(item => item['@type'] === 'Organization');
    const website = graph.find(item => item['@type'] === 'WebSite');
    const webpage = graph.find(item => ['WebPage', 'CollectionPage'].includes(item['@type']));
    assert.equal(organization.telephone, '+17139122151');
    assert.equal(organization.email, 'erik@gosolidsite.com');
    assert.equal(website.publisher['@id'], organization['@id']);
    assert.equal(webpage.isPartOf['@id'], website['@id']);
    assert.equal(webpage.url, origin + path);
    assert.doesNotMatch(jsonLd, /LocalBusiness|aggregateRating|reviewCount|streetAddress|openingHours|priceRange/);
    if (path !== '/') {
      const breadcrumb = graph.find(item => item['@type'] === 'BreadcrumbList');
      assert.equal(breadcrumb.itemListElement[0].item, `${origin}/`);
      assert.equal(breadcrumb.itemListElement[1].item, origin + path);
    }
    const service = graph.find(item => item['@type'] === 'Service');
    if (['/banners-houston/', '/window-graphics-houston/', '/sign-installation-houston/', '/dealership-signage/'].includes(path)) {
      assert.equal(service.provider['@id'], organization['@id']);
      assert.equal(service.url, origin + path);
    } else assert.equal(service, undefined);
    const csp = response.headers.get('content-security-policy');
    assert.ok(csp.includes(`'sha256-${createHash('sha256').update(jsonLd).digest('base64')}'`));
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
    assert.match(csp, /frame-ancestors 'none'/);
  }
  assert.equal(titles.size, marketingPaths.length + 1, 'Titles are unique across public pages');
  assert.equal(descriptions.size, marketingPaths.length + 1, 'Descriptions are unique across public pages');
});

test('sitemap includes only canonical marketing URLs and robots points to it', async t => {
  const base = await fixture(t);
  const response = await fetch(`${base}/sitemap.xml`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/xml/);
  const sitemap = await response.text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls.sort(), marketingPaths.map(path => origin + path).sort());
  assert.doesNotMatch(sitemap, /\.html|\/api\/|\/healthz|utm_/);
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  assert.match(robots, /^User-agent: \*/);
  assert.match(robots, /Disallow: \/api\//);
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
});

test('page aliases permanently redirect to internal canonical routes with query strings preserved', async t => {
  const base = await fixture(t);
  const aliases = [
    ['/index.html', '/'],
    ...marketingPaths.filter(path => path !== '/').flatMap(path => [
      [path.slice(0, -1), path], [path.slice(0, -1) + '.html', path]
    ])
  ];
  for (const [alias, canonical] of aliases) {
    const query = '?service=Banners&next=https%3A%2F%2Funtrusted.example%2F';
    const response = await fetch(base + alias + query, { redirect: 'manual' });
    assert.equal(response.status, 308, alias);
    assert.equal(response.headers.get('location'), canonical + query, alias);
    assert.ok(response.headers.get('location').startsWith('/'));
    assert.ok(!response.headers.get('location').startsWith('//'));
  }
});

test('unknown and private routes retain real noindex errors; health and API are not indexable', async t => {
  const base = await fixture(t);
  for (const path of ['/nonexistent/', '/nonexistent.html', '/banners-houston/secrets.html', '/lib/seo.mjs', '/data/quotes.sqlite', '/.env', '/%2f%2funtrusted.example', '/assets/%2e%2e%2f%2e%2e%2f.env']) {
    const response = await fetch(base + path, { redirect: 'manual' });
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex', path);
    assert.equal(response.headers.get('location'), null, path);
  }
  const malformed = await fetch(`${base}/%E0%A4%A`);
  assert.equal(malformed.status, 400);
  assert.equal(malformed.headers.get('x-robots-tag'), 'noindex');
  const health = await fetch(`${base}/healthz`);
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('x-robots-tag'), 'noindex');
  assert.deepEqual(await health.json(), { ok: true });
  const leads = await fetch(`${base}/api/admin/leads`);
  assert.equal(leads.status, 401);
  assert.equal(leads.headers.get('x-robots-tag'), 'noindex');
});

test('HEAD supports canonical pages, crawl files and health without response bodies', async t => {
  const base = await fixture(t);
  for (const path of [...marketingPaths, '/privacy.html', '/robots.txt', '/sitemap.xml', '/healthz']) {
    const response = await fetch(base + path, { method: 'HEAD' });
    assert.equal(response.status, 200, path);
    assert.equal(await response.text(), '', path);
  }
  const alias = await fetch(`${base}/banners-houston`, { method: 'HEAD', redirect: 'manual' });
  assert.equal(alias.status, 308);
  assert.equal(alias.headers.get('location'), '/banners-houston/');
});

test('HTML uses content-versioned scripts and styles so returning visitors get current assets', async t => {
  const base = await fixture(t);
  for (const path of ['/', '/catalog/', '/not-a-page/']) {
    const html = await (await fetch(base + path)).text();
    assert.doesNotMatch(html, /(?:src|href)="\/(?:app\.js|styles\.css|catalog\.js|catalog\.css)"/);
    const assets = [...html.matchAll(/(?:src|href)="(\/(?:app\.js|styles\.css|catalog\.js|catalog\.css)\?v=([a-f0-9]{16}))"/g)];
    assert.ok(assets.length, path);
    for (const [, url, version] of assets) {
      const response = await fetch(base + url);
      assert.equal(response.status, 200, url);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(createHash('sha256').update(bytes).digest('hex').slice(0, 16), version);
    }
  }
});
