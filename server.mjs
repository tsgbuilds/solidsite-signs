import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { openQuoteStore, validateQuote } from './lib/quotes.mjs';
import { canonicalRedirect, findSeoPage, renderSeoHead, renderSitemap } from './lib/seo.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(ROOT, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const contentSecurityPolicy = scriptHash => `default-src 'self'; script-src 'self'${scriptHash ? ` '${scriptHash}'` : ''}; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'`;

function hostnameFromHost(value) {
  // Only a hostname and optional port are accepted, never a URL or forwarded host.
  if (typeof value !== 'string' || !/^[a-z0-9.-]+(?::\d+)?$/i.test(value)) return '';
  try { return new URL(`http://${value}`).hostname.toLowerCase().replace(/\.$/, ''); }
  catch { return ''; }
}

function equalSecret(value, expected) {
  if (!value || !expected || expected.length < 32) return false;
  const a = Buffer.from(value), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function confirmation(reference) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Request received | SolidSite Signs</title><link rel="stylesheet" href="/styles.css"></head><body><main class="wrap legal-page"><p class="eyebrow">SolidSite Signs</p><h1>Request received.</h1><p>Your project details have been saved. Your reference is <strong>${escapeHtml(reference)}</strong>.</p><p>Send artwork or photos to <a href="mailto:erik@gosolidsite.com?subject=${encodeURIComponent(`Signage project ${reference}`)}">erik@gosolidsite.com</a>. For time-sensitive projects, call <a href="tel:+17139122151">(713) 912-2151</a>. A quote and schedule are confirmed after review.</p><a class="button" href="/">Back to SolidSite Signs</a></main></body></html>`;
}

function errorPage(message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Check your request | SolidSite Signs</title><link rel="stylesheet" href="/styles.css"></head><body><main class="wrap legal-page"><h1>Let’s check those details.</h1><p>${escapeHtml(message)}</p><p>Use your browser’s Back button to return to your form, or call <a href="tel:+17139122151">(713) 912-2151</a>.</p><a class="button" href="/#quote">Return to the quote form</a></main></body></html>`;
}

async function parseBody(req) {
  if (Number(req.headers['content-length']) > 16384) throw Object.assign(new Error('Your request is too large. Email artwork separately.'), { status: 413 });
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw Object.assign(new Error('Your request is too large. Email artwork separately.'), { status: 413 });
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  const type = (req.headers['content-type'] || '').split(';')[0];
  try {
    if (type === 'application/json') return JSON.parse(text);
    if (type === 'application/x-www-form-urlencoded') return Object.fromEntries(new URLSearchParams(text));
  } catch { throw Object.assign(new Error('We couldn’t read the request. Please try again.'), { status: 400 }); }
  throw Object.assign(new Error('Please use the project request form.'), { status: 415 });
}

