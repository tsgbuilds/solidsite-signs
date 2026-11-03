# Initial site build — November 2, 2026

Owner: Atlas. Company: SolidSite. Source: Erik's request to build the site in `tsgbuilds/solidsite-signs`, plus his instruction to reuse SolidSite contacts. Repository was empty when inspected. No outside customer records or unrelated company assets were imported.

## Delivered

- Responsive signage website: hero, banners/graphics/installation services, dealership section, process, project inquiry form, FAQs and privacy page.
- Existing SolidSite wordmark, red/ivory/carbon palette and self-hosted fonts. New generated concept photograph and original product specimens, all labeled as illustrative.
- Correct contact phone `(713) 912-2151` and email `erik@gosolidsite.com`; clickable phone/email and artwork email draft links.
- Working Node 24 / SQLite quote intake with server-side validation, size and rate limits, same-origin checks, retry deduplication and private authenticated retrieval. Company/source attribution remains SolidSite.
- Docker and Railway configuration with explicit production origin and persistent-storage requirements.

## Verification

`npm run check` passed. Eight integration tests passed: saved lead survives restart, repeated request deduplicates, conflicting reuse rejects, invalid/spam/oversized requests reject, cross-origin protection, rate limiting, authenticated lead access/private file boundaries, no-JavaScript form handling, page assets and contact metadata.

Browser checks covered 1440px desktop, 768px tablet, 390px phone and 320px narrow phone. Document width equals viewport width at each checked breakpoint after fixing a 320px header overflow. Native menu opens/closes; service CTA selects Banners; quote form accepts a local test and displays a reference; artwork email link carries that reference; Start another request resets the form; FAQ expands and privacy navigation works. No browser console errors or warnings were observed during the quote check.

The end-to-end local-only test produced reference `SS-355D12D31310` in temporary preview storage, not the production database or a customer inbox. No email or telephone call was sent. Test data is labeled test-only. Browser screenshots are retained locally under ignored `artifacts/`.

## Railway launch and repair — November 2, 2026

The initial source-only delivery is superseded by the live deployment at **https://solidsite-signs-production.up.railway.app**. Erik explicitly authorized pushing to main and then approved a Railway volume at `/data`, capped at 5 GB, with no plan upgrade.

Railway rejected the original Dockerfile with `docker VOLUME at Line 11 is not supported`. Commit `2afbd68` removed that instruction and added a regression check; all nine tests passed. Commit `5d23d6d` initializes permissions on Railway's root-owned mount before dropping to the unprivileged `node` user. The image built and deployment `90f4be1a-b875-4d84-a0e0-1538332521bb` became active. Runtime inspection confirmed PID 1 runs as `node` and `/data` is a separate mounted filesystem.

Production configuration: project `lucid-smile` (`ab665d29-d4fd-49ac-842d-cf57d5e38ff8`), service `solidsite-signs` (`cd94158d-1ad4-481f-ac4c-b930ac911f64`), environment `production` (`c43297ac-8b38-408b-98cb-702160fe799e`). Deployment source is `main`; healthcheck `/healthz`; variables `SITE_URL=https://solidsite-signs-production.up.railway.app`, `DATA_DIR=/data`, `PORT=3000`. Domain target port is 3000. Railway volume `solidsite-signs-volume` (`3edfc96b-6981-4212-86c2-ee5193bae776`) is mounted at `/data`; its Settings screen confirms a 5.00 GB maximum.

The live browser quote check saved reference `SS-191E34C0B05E`, timestamp `2026-11-03T04:29:33.500Z` (November 2, 10:29 PM Chicago). It is labeled **TEST ONLY — do not contact or quote**. A read-only SQLite query in Railway Console confirmed the same reference in `/data/quotes.sqlite`. Exclude this record from customer lead counts. Screenshots are retained under ignored `artifacts/`.

Authorized intake review is available through this service's Railway Console: run `npm run leads` with the existing `DATA_DIR=/data`. Customer data must stay in the private console and existing SolidSite queue, never public logs or Git. The private HTTP intake API remains disabled because `ADMIN_TOKEN` is unset. Form success means a saved database record; automatic email alerts are not configured. The existing `WEB-LEADS-20261102` workflow must use the authenticated Console or report its exact access gap; no new recurring job is created.

## Outcome report

1. Company/task: SolidSite / SS-SIGNS-WEB-20261102; Atlas owns this build.
2. Status: website live on Railway with the approved persistent volume and production settings.
3. Evidence: nine passing tests, active Railway deployment, live quote receipt and database readback; desktop/mobile screenshots retained locally.
4. Next: existing website-lead workflow reviews this live source through Railway Console; no automatic email alert or new deadline.
5. Authority: website build, shared SolidSite contacts, main push, build repair and 5 GB volume explicitly authorized. No ad activation, outreach, customer commitment or new schedule.

## SEO enhancement — November 2, 2026

Erik requested stronger SEO and differentiation after launch. Implementation commit `e7142c0` was pushed to main and the review branch; Railway deployment `c449170c-c9ed-4b11-8ff0-8e2febbce49e` became active. The existing origin remains https://solidsite-signs-production.up.railway.app.

Four substantive service pages and a project checklist now support the homepage. The service pages target Houston banners, window graphics, installation and car-dealership campaigns, with direct Erik/project-coordination positioning. A central route/metadata registry supplies canonical URLs, page titles/descriptions, social metadata, structured data and a six-page sitemap. WOFF2 reduces the existing font transfer by 63.8%. Full rationale, page map, source links and remaining domain/Search Console inputs are in [SEO.md](SEO.md).

Fourteen automated checks passed, including the existing quote-storage/security checks. All six marketing pages were inspected at 320- and 768-pixel widths without horizontal overflow, with desktop and 390-pixel visual checks and successful local service-prefilled form submission. Google’s [live Rich Results Test](https://search.google.com/test/rich-results/result?id=VW3KV76oVZb1mAWSEMypfg) crawled the dealership page on November 2 at 10:43:58 PM Chicago and reported three valid items: breadcrumbs, organization and the organization entity also classified under local businesses. No critical errors. Optional address/image notes remain; a storefront address or real-project image was not invented to remove them. This validates the test fetch and markup, not indexing or rankings.

No new production inquiry test, tracking script, paid campaign or scheduler was introduced. Existing persistent quote storage, approved contacts and intake ownership remain in use.
