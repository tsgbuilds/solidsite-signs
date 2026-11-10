# Initial site build — November 2, 2026

## Public website identity correction — November 10, 2026

The owner's instruction now covers personal-name references across all public company sites. SolidSite Signs copy, product-detail templates, schema, browser/server confirmation messages, artwork links and the downloadable catalog use company branding and the existing general contact `info@gosolidsite.com`. Outbound sender identities, private records and form behavior are unchanged; mailbox delivery was not tested.

This correction is rebased onto production `main` commit `70b9f13` in an isolated checkout, preserving the live banner form and campaign attribution. The original working directory and its documentation/outreach changes are untouched. Verification passed: syntax checks, all 31 existing tests, a public-source name scan, all 32 PDF pages' text/annotations/metadata, and rendered visual review of changed PDF pages 1, 30, 31 and 32. Existing asset-content hashing changes the app/PDF URLs automatically.

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


## Owned-domain connection — November 3, 2026

Erik corrected his initial “no domain” answer and confirmed he owns **SolidSiteSigns.com**, then reported completing the apex connection. The live canonical site is now **https://solidsitesigns.com**. This supersedes the Railway-origin configuration above and the earlier proposed domain alternatives; no domain purchase was needed.

The Cloudflare account showed the apex CNAME already pointing to `lz2przmq.up.railway.app` with the matching Railway ownership TXT. Apex proxying remains enabled. Atlas added `www.solidsitesigns.com` to the same Railway service, target port 3000, changed the existing www CNAME from `cdn.webflow.com` to `69j6uv3f.up.railway.app`, and added the required `_railway-verify.www` TXT. The existing www DNS-only mode and unrelated TXT records were preserved; no mail, account-access or plan changes were made.

Implementation `6ff9940` adds opt-in canonical-host redirects. Production now uses `SITE_URL=https://solidsitesigns.com` and `REDIRECT_HOSTS=solidsite-signs-production.up.railway.app,www.solidsitesigns.com`. Only GET/HEAD requests on those known aliases redirect; path/query are retained, destination comes solely from configured `SITE_URL`, and health/API routes retain their behavior. The primary configuration deployment `799f3b50-636e-454c-a8cd-5c5e85bb8b9a` was verified ACTIVE/successful.

All 20 automated tests passed, including six migration checks and existing intake/SEO regressions; syntax and whitespace checks passed. Live checks verified HTTPS, seven pages with final-domain canonicals and no old-host metadata, six sitemap URLs, robots pointing to the new sitemap, and 308 redirects from both aliases with path/query preserved. `/healthz` returns 200/noindex. Early recursive DNS answers retained the old Webflow address while authoritative DNS had changed; browser and curl checks subsequently reached the new site normally. No indexing or ranking claim is implied.

A live browser form submission on the final domain returned **SS-37454D8D1C70**. A read-only Railway Console query confirmed that exact reference in `/data/quotes.sqlite`, created `2026-11-03T17:43:59.422Z` (11:43 AM Chicago). It is clearly marked **TEST ONLY — domain verification; do not contact, quote or count as a customer**. Add it alongside the prior QA reference in the existing lead-monitor exclusion. Email alerts and public admin access remain disabled. Screenshots are retained locally in ignored `artifacts/domain-live-home.jpg`, `artifacts/domain-quote-receipt.jpg` and `artifacts/domain-cloudflare-dns.jpg`.

### Outcome report

1. Company/task: SolidSite / SS-SIGNS-WEB-20261102; Atlas owns website delivery.
2. Status: owned apex domain connected, www repaired, canonical metadata/sitemap and alias redirects live.
3. Evidence: 20 passing tests, successful Railway deployment, live HTTPS/redirect crawl and final-domain form receipt.
4. Next: existing WEB-LEADS-20261102 intake review; Google Search Console verification/submission and authorized real-project photos remain outstanding. No new deadline or schedule.
5. Authority: existing build/main-push/SEO authorization plus Erik's domain ownership confirmation and apex setup; no purchase, plan upgrade, outreach or customer commitment.

## Product catalog — November 3, 2026