export function createApp({ dataDir = process.env.DATA_DIR || resolve(ROOT, 'data'), siteUrl = process.env.SITE_URL || '', redirectHosts = process.env.REDIRECT_HOSTS || '', adminToken = process.env.ADMIN_TOKEN || '', trustProxy = process.env.TRUST_PROXY === '1', rateLimit = 10, rateWindow = 15 * 60 * 1000 } = {}) {
  const siteOrigin = siteUrl ? new URL(siteUrl).origin : '';
  const siteHostname = siteUrl ? new URL(siteUrl).hostname.toLowerCase().replace(/\.$/, '') : '';
  const redirectHostnames = new Set(redirectHosts.split(',').map(value => hostnameFromHost(value.trim())).filter(Boolean));
  redirectHostnames.delete(siteHostname);
  const store = openQuoteStore(dataDir);
  const buckets = new Map();
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', contentSecurityPolicy());
    if (siteOrigin.startsWith('https://')) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const json = (status, body) => {
      if (status >= 400) res.setHeader('X-Robots-Tag', 'noindex');
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify(body));
    };
    const html = (status, body) => {
      if (status >= 400) res.setHeader('X-Robots-Tag', 'noindex');
      res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    const wantsJson = req.headers.accept?.includes('application/json') || req.headers['content-type']?.startsWith('application/json');
    const fail = (status, message) => wantsJson ? json(status, { error: message }) : html(status, errorPage(message));
    try {
      const url = new URL(req.url, 'http://localhost');
      const operationalPath = url.pathname === '/healthz' || url.pathname === '/api' || url.pathname.startsWith('/api/');
      if (siteOrigin && !operationalPath && ['GET', 'HEAD'].includes(req.method) && redirectHostnames.has(hostnameFromHost(req.headers.host))) {
        // The configured SITE_URL always owns the destination. Preserve the raw
        // origin-form path/query, including encoded characters, without treating
        // a leading // as a different redirect host.
        const target = req.url.startsWith('/') ? req.url : `${url.pathname}${url.search}`;
        res.writeHead(308, { Location: `${siteOrigin}${target}` });
        return res.end();
      }
      if (url.pathname.startsWith('/api/') || url.pathname === '/healthz') res.setHeader('X-Robots-Tag', 'noindex');
      if (url.pathname === '/healthz' && ['GET', 'HEAD'].includes(req.method)) return json(200, { ok: true });
      if (url.pathname === '/api/admin/leads') {
        if (req.method !== 'GET') return json(405, { error: 'Method not allowed.' });
        const token = req.headers.authorization?.replace(/^Bearer /, '');
        if (!equalSecret(token, adminToken)) return json(401, { error: 'Authentication required.' });
        return json(200, { leads: store.list(100) });
      }
      if (url.pathname === '/api/quotes') {
        if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(405, { error: 'Please submit the project form.' }); }
        const origin = req.headers.origin;
        const expectedOrigin = siteOrigin || `http://${req.headers.host}`;
        if ((origin && origin !== expectedOrigin) || req.headers['sec-fetch-site'] === 'cross-site') return fail(403, 'Please send your request from the SolidSite Signs website.');
        const now = Date.now();
        for (const [key, bucket] of buckets) if (now >= bucket.expires) buckets.delete(key);
        const ip = trustProxy ? (req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress) : req.socket.remoteAddress;
        const bucket = buckets.get(ip) || { count: 0, expires: now + rateWindow };
        if (bucket.count >= rateLimit || (!buckets.has(ip) && buckets.size >= 10000)) {
          res.setHeader('Retry-After', Math.ceil((bucket.expires - now) / 1000));
          return fail(429, 'Too many requests. Please wait a few minutes or contact us directly.');
        }
        bucket.count++;
        buckets.set(ip, bucket);
        const input = await parseBody(req);
        const checked = validateQuote(input);
        if (checked.error) return fail(400, checked.error);
        const key = req.headers['idempotency-key'] || null;
        if (key && !/^[a-zA-Z0-9-]{16,80}$/.test(key)) return fail(400, 'Please refresh the page and try again.');
        const saved = store.save(checked.value, key);
        if (saved.conflict) return fail(409, 'This request reference was already used. Refresh the page before submitting new details.');
        if (wantsJson) return json(saved.duplicate ? 200 : 201, { ok: true, reference: saved.reference });
        return html(201, confirmation(saved.reference));
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return json(405, { error: 'Method not allowed.' }); }
      if (url.pathname === '/robots.txt') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(req.method === 'HEAD' ? undefined : `User-agent: *\nDisallow: /api/\n${siteOrigin ? `Sitemap: ${siteOrigin}/sitemap.xml\n` : ''}`);
      }
      if (url.pathname === '/sitemap.xml' && siteOrigin) {
        res.writeHead(200, { 'Content-Type': TYPES['.xml'] });
        return res.end(req.method === 'HEAD' ? undefined : renderSitemap(siteOrigin));
      }
      let pathname;
      try { pathname = decodeURIComponent(url.pathname); } catch { return fail(400, 'Invalid page address.'); }
      if (pathname.split('/').some(segment => segment.startsWith('.') || segment.includes('\\')) || pathname.includes('\0')) return fail(404, 'This page could not be found.');
      const redirect = canonicalRedirect(pathname);
      if (redirect) {
        // Redirect destinations come only from the registry, never query input.
        res.writeHead(308, { Location: `${redirect}${url.search}` });
        return res.end();
      }
      const page = findSeoPage(pathname);
      const path = resolve(PUBLIC, page ? page.file : `.${pathname}`);
      if (!path.startsWith(PUBLIC + sep) || !TYPES[extname(path)]) return fail(404, 'This page could not be found.');
      if (extname(path) === '.html' && !page) return fail(404, 'This page could not be found.');
      let content;
      try { content = await readFile(path); } catch { return fail(404, 'This page could not be found.'); }
      if (page) {
        const seo = renderSeoHead(page, siteOrigin);
        content = Buffer.from(content.toString().replace('<!-- SEO_HEAD -->', seo.head));
        res.setHeader('Content-Security-Policy', contentSecurityPolicy(seo.scriptHash));
      }
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)], 'Content-Length': content.length, 'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=86400' : 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (res.headersSent) return res.end();
      if (error.status) return fail(error.status, error.message);
      // Never log the request body or contact details.
      console.error('Request handling failed:', error.code || error.name);
      return fail(500, 'Your request could not be saved. Please try again or contact us directly.');
    }
  });
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  server.on('close', () => store.close());
  return { server, store };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.NODE_ENV === 'production' && (!process.env.DATA_DIR || !process.env.SITE_URL)) {
    console.error('Production requires DATA_DIR on persistent storage and SITE_URL set to the public HTTPS origin. See README.md.');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production' && !process.env.SITE_URL.startsWith('https://')) {
    console.error('Production SITE_URL must use HTTPS.');
    process.exit(1);
  }
  const { server } = createApp();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => console.log(`SolidSite Signs: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
