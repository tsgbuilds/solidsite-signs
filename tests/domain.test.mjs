import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server.mjs';

const origin = 'https://canonical.example';
const alias = 'old.example';
const token = 'domain-test-token-longer-than-thirty-two-characters';

async function fixture(t, options = {}) {
  const dataDir = await mkdtemp(join(tmpdir(), 'solidsite-signs-domain-'));
  const { server } = createApp({ dataDir, siteUrl: origin, redirectHosts: ` ${alias}, WWW.CANONICAL.EXAMPLE `, adminToken: token, ...options });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  });
  return (path, { method = 'GET', host = alias, headers = {}, body } = {}) => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: server.address().port, path, method, headers: { Host: host, ...headers } }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end(body);
  });
}

test('known aliases redirect GET and HEAD to the configured origin, retaining path and query', async t => {
  const get = await fixture(t);
  const path = '/banners-houston/?utm_source=old&label=New%20signs&next=https%3A%2F%2Foutside.example';
  for (const method of ['GET', 'HEAD']) {
    const response = await get(path, { method, host: 'OLD.EXAMPLE:443' });
    assert.equal(response.status, 308);
    assert.equal(response.headers.location, origin + path);
    assert.equal(response.body, '');
  }
  const www = await get('/', { host: 'www.canonical.example' });
  assert.equal(www.status, 308);
  assert.equal(www.headers.location, `${origin}/`);
  const raw = await get('//outside.example/a%2Fb?x=%2F');
  assert.equal(raw.headers.location, `${origin}//outside.example/a%2Fb?x=%2F`);
  assert.equal(new URL(raw.headers.location).origin, origin);
});

test('canonical hostname never loops, including when it is mistakenly listed as an alias', async t => {
  const get = await fixture(t, { redirectHosts: `${alias}, CANONICAL.EXAMPLE.,canonical.example` });
  for (const host of ['canonical.example', 'CANONICAL.EXAMPLE:443', 'canonical.example.']) {
    const response = await get('/', { host });
    assert.equal(response.status, 200);
    assert.equal(response.headers.location, undefined);
  }
});

test('health and API requests stay on the original host and retain authentication', async t => {
  const get = await fixture(t);
  for (const method of ['GET', 'HEAD']) {
    const health = await get('/healthz?check=1', { method });
    assert.equal(health.status, 200);
    assert.equal(health.headers.location, undefined);
    assert.equal(health.headers['x-robots-tag'], 'noindex');
  }
  const denied = await get('/api/admin/leads');
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.location, undefined);
  const accepted = await get('/api/admin/leads', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(accepted.status, 200);
  assert.deepEqual(JSON.parse(accepted.body), { leads: [] });
  assert.equal(accepted.headers.location, undefined);
  for (const path of ['/api', '/api/unknown', '/api/quotes']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await get(path, { method });
      assert.notEqual(response.status, 308);
      assert.equal(response.headers.location, undefined);
    }
  }
});

test('POST requests never redirect and quote origin protection is unchanged', async t => {
  const get = await fixture(t);
  const ordinaryPost = await get('/', { method: 'POST' });
  assert.equal(ordinaryPost.status, 405);
  assert.equal(ordinaryPost.headers.location, undefined);
  const quote = { name: 'Domain QA', email: 'test@example.com', service: 'Banners', location: 'Houston', details: 'Internal integration test; not a customer order.' };
  const body = JSON.stringify(quote);
  const options = { method: 'POST', body, headers: { 'Content-Type': 'application/json', Origin: `https://${alias}` } };
  const rejected = await get('/api/quotes', options);
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.location, undefined);
  const accepted = await get('/api/quotes', { ...options, headers: { ...options.headers, Origin: origin } });
  assert.equal(accepted.status, 201);
  assert.equal(accepted.headers.location, undefined);
  assert.equal(JSON.parse(accepted.body).ok, true);
});

test('unlisted or malformed hosts and forwarded-host headers do not trigger redirects', async t => {
  const get = await fixture(t);
  for (const host of ['unknown.example', 'old.example.outside.example', 'outside.example@old.example', 'old.example, outside.example']) {
    const response = await get('/', { host, headers: { 'X-Forwarded-Host': alias, Forwarded: `host=${alias};proto=https` } });
    assert.equal(response.status, 200, host);
    assert.equal(response.headers.location, undefined, host);
  }
});

test('redirects are opt-in and need a configured canonical origin', async t => {
  const disabled = await fixture(t, { redirectHosts: '' });
  const unset = await disabled('/banners-houston/');
  assert.equal(unset.status, 200);
  assert.equal(unset.headers.location, undefined);
  const noOrigin = await fixture(t, { siteUrl: '' });
  const response = await noOrigin('/');
  assert.equal(response.status, 200);
  assert.equal(response.headers.location, undefined);
});
