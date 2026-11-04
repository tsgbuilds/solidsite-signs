import { cleanCampaign } from './campaign.mjs';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

export const SERVICES = ['Banners', 'Graphics', 'Installation', 'Multiple services', 'Not sure yet'];
const FULFILLMENT = ['Not sure yet', 'Install at my location', 'Local delivery'];
const TIMING = ['Flexible / planning ahead', 'As soon as possible', 'Within 2 weeks', 'Within a month', 'Specific date (add below)'];

export function validateQuote(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Please provide your project details.' };
  if (input.website) return { error: 'Please leave the website field empty.' };
  const fields = { name: 100, business: 160, email: 254, phone: 30, location: 120, details: 4000, service: 50, fulfillment: 50, timing: 60 };
  const value = {};
  for (const [field, limit] of Object.entries(fields)) {
    const raw = input[field] ?? '';
    if (typeof raw !== 'string' || raw.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(raw)) {
      return { error: `Please check the ${field} field.` };
    }
    value[field] = raw.trim();
  }
  if (!value.name) return { error: 'Please enter your name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value.email)) return { error: 'Please enter a valid email address.' };
  if (value.phone && !/^[+\d\s().\-xext]{7,30}$/iu.test(value.phone)) return { error: 'Please check your phone number.' };
  if (!SERVICES.includes(value.service)) return { error: 'Please choose a service.' };
  if (!value.location) return { error: 'Please enter the project city or ZIP.' };
  if (value.details.length < 10) return { error: 'Please add a little more detail about the project (at least 10 characters).' };
  value.fulfillment ||= FULFILLMENT[0];
  value.timing ||= TIMING[0];
  if (!FULFILLMENT.includes(value.fulfillment) || !TIMING.includes(value.timing)) return { error: 'Please select a valid delivery preference and timing.' };
  const campaign = cleanCampaign(input.campaign_context);
  if (campaign) value.campaign = campaign;
  return { value };
}

export function openQuoteStore(directory) {
  const path = resolve(directory);
  mkdirSync(path, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(resolve(path, 'quotes.sqlite'));
  db.exec(`PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS quotes (
      reference TEXT PRIMARY KEY,
      request_key TEXT UNIQUE,
      payload_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      company TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      payload TEXT NOT NULL
    );`);
  const lookup = db.prepare('SELECT reference, payload_hash FROM quotes WHERE request_key = ?');
  const insert = db.prepare('INSERT INTO quotes (reference, request_key, payload_hash, created_at, company, source, payload) VALUES (?, ?, ?, ?, ?, ?, ?)');
  return {
    save(value, requestKey = null) {
      const payload = JSON.stringify(value);
      const hash = createHash('sha256').update(payload).digest('hex');
      if (requestKey) {
        const existing = lookup.get(requestKey);
        if (existing) return existing.payload_hash === hash ? { reference: existing.reference, duplicate: true } : { conflict: true };
      }
      const reference = `SS-${randomBytes(6).toString('hex').toUpperCase()}`;
      insert.run(reference, requestKey, hash, new Date().toISOString(), 'SolidSite', 'solidsite-signs-website', payload);
      return { reference, duplicate: false };
    },
    list(limit = 100) {
      return db.prepare('SELECT reference, created_at, company, source, status, payload FROM quotes ORDER BY created_at DESC LIMIT ?').all(Math.min(Math.max(limit, 1), 1000))
        .map(({ payload, ...row }) => ({ ...row, ...JSON.parse(payload) }));
    },
    close() { db.close(); }
  };
}