Erik requested a catalog using his open wholesale supplier websites and then explicitly asked to use it on the site. Atlas reviewed Signs365's authenticated product categories and B2Sign's public catalog, with scoped implementation and independent review. Internal provenance is retained in [Signs365 research](catalog-signs365-research.md), [B2Sign research](catalog-b2sign-research.md) and `data/catalog.json`. Supplier assets were not reused; all descriptions and format illustrations are original.

The release adds `/catalog/`: 104 product/service listings across 11 categories, search, category filtering, product-specific quote links and a downloadable 17-page PDF. Categories cover banners, rigid signs/magnets, adhesive/window graphics, displays, flags/tents/tables, wall art/murals, apparel/transfers, print, specialty signs, hardware and project services. Variants are grouped to avoid duplicate listings. Pricing, current availability, timing and installation requirements are confirmed per project. The existing SolidSite contacts and quote workflow remain in use.

The same source feeds server-rendered HTML, CollectionPage/ItemList markup and the PDF generator. Internal provenance fields are explicitly excluded from public output. Docker copies the catalog into `/app/data/catalog.json`; lead storage stays at `/data`. The sitemap now has seven marketing pages. No customer lists, supplier costs, ordering activity, external messages or new schedule were introduced.

Validation: all 23 automated tests, syntax checks and whitespace checks passed. Independent read-only review exercised all 104 quote links, 11 category image paths, source stripping, canonical aliases, schema/CSP and Docker storage boundaries. Browser search returned 14 matches for “wall,” empty search recovery restored all 104 items, and the event filter showed 15. “Printed event tents” correctly prefilled Multiple services and project details; a local-only form submission returned `SS-28122BF90935` in temporary preview storage. No production lead was created for this catalog check. Phone layouts at 320/390 pixels and tablet at 768 pixels showed no horizontal overflow; desktop and mobile visuals were reviewed, with no browser warnings/errors. The PDF was rendered and inspected: 17 pages, all 104 product names, working link annotations and no supplier identities in customer text.

