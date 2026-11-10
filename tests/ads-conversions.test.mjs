import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { randomUUID } from 'node:crypto';

const appSource = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const destination = 'AW-123456789/TestLabel';
const savedReference = 'SS-012345ABCDEF';

async function browser({ ok = true, result = { ok: true, reference: savedReference }, reject, storage = new Map(), storageThrows = false, valid = true, tagMissing = false, sendTo = destination, search = '', referrer = '', globalPrivacyControl = false } = {}) {
  const events = [];
  let submit;
  const fields = { name: 'Private Person', email: 'private@example.com', phone: '7135550199', details: 'Private project description', service: 'Banners' };
  const label = { textContent: 'Request quote' };
  const button = { querySelector: () => label };
  const error = { hidden: true };
  const success = { hidden: true, focus() {}, scrollIntoView() {} };
  const form = {
    hidden: false, elements: { namedItem: () => null },
    reportValidity: () => valid, reset() {},
    querySelector: selector => selector === '[type="submit"]' ? button : null,
    addEventListener: (type, handler) => { if (type === 'submit') submit = handler; }
  };
  const elements = { '#quote-form': form, '#form-success': success, '#form-error': error, '#quote-reference': {}, '#artwork-link': {}, 'meta[name="signs-google-ads"]': { content: sendTo } };
  const scripts = [];
  const document = {
    querySelector: selector => elements[selector] || null,
    querySelectorAll: () => [], addEventListener() {},
    head: { appendChild: node => scripts.push(node) }, createElement: () => ({}),
    body: { classList: { remove() {} } }, referrer
  };
  const sessionStorage = {
    getItem(key) { if (storageThrows) throw new Error('Blocked'); return storage.get(key) ?? null; },
    setItem(key, value) { if (storageThrows) throw new Error('Blocked'); storage.set(key, value); }
  };
  const window = {
    location: { search, href: 'https://solidsitesigns.com/banners-houston/' + search, origin: 'https://solidsitesigns.com', pathname: '/banners-houston/' },
    navigator: { globalPrivacyControl },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    gtag: (...args) => events.push(args)
  };
  if (tagMissing) delete window.gtag;
  const context = { document, window, sessionStorage, URL, URLSearchParams, crypto: { randomUUID }, AbortController, setTimeout, clearTimeout,
    FormData: class { entries() { return Object.entries(fields); } },
    fetch: async () => { if (reject) throw reject; return { ok, json: async () => result }; }
  };
  // Load the same optional bootstrap that the server places before app.js.
  runInNewContext(await readFile(new URL('../public/ads.js', import.meta.url), 'utf8'), context);
  runInNewContext(appSource, context);
  return { events, scripts, form, success, error, window, submit: () => submit({ preventDefault() {} }) };
}

test('real form success sends exactly one conversion with only the saved reference', async () => {
  const b = await browser();
  await b.submit();
  const conversions = b.events.filter(e => e[0] === 'event' && e[1] === 'conversion');
  assert.equal(conversions.length, 1, 'Saved inquiry must emit its Google Ads conversion');
  assert.deepEqual(JSON.parse(JSON.stringify(conversions[0][2])), { send_to: destination, transaction_id: savedReference });
  assert.equal(b.success.hidden, false);
  assert.equal(b.form.hidden, true);
});

test('failed, missing-reference, malformed-reference, and invalid submissions do not count', async () => {
  for (const options of [
    { ok: false, result: { error: 'Not saved' } },
    { result: { ok: true } },
    { result: { reference: 'private@example.com' } },
    { reject: new Error('Network unavailable') },
    { reject: Object.assign(new Error('Timed out'), { name: 'AbortError' }) },
    { valid: false }
  ]) {
    const b = await browser(options);
    await b.submit();
    assert.equal(b.events.filter(e => e[0] === 'event').length, 0);
  }
});

test('duplicate receipts are deduplicated in memory and across page loads in the tab', async () => {
  const storage = new Map();
  const first = await browser({ storage });
  await first.submit();
  await first.submit();
  assert.equal(first.events.filter(e => e[0] === 'event').length, 1);
  const reopened = await browser({ storage });
  await reopened.submit();
  assert.equal(reopened.events.filter(e => e[0] === 'event').length, 0);
  const newInquiry = await browser({ storage, result: { reference: 'SS-FFFFFFFFFFFF' } });
  await newInquiry.submit();
  assert.equal(newInquiry.events.filter(e => e[0] === 'event').length, 1);
});

test('blocked storage retains in-page dedup and blocked measurement never hides confirmation', async () => {
  const b = await browser({ storageThrows: true });
  await b.submit();
  await b.submit();
  assert.equal(b.events.filter(e => e[0] === 'event').length, 1);
  const broken = await browser();
  broken.window.gtag = () => { throw new Error('Tag unavailable'); };
  await broken.submit();
  assert.equal(broken.success.hidden, false);
  assert.equal(broken.error.hidden, true);
});

test('bootstrap queues the event while Google script is loading without sending form data', async () => {
  const b = await browser({ tagMissing: true });
  assert.equal(b.scripts.length, 1);
  assert.equal(b.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=AW-123456789');
  assert.equal(b.scripts[0].async, true);
  assert.equal(b.window.dataLayer.filter(e => e[0] === 'event').length, 0);
  await b.submit();
  const commands = b.window.dataLayer.map(args => Array.from(args));
  assert.equal(commands.filter(e => e[0] === 'event').length, 1);
  assert.doesNotMatch(JSON.stringify(commands), /private@example|Private Person|Private project|7135550199/);
});

test('unconfigured and privacy-opted-out browsers do not load Google or emit conversions', async () => {
  for (const options of [{ sendTo: '' }, { sendTo: 'AW-123/private@example.com' }, { globalPrivacyControl: true }]) {
    const b = await browser(options);
    await b.submit();
    assert.equal(b.scripts.length, 0);
    assert.equal(b.events.length, 0);
    assert.equal(b.success.hidden, false);
  }
});

test('measurement removes arbitrary URL and referrer query fields and disables personalization', async () => {
  const b = await browser({ search: '?gclid=Test-click_12&email=private%40example.com&details=Private+project', referrer: 'https://example.com/path?email=private@example.com' });
  const config = b.events.find(e => e[0] === 'config');
  assert.equal(config[1], 'AW-123456789');
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(config[2].page_location, 'https://solidsitesigns.com/banners-houston/?gclid=Test-click_12');
  assert.equal(config[2].page_referrer, 'https://example.com/path');
  assert.doesNotMatch(JSON.stringify(b.events), /private@example|Private.project/);
});
