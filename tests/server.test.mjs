import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { createApp } from '../server.mjs';

const token = 'test-token-that-is-at-least-thirty-two-characters';
const sample = { name: 'Site test', business: 'Test only', email: 'test@example.com', phone: '(713) 555-0123', service: 'Banners', location: 'Houston', details: 'A test banner for a local integration check.', fulfillment: 'Local delivery', timing: 'Flexible / planning ahead', website: '' };

async function fixture(t, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'solidsite-signs-test-'));
  let app;
  async function start() {
    app = createApp({ dataDir: dir, adminToken: token, rateLimit: 100, ...options });
    app.server.listen(0, '127.0.0.1');
    await once(app.server, 'listening');
    return `http://127.0.0.1:${app.server.address().port}`;
  }
  async function stop() {
    if (app.server.listening) await new Promise(resolve => app.server.close(resolve));
  }
  const url = await start();
  t.after(async () => { await stop(); await rm(dir, { recursive: true, force: true }); });
  return { url, start, stop };
}
const post = (base, body = sample, extra = {}) => fetch(`${base}/api/quotes`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json', ...extra }, body: JSON.stringify(body) });
const leads = base => fetch(`${base}/api/admin/leads`, { headers: { authorization: `Bearer ${token}` } }).then(r => r.json());

test('complete request is persisted across restart and tagged to SolidSite', async t => {
  const f = await fixture(t);
  const response = await post(f.url);
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.match(saved.reference, /^SS-[A-F0-9]{12}$/);
  await f.stop();
  const reopened = await f.start();
  const data = await leads(reopened);
  assert.equal(data.leads.length, 1);
  assert.equal(data.leads[0].reference, saved.reference);
  assert.equal(data.leads[0].company, 'SolidSite');
  assert.equal(data.leads[0].source, 'solidsite-signs-website');
  assert.equal(data.leads[0].email, sample.email);
});

test('uncertain submission retries do not duplicate leads; changed reuse conflicts', async t => {
  const f = await fixture(t);
  const headers = { 'idempotency-key': randomUUID() };
  const a = await post(f.url, sample, headers);
  const b = await post(f.url, sample, headers);
  assert.equal(a.status, 201);
  assert.equal(b.status, 200);
  assert.equal((await a.json()).reference, (await b.json()).reference);
  const changed = await post(f.url, { ...sample, details: 'A different sign with a different scope.' }, headers);
  assert.equal(changed.status, 409);
  assert.equal((await leads(f.url)).leads.length, 1);
});

test('invalid, oversized and bot requests never create customer records', async t => {
  const f = await fixture(t);
  for (const edit of [{ email: 'bad' }, { name: '' }, { service: 'Unsupported' }, { details: 'short' }, { phone: 'wrong number' }, { website: 'spam.test' }, { fulfillment: 'Unknown' }, { details: ['invalid'] }]) {
    assert.equal((await post(f.url, { ...sample, ...edit })).status, 400);
  }
  assert.equal((await post(f.url, { ...sample, details: 'x'.repeat(17000) })).status, 413);
  const malformed = await fetch(`${f.url}/api/quotes`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{broken' });
  assert.equal(malformed.status, 400);
  assert.equal((await leads(f.url)).leads.length, 0);
});

test('cross-origin submissions blocked; legitimate browser submission accepted', async t => {
  const f = await fixture(t, { siteUrl: 'https://signs.example.com' });
  assert.equal((await post(f.url, sample, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(f.url, sample, { 'sec-fetch-site': 'cross-site' })).status, 403);
  assert.equal((await post(f.url, sample, { origin: 'https://signs.example.com' })).status, 201);
  assert.equal((await leads(f.url)).leads.length, 1);
});

test('rate limit rejects excess requests and does not trust arbitrary forwarded IPs', async t => {
  const f = await fixture(t, { rateLimit: 2 });
  assert.equal((await post(f.url)).status, 201);
  assert.equal((await post(f.url)).status, 201);
  const limited = await post(f.url, sample, { 'x-forwarded-for': '10.10.10.10' });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  assert.equal((await leads(f.url)).leads.length, 2);
});

test('private records require authentication and cannot be fetched as static files', async t => {
  const f = await fixture(t);
  await post(f.url);
  assert.equal((await fetch(`${f.url}/api/admin/leads`)).status, 401);
  assert.equal((await fetch(`${f.url}/api/admin/leads`, { headers: { authorization: 'Bearer wrong' } })).status, 401);
  for (const path of ['/data/quotes.sqlite', '/.env', '/.git/config', '/server.mjs', '/README.md', '/assets/%2e%2e/%2e%2e/.env', '/%00']) {
    assert.equal((await fetch(f.url + path)).status, 404, path);
  }
  assert.equal((await fetch(`${f.url}/api/quotes`)).status, 405);
});

test('no-JavaScript form receives an HTML confirmation without exposing submitted data', async t => {
  const f = await fixture(t);
  const response = await fetch(`${f.url}/api/quotes`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' }, body: new URLSearchParams(sample) });
  assert.equal(response.status, 201);
  const page = await response.text();
  assert.match(page, /Request received/);
  assert.match(page, /SS-[A-F0-9]{12}/);
  assert.ok(!page.includes(sample.email));
  assert.equal((await leads(f.url)).leads.length, 1);
});

test('homepage, contact identity, assets, privacy and canonical metadata are served', async t => {
  const f = await fixture(t, { siteUrl: 'https://signs.example.com' });
  const response = await fetch(f.url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const html = await response.text();
  assert.match(html, /tel:\+17139122151/);
  assert.match(html, /mailto:erik@gosolidsite.com/);
  assert.match(html, /canonical" href="https:\/\/signs.example.com\/"/);
  assert.ok(!/Lexus|30,000|15,000/.test(html));
  const assets = [...html.matchAll(/(?:src|href)="(\/(?:assets\/[^"#]+|styles.css|app.js|privacy.html))"/g)].map(m => m[1]);
  for (const path of new Set(assets)) assert.equal((await fetch(f.url + path)).status, 200, path);
  assert.match(await (await fetch(`${f.url}/sitemap.xml`)).text(), /https:\/\/signs.example.com/);
  assert.match(await (await fetch(`${f.url}/robots.txt`)).text(), /Disallow: \/api\//);
  assert.equal((await fetch(f.url, { method: 'HEAD' })).status, 200);
});