Publication target is the existing [SolidSite Signs catalog](https://solidsitesigns.com/catalog/) on Railway. Final commit/deployment and live verification are recorded in the existing `SS-SIGNS-WEB-20261102` task after deployment. Ongoing intake remains `WEB-LEADS-20261102`; Search Console and authorized real-project photography remain separate follow-through.

Live verification of initial catalog commit `17abd82` caught an older `app.js` retained in the returning browser session: service preselection worked, but the new product brief did not appear. The server now appends a content-derived version to script/style URLs on all rendered pages, including fallback form responses. A regression check verifies that each URL version matches the bytes served, and the suite now has 24 checks. This correction avoids requiring visitors to clear their cache.

## Product photography — November 3, 2026 (awaiting supplier login)

Erik requested pictures for every product and then instructed use of the suppliers’ images. This supersedes the earlier illustrative-mockup choice. Atlas imported 95 matching B2Sign product images, preserved source provenance, and checked all four image contact sheets. The five service entries use labeled related product examples. Nine Signs365-only images still require Erik to sign in through the scoped Chrome supplier tab; no unrelated browser-window contents are required.

The staged site adds lazy-loaded product pictures, an enlarged native-dialog view, keyboard dismissal/focus return and ordinary image links when JavaScript/dialog support is unavailable. Search, filters and product quote links are preserved. The PDF generator now provides four photo-led listings per page across 32 pages, with overflow and missing-image guards and compressed embedded images. PDF download URLs now include a content hash to avoid stale downloads after release.

Validation so far: 28/29 automated tests pass. The single failure lists exactly the nine missing photo files; all 95 imported files are served as valid WebP images, and private catalog/image-source records remain inaccessible. Syntax checks pass. Browser checks confirmed desktop and 390/320-pixel image viewing, Escape/focus return, filtering and no horizontal overflow. A local-only PDF preview has 32 pages, all 104 names, 95 supplier images plus the existing illustrative cover, and nine explicitly pending-image spaces; both rendered contact sheets were reviewed without overlap. This preview is not the public download. Independent read-only review found no actionable defects and independently measured zero PDF row/header collisions (maximum row 234 points, limit 240).

Missing: bubble-core-signs, double-window, outdoor-floor, durable-posters, printed-shirts, business-cards, postcards, mailers, metal-cards. Next: after scoped Signs365 login, collect those exact supplier images, rerun the complete integrity check, rebuild and inspect the final PDF, then use the existing authorized main-push/Railway deployment flow and verify production. No photo update is committed or published yet. Existing live release remains `e1336df`, deployment `615e1b5f-f755-4ae8-951d-cfc23bbea343`.

### Outcome report

1. Company/task: SolidSite / SS-SIGNS-WEB-20261102; Atlas owns the photo expansion.
2. Status: 95 photos and the site/PDF layout staged; nine supplier photos await Signs365 login.
3. Evidence: [image provenance](catalog-image-sources.json), 28 passing tests and one expected missing-assets failure; desktop/phone and PDF visual review.
4. Next: Erik signs into the scoped Signs365 tab; Atlas completes the remaining images, final checks and existing authorized deployment. No new deadline or schedule.
5. Authority: existing catalog/site/push scope and Erik’s explicit supplier-image instruction; no supplier order, outreach, purchase or account change.


Supplier-session follow-up: Erik confirmed he is signed in and clarified the tab is in Chrome profile **TSG**. The browser connection exposes only **Erik**; its scoped Signs365 tabs remain logged out. A direct known catalog route also showed the login form. Automatic approval review rejected native Chrome-window capture because it could expose unrelated private tabs. Atlas requested connection of the TSG profile through the Codex browser extension or a scoped tab attachment. This access dependency supersedes the earlier request simply to sign in. The 95 staged images and remaining-nine list are unchanged; no push occurred. Erik explicitly reiterated “finish the remaining pictures and push it.”


## Complete supplier photo catalog — November 3, 2026

The TSG browser connection exposed the signed-in Signs365 catalog on refresh. All nine pending entries now have matching supplier images from the rigid, adhesive, banner, apparel and handheld categories. Each of the 104 product/service listings links to an enlarged self-hosted image. Signs365 shows paper business cards, postcards and mailers in one product-family photograph; those entries are labeled accordingly. All five service cards retain related-product captions.

The customer PDF has been rebuilt with the final images. All 29 automated checks pass, including all 104 WebP routes, private source isolation, PDF download content version, quote flow and persistent storage. Syntax and whitespace checks pass. Earlier staged and login-blocked statuses are superseded. The existing website task records the final deployed commit and production readback.

Final PDF QA: all 32 rendered pages reviewed. All 104 product image placements match their intended source conversions, all 104 quote links encode the expected product/service, and all 11 contents links/bookmarks reach the correct category. The PDF is 7,529,032 bytes; SHA-256 `81f4b180b3356c0fe5ec40719ec1e7fe1cfc2c510c7856e3ca2f22c7b656921c`.

## Dedicated Houston catalog pages — November 3, 2026

SolidSite Signs / SS-SIGNS-WEB-20261102, Atlas. Erik requested an individual page for each product so Houston customers could discover specific signs through search. The release creates 104 server-rendered detail pages: 99 products and five services. Each URL is linked from the catalog title and exposes its own heading, image, options, selection notes, quote brief, related items and prefilled contact path. Four existing Houston service guides add relevant links to specific formats. The original catalog, image viewer, PDF and quote storage remain available.

The sitemap now lists 111 canonical marketing URLs, including the 104 detail pages and their primary images. Pages use product-specific titles, descriptions, image cards, breadcrumb markup and linked Product/Service entities. The shared HTML template is not a public route; unknown IDs are genuine noindex 404s. The final check covers every entry plus the quote, privacy, alias and storage regressions. Desktop and 320-pixel phone checks confirmed the layout and the selected product reached the quote form without creating a lead.

[SEO implementation and indexing boundary](SEO.md#houston-product-and-service-pages--november-3-2026). The connected business Google account lacks access to the domain property, so no Search Console submission or Google indexing is claimed. The existing website task records the production commit and verification; no new recurring work or paid campaign was created.
