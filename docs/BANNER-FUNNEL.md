# Houston banners: from search click to approved quote

A013, November 4, 2026. The ad's unchanged destination is /banners-houston/. The banner buyer can send a brief on the page, with four required inputs: description, Houston-area city/ZIP, name and email. A phone number is optional. The supplier photo is labeled as a product example. The customer sees a reference only after the existing SolidSite Signs store saves the request. Artwork can be emailed afterward with the project reference. No order or date is confirmed on submission.

**Attribution:** Allowlisted UTM fields and Google click IDs from the most recent tagged visit in the same tab stay attached when browsing the catalog. Native banner submissions also carry the current page's tags without JavaScript. Quote data and source labels are recorded in the protected existing SolidSite Signs record, never an open analytics endpoint. The source identity remains SolidSite / solidsite-signs-website. No third-party script, Google Ads import, call recording or email sequence is installed. Phone-only leads have no automatic online conversion; ask how they found us during ordinary intake when appropriate.

**Sutton's follow-through:** Read the existing Signs SQLite inbox during the established company sweep. Match by the SS reference. Validate Houston-area location, banner use, approximate size/quantity, target date and delivery or install needs. Ask for the missing detail or artwork; never promise a date or price before scope review. Mark qualified, quote sent, won/lost and actual value in the existing sales record linked to that reference, under the usual quote/approval rules. Exclude QA, spam, duplicate receipts and unserviceable inquiries from qualified outcomes. Reconcile once per campaign review: ad clicks → unique saved references → qualified projects → quotes issued → accepted jobs → collected sales. Neither a CTA click nor a saved quote is revenue. The source remains self-reported or unknown for unattributed traffic; no forced ad attribution.

**Operator read:** Existing production alert email and HTTP admin access are disabled. Use its authorized Railway Console with SQLite read-only, /data/quotes.sqlite. Narrow count-only check after deployment (read-only; no contacts or click IDs returned):

```sql
SELECT date(created_at) AS utc_date,
       json_extract(payload, '$.campaign.utm_campaign') AS campaign,
       count(*) AS saved_requests
FROM quotes
WHERE company='SolidSite' AND source='solidsite-signs-website'
  AND json_extract(payload, '$.campaign.utm_campaign')='solidsite-signs-houston-search-20261103'
  AND reference NOT IN ('SS-191E34C0B05E','SS-37454D8D1C70')
GROUP BY 1,2;
```

Raw counts can include unqualified or duplicate customers; use the reference-level qualification check before reporting outcomes. No new automation, mailbox or spend is required.

**Release and verification:** Same service, Node 24, existing persistent volume and environment. Publish this isolated commit on the verified main branch of tsgbuilds/solidsite-signs through the existing Railway release path. Confirm the deployed revision, healthz, the form action/brand on the public landing, current assets and privacy text. No production message or quote is needed to verify that release. The next genuine campaign-tagged receipt, or a scoped QA record excluded from outcomes, is required to prove production attribution. Google Ads conversion reporting needs a separate verified Signs-specific destination/import; do not reuse Concrete's conversion. It is safe to revert the release without migrating the quotes table; attribution resides in the existing JSON payload.
