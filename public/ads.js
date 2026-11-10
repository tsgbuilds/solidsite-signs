(() => {
  const sendTo = document.querySelector('meta[name="signs-google-ads"]')?.content || '';
  if (!/^AW-\d+\/[A-Za-z0-9_-]+$/.test(sendTo)) return;
  if (window.navigator?.globalPrivacyControl === true) return;

  const tagId = sendTo.split('/')[0];
  const sent = new Set();
  // Only the page path and recognized ad identifiers belong in measurement URLs.
  // Never forward arbitrary query parameters or the visitor's project fields.
  const pageLocation = new URL(window.location.pathname, window.location.origin);
  const query = new URLSearchParams(window.location.search);
  for (const key of ['gclid', 'gbraid', 'wbraid']) {
    const value = query.get(key);
    if (value && /^[A-Za-z0-9._~-]{1,500}$/.test(value)) pageLocation.searchParams.set(key, value);
  }
  let pageReferrer = '';
  try {
    const referrer = new URL(document.referrer);
    if (['https:', 'http:'].includes(referrer.protocol)) pageReferrer = referrer.origin + referrer.pathname;
  } catch { /* Direct visits have no referrer. */ }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('set', 'allow_ad_personalization_signals', false);
  window.gtag('js', new Date());
  window.gtag('config', tagId, {
    allow_ad_personalization_signals: false,
    send_page_view: false,
    page_location: pageLocation.href,
    page_referrer: pageReferrer
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`;
  document.head.appendChild(script);

  window.signsAdsConversion = reference => {
    // The quote API creates this opaque reference only after the inquiry is saved.
    if (typeof reference !== 'string' || !/^SS-[A-F0-9]{12}$/.test(reference)) return false;
    const key = `solidsite-signs:ads:${sendTo}:${reference}`;
    if (sent.has(reference)) return false;
    try { if (sessionStorage.getItem(key)) return false; } catch { /* Memory dedup still works. */ }
    try {
      window.gtag('event', 'conversion', { send_to: sendTo, transaction_id: reference });
      sent.add(reference);
      try { sessionStorage.setItem(key, 'queued'); } catch { /* Storage is optional. */ }
      return true;
    } catch { return false; /* Measurement must never interrupt a saved request. */ }
  };
})();
