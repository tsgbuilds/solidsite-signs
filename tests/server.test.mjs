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
  assert.match(html, /mailto:info@gosolidsite.com/);
  assert.match(html, /canonical" href="https:\/\/signs.example.com\/"/);
  assert.ok(!/Lexus|30,000|15,000/.test(html));
  const assets = [...html.matchAll(/(?:src|href)="(\/(?:assets\/[^"#]+|styles.css|app.js|privacy.html))"/g)].map(m => m[1]);
  for (const path of new Set(assets)) assert.equal((await fetch(f.url + path)).status, 200, path);
  assert.match(await (await fetch(`${f.url}/sitemap.xml`)).text(), /https:\/\/signs.example.com/);
  assert.match(await (await fetch(`${f.url}/robots.txt`)).text(), /Disallow: \/api\//);
  assert.equal((await fetch(f.url, { method: 'HEAD' })).status, 200);
});

test('banner landing preserves a tagged native form save without leaking arbitrary query fields', async t => {
  const f = await fixture(t);
  const response = await fetch(f.url + '/banners-houston/?utm_source=google&utm_medium=cpc&utm_campaign=banners-test&gclid=Demo-123&private=ignore-me&utm_content=joe%40example.com');
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  const landing = await response.text();
  assert.match(landing, /href="#banner-quote"/);
  const hidden = landing.match(/name="campaign_context" value="([^"]+)"/)[1].replaceAll('&quot;', '"');
  const campaign = {utm_source:'google',utm_medium:'cpc',utm_campaign:'banners-test',gclid:'Demo-123',landing_path:'/banners-houston/'};
  assert.deepEqual(JSON.parse(hidden), campaign);
  assert.doesNotMatch(landing, /ignore-me|joe@example/);
  const form = new URLSearchParams({...sample,campaign_context:hidden});
  const saved = await fetch(f.url+'/api/quotes',{method:'POST',body:form});
  assert.equal(saved.status,201);
  const receipt = (await saved.text()).match(/SS-[A-F0-9]{12}/)[0];
  const stored = (await leads(f.url)).leads;
  assert.equal(stored.length,1);
  assert.equal(stored[0].reference,receipt);
  assert.deepEqual(stored[0].campaign,campaign);
  // Unknown or malformed tracking must not prevent a real customer from sending a quote.
  assert.equal((await post(f.url,{...sample,campaign_context:'malformed'})).status,201);
  assert.equal((await leads(f.url)).leads.find(x=>x.reference!==receipt).campaign,undefined);
});

test('configured measurement loads before the form script and permits only documented Google origins', async t => {
  const f = await fixture(t, { googleAdsConversionSendTo: 'AW-123456789/TestLabel' });
  for (const path of ['/', '/banners-houston/', '/catalog/', '/privacy.html']) {
    const response = await fetch(f.url + path);
    const html = await response.text();
    assert.match(html, /<meta name="signs-google-ads" content="AW-123456789\/TestLabel">/);
    assert.match(html, /<script src="\/ads.js\?v=[a-f0-9]{16}" defer><\/script>/);
    if (html.includes('/app.js')) assert.ok(html.indexOf('/ads.js') < html.indexOf('/app.js'));
    const csp = response.headers.get('content-security-policy');
    assert.match(csp, /script-src 'self'.*https:\/\/www.googletagmanager.com/);
    assert.match(csp, /connect-src[^;]*https:\/\/ad.doubleclick.net/);
    assert.match(csp, /frame-src https:\/\/www.googletagmanager.com/);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|https:\/\/\*/);
    assert.match(csp, /form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'/);
  }
  assert.equal((await fetch(f.url + '/ads.js')).status, 200);
  const fail = await post(f.url, { ...sample, email: 'bad' });
  assert.doesNotMatch(fail.headers.get('content-security-policy'), /google/);
  assert.equal((await leads(f.url)).leads.length, 0);
});

test('invalid or blank measurement configuration stays disabled without allowing injected markup', async t => {
  for (const googleAdsConversionSendTo of ['', 'AW-123/\"><script>bad()</script>']) {
    const f = await fixture(t, { googleAdsConversionSendTo });
    const response = await fetch(f.url);
    const html = await response.text();
    assert.doesNotMatch(html, /signs-google-ads|\/ads.js|bad\(\)/);
    assert.doesNotMatch(response.headers.get('content-security-policy'), /google/);
  }
});

test('the verified Signs destination defaults on only for the production Signs origin', async t => {
  const previousEnv = process.env.NODE_ENV;
  const previousDestination = process.env.GOOGLE_ADS_CONVERSION_SEND_TO;
  delete process.env.GOOGLE_ADS_CONVERSION_SEND_TO;
  try {
    for (const [mode, siteUrl, enabled] of [
      ['production', 'https://solidsitesigns.com', true],
      ['production', 'https://www.solidsitesigns.com', true],
      ['production', 'https://example.com', false],
      ['production', 'http://solidsitesigns.com', false],
      ['development', 'https://solidsitesigns.com', false],
      ['development', '', false]
    ]) {
      process.env.NODE_ENV = mode;
      const f = await fixture(t, { siteUrl });
      const html = await (await fetch(f.url)).text();
      assert.equal(html.includes('AW-18032798518/dFbACNym9bUdELbW2pZD'), enabled, `${mode} ${siteUrl}`);
    }
    process.env.NODE_ENV = 'production';
    const disabled = await fixture(t, { siteUrl: 'https://solidsitesigns.com', googleAdsConversionSendTo: '' });
    assert.doesNotMatch(await (await fetch(disabled.url)).text(), /signs-google-ads/);
  } finally {
    if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv;
    if (previousDestination === undefined) delete process.env.GOOGLE_ADS_CONVERSION_SEND_TO; else process.env.GOOGLE_ADS_CONVERSION_SEND_TO = previousDestination;
  }
});
