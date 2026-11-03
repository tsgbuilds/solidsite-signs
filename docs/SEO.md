# SolidSite Signs — SEO expansion, November 2, 2026

Company: SolidSite. Owner: Atlas. Source: Erik's instruction, “make the seo killer we need to stand out,” following the authorized site build, main push and Railway launch. Task remains SS-SIGNS-WEB-20261102 with this enhancement recorded separately from the initial launch. No deadline, paid campaign, spend, outreach or new schedule.

## Positioning and page map

The supported distinction is direct work with Erik on signage sales/project management, coordinated outside production, and suitable installation or local delivery. Prior work for a local dealership supports the automotive focus; customer identity, financial figures and endorsement are not public evidence.

| Canonical page | Search/customer intent | Distinct useful content |
| --- | --- | --- |
| `/` | Houston banners, graphics and sign installation | Clear service set, direct project contact, dealership experience and inquiry form |
| `/banners-houston/` | Custom business and promotional banners in Houston | Placement, message, dimensions, finishing, quote inputs and repeat campaigns |
| `/window-graphics-houston/` | Window graphics and business lettering in Houston | Individual panels, entrance lettering, visibility, existing film/graphics and artwork requirements |
| `/sign-installation-houston/` | Sign/graphic installation and local delivery | Surface, sign specifications, mounting access, install-only review and receiving requirements |
| `/dealership-signage/` | Car dealership banners, showroom graphics and repeat promotions | Campaign lists, artwork approval, location-by-location changes and installation windows |
| `/sign-project-checklist/` | Preparing a useful sign quote request | Six-step original brief checklist with print styling and links to each service |

These are six distinct marketing pages, not city-name duplicates. Page intent is based on service fit and current search review, not paid keyword-volume data. No keyword-volume, ranking, traffic or conversion baseline has been established.

## Implemented

- Server-rendered HTML at descriptive clean URLs. HTML and slashless aliases redirect permanently to one canonical route; query parameters do not create new canonical URLs.
- One registry owns titles, descriptions, route mapping, absolute canonical/social URLs and the six-page sitemap. Privacy retains its original URL and is not included in the marketing sitemap.
- Linked Organization, WebSite and WebPage schema; Service entities on the four commercial service pages and visible breadcrumbs with BreadcrumbList markup on inner pages. No fake address, hours, reviews, ratings, prices or LocalBusiness rich-result claim. The known mailing address does not establish a walk-in signage location.
- Real descriptive links from the homepage and footer to every page, plus contextual related services. Service quote buttons preselect an allowed service in the existing form; arbitrary query values are ignored.
- Existing restrictive content-security policy retained, with a SHA-256 hash for the emitted JSON-LD. API, health and error responses explicitly use `noindex`; unknown/private routes keep real error codes.
- WOFF2 font downloads total 117,164 bytes versus 323,244 bytes for the previous TTFs (63.8% smaller). Existing hero image dimensions/priority, self-hosted assets and small deferred script remain. No analytics tag or external tracking was added.

## Verification

Fourteen tests passed: all existing intake/privacy checks plus metadata, schema relationships/CSP, sitemap/robots, canonical aliases, HEAD responses and real error/private boundaries. All six marketing pages render without horizontal overflow at 320 and 768 pixels; desktop and 390-pixel service/guide layouts inspected. One H1 on each page. A window-graphics CTA correctly preselected Graphics and submitted a **local-only** test receipt `SS-E8E5CBD4A9A8`. No browser errors or warnings observed. Local QA is not a customer lead.

Publication evidence is recorded after deployment in the existing task and release record. The current approved origin is `https://solidsite-signs-production.up.railway.app`; no owned custom domain was supplied at the time of implementation. Metadata follows `SITE_URL`, making the later host change centralized rather than requiring each page to be edited.

## Research and rationale

Primary sources reviewed November 2, 2026:

- [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): useful original content, descriptive links and clear organization informed the separate service pages.
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) and [canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): the sitemap, links, redirects and canonical declarations use the same preferred URLs. Discovery is not guaranteed indexing.
- [Organization markup](https://developers.google.com/search/docs/appearance/structured-data/organization), [site names](https://developers.google.com/search/docs/appearance/site-names) and [breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb): represent the actual business and site hierarchy with consistent IDs. Structured data is not a ranking or display guarantee.
- [Google structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) and [spam policies](https://developers.google.com/search/docs/essentials/spam-policies): schema matches visible content; no fabricated reviews, keyword blocks or cloned location pages.
- [Houston Sign Company](https://houstonsign.com/) advertises a broad product/industry range; [KORE Graphics](https://koregraphics.com/) emphasizes storefront, vehicle, wall and vinyl work. Our inference from these two competitor sites: SolidSite should emphasize its supported dealership/project-coordination focus rather than copy a larger fabrication or wrap shop's breadth. This is a small qualitative review, not a market-share or ranking analysis.
- [fontTools WOFF2 documentation](https://fonttools.readthedocs.io/en/latest/ttLib/woff2.html): one-time conversion of existing licensed font files.

## Next evidence that will strengthen the site

1. Confirm the owned public domain. Configure DNS/TLS and then update `SITE_URL`; retain redirects when moving from the Railway address. No domain purchase or DNS action is included without a supplied domain and access.
2. Verify the final domain in Google Search Console, submit `/sitemap.xml` and review actual queries, impressions, clicks and indexed pages. No Search Console ownership or submission is claimed in this release.
3. Add authorized photos and a factual project write-up from Erik's actual work. Record scope, materials, process and customer permission before replacing the concept artwork or naming a dealer.
4. Reconcile signage with the actual SolidSite business identity/listing before any Google Business Profile changes. Do not invent a storefront or create duplicate listings to pursue map visibility.

The code and content release is complete independently of those owner/account inputs. Ongoing quote review stays in WEB-LEADS-20261102. Automatic email alerts remain disabled.
