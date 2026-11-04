// Keep only campaign metadata. Never persist a complete URL, referrer, or arbitrary query fields.
const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const clickKeys = ['gclid', 'gbraid', 'wbraid'];
export function cleanCampaign(input) {
  if (typeof input === 'string') {
    if (!input || input.length > 2500) return null;
    try { input = JSON.parse(input); } catch { return null; }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const out = {};
  for (const key of campaignKeys) {
    const v = input[key];
    if (typeof v === 'string' && /^[a-z0-9][a-z0-9 _+.:-]{0,119}$/i.test(v)) out[key] = v;
  }
  for (const key of clickKeys) {
    const v = input[key];
    if (typeof v === 'string' && /^[a-z0-9_-]{1,240}$/i.test(v)) out[key] = v;
  }
  if (!Object.keys(out).length) return null;
  const path = input.landing_path;
  if (typeof path === 'string' && path.length <= 160 && /^\/(?:[a-z0-9-]+\/)*$/.test(path)) out.landing_path = path;
  return out;
}
