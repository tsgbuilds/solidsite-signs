# SolidSite Signs

Website for SolidSite's banners, graphics and sign-installation work in Greater Houston. Built with semantic HTML, self-hosted brand fonts, responsive CSS, vanilla JavaScript and a dependency-free Node 24 server. Quote requests persist in SQLite, including a company/source tag and a reference number. No fabricated testimonials, Lexus logos or client project photos.

## Run

Requires Node 24 or newer. No package installation or build step is needed.

```sh
npm run dev
# http://127.0.0.1:3000
npm run check
npm test
```

The server serves only `public/`. Lead data, documentation, source and environment files are never public assets. `.env` files are not loaded automatically: set environment variables in the host or use Node's `--env-file` flag explicitly.

Rendered pages use content-hash query versions for the JavaScript and CSS files. This prevents returning visitors from receiving an outdated quote-form script or layout after deployment, even when the CDN extends browser caching. Asset hashes are computed at startup; restart after changing frontend files.

## Contacts and content

Per Erik's November 2, 2026 direction, use the same contact details as SolidSite Services: **(713) 912-2151**, **erik@gosolidsite.com**. Signage inquiries remain SolidSite records; they must not be sent from another company's account. The site does not send emails automatically. Artwork links open the visitor's email app addressed to the approved SolidSite mailbox.

The storefront photograph is an AI-generated concept, labeled on the page. Service specimens are original HTML/CSS concepts. Replace them with Erik's own authorized project photos when available. The local dealership history is described without naming the dealer or claiming its endorsement. Private sales/profit figures are not included in the public website.

## Production hosting

`Dockerfile` supports a conventional container host. On Railway, connect the repository's `main` branch, use the detected Dockerfile, attach a Railway volume at `/data` (5 GB maximum), and set the service healthcheck to `/healthz` in the dashboard. New Railway services cannot use the legacy `railway.json` configuration. Do not add a Docker `VOLUME` instruction: Railway rejects it. The container entrypoint initializes the mounted directory's permissions and then runs Node as the unprivileged `node` user.

Set these service variables:

- `NODE_ENV=production`
- `DATA_DIR=/data`
- `SITE_URL=https://your-confirmed-domain.example` (actual deployed HTTPS origin; no path)
- `REDIRECT_HOSTS=old-host.example,www.your-confirmed-domain.example` optionally enables permanent canonical-host redirects. Use a comma-separated list of known alias hostnames, without schemes or paths, only after the `SITE_URL` domain and HTTPS work. Leave unset to retain current behavior. Matching is case-insensitive and ignores the request port; the canonical hostname is excluded to prevent loops. Only GET/HEAD requests redirect, with their path and query preserved. `/healthz` and `/api` routes never redirect, and quote-origin validation remains unchanged. Unlisted hosts and forwarded-host headers cannot choose a redirect destination.
- `PORT=3000` with the public domain's target port also set to `3000`; `HOST=0.0.0.0`
- `ADMIN_TOKEN` to a random secret at least 32 characters long if the private intake API is needed.
- `TRUST_PROXY=1` only if the hosting proxy replaces `X-Forwarded-For` with trusted client information. Default is off.

Startup refuses production without `DATA_DIR` and an HTTPS `SITE_URL`. Merely naming `/data` does not make it persistent: verify the volume mount and backups in the hosting dashboard. The sitemap and canonical URLs use `SITE_URL`. No DNS, hosting account, public domain or automation is provisioned by the repository itself.

Before public launch, confirm the persistent volume, actual domain, intake reviewer and notification workflow. A successful form submission means a database record was saved; it does **not** mean an email was delivered. Configure the existing SolidSite intake workflow to read this source before accepting real public inquiries. Do not add an independent outreach campaign or borrow another company's mailbox.

## Review incoming requests

On the host, with the same `DATA_DIR`:

```sh
npm run leads
```

This writes private customer data to your own terminal; do not put exports into Git or public logs. For an authorized intake integration, `GET /api/admin/leads` requires `Authorization: Bearer <ADMIN_TOKEN>` and returns the latest 100 records. There is no public list of leads. The API is disabled when no sufficiently long token is configured. Keep the token server-side or in the authorized monitor's secret store, never in frontend code. Records are tagged `company=SolidSite`, `source=solidsite-signs-website`, `status=new`.

Browser submissions use an idempotency key, so retrying an uncertain request with unchanged details does not duplicate the lead. Changed payloads cannot reuse the same key. Requests are validated on the server, body size is bounded, cross-origin browser posts are rejected, and the endpoint has a honeypot and rate limiting. There is also a no-JavaScript form path. For multiple server instances, use a shared database/rate-limit service rather than separate SQLite files.

## Files

- `public/`: site and static assets.
- `server.mjs`, `lib/quotes.mjs`: HTTP server, validation and persistence.
- `lib/seo.mjs`: canonical page registry, metadata, structured data and sitemap. Registered HTML files use `<!-- SEO_HEAD -->`; the server renders it into the response.
- `tests/`: integration tests for lead storage, retries, privacy boundaries and failure cases.
- `docs/DESIGN.md`: design decisions and factual content boundaries.
- `docs/ASSETS.md`: image provenance and font/brand sources.
- `docs/SEO.md`: page targeting, verified search improvements and remaining domain/Search Console follow-through.

## Product catalog

`/catalog/` contains 104 product and service listings in 11 categories, rendered on the server for search and access without JavaScript. Browser search and category filters progressively enhance the page. Each product links to the existing quote form with its name and an allowed service prefilled. The 32-page customer PDF is at `/downloads/solidsite-signs-catalog.pdf`.

Every listing has a supplier image and an accessible enlarged view. Images are self-hosted, lazy-loaded and linked directly when JavaScript is unavailable. The three paper handout listings share the supplier’s labeled family example. The five services show related products. The customer PDF uses the same catalog data and product images; its download link changes when the file changes.

The shared source is `data/catalog.json`. Its `sources` fields are internal provenance: the renderer explicitly excludes them, and the server never serves the source file. Docker copies only this catalog into `/app/data`; production quote storage remains on the separate `/data` volume. Supplier research and limitations are in `docs/catalog-signs365-research.md` and `docs/catalog-b2sign-research.md`.

After changing the catalog, restart the server and regenerate the PDF with Python, Pillow and ReportLab available in the authoring environment:

```sh
python3 scripts/build-catalog-pdf.py
npm test
npm run check
```

Review rendered PDF pages before publishing. Python and ReportLab are authoring tools only; Railway serves the committed PDF without either dependency. Public descriptions are original. Image provenance and the supplier-photo update are documented in `docs/ASSETS.md`. Products are quoted per project, and supplier production claims are not promises of installation capability or customer delivery dates.

No recurring subscriptions, external messages, ad campaigns or customer commitments are created by running this website.
