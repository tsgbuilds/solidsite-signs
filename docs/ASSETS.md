# Asset provenance

## Storefront image

- File: `public/assets/storefront.webp`, 1536 × 1024, about 266 KB.
- Created November 2, 2026 with the built-in imagegen tool, not a CLI/API fallback.
- Original generated PNG is preserved in the local Codex generated-images folder. The production WebP is included in this repository; it has no dependency on that local source path.
- This is a fictional signage concept, visibly labeled on the page. It is not evidence of completed work or a customer endorsement.
- The service banners, window lettering and mounted-sign specimens are original HTML/CSS artwork.

Final generation prompt:

> Use case: product-mockup. Asset type: photorealistic website hero for SolidSite Signs, a Houston signage business. Create a single landscape 1536x1024 editorial architectural photograph, not a website screenshot. A beautiful clean contemporary commercial glass storefront with charcoal metal frames and pale concrete, a large vermilion red vinyl banner mounted taut with real silver grommets across the left half of the storefront. Banner typography in huge bold white condensed sans-serif reads exactly "MAKE AN\nENTRANCE." with clean two-line spacing. Adjacent glass panels have elegant matte white cut-vinyl stripes and small text "WELCOME". Frame at an art-directed three-quarter view from pedestrian height, emphasizing physical banner, real material textures, dimensional natural shadows and reflections. Afternoon sunlight, slightly warm natural color, black awning edge near top, subtle green landscape at bottom right. Cropped architectural product shot, no people, no cars, no existing brand logos or dealership marks, no unrelated signs, no extraneous graphic overlays. Confident commercially polished print-production sample, realistic not a 3D plastic render. This is a fictional signage concept, not evidence of a completed customer job.

## Brand and type

The outlined SolidSite wordmark and symbol are from Erik's approved SolidSite brand kit dated October 15, 2026. The Signs descriptor is separate from the original wordmark. Barlow and Barlow Condensed are self-hosted with SIL Open Font License copies under `public/assets/fonts/`.

November 2 SEO update: the three original TTF fonts were losslessly repackaged as WOFF2 using fontTools 4.60.2 in a temporary authoring environment. No font dependency is needed at runtime. Original fonts and license files are retained; CSS and preload links request WOFF2. Combined font transfer falls from 323,244 to 117,164 bytes (63.8% smaller), preserving the full glyph set.

## Catalog — November 3, 2026

The 12 SVGs under `public/assets/catalog/` are original vector illustrations created for SolidSite Signs: one overview and 11 category drawings. They show product formats, not completed client projects or exact supplier configurations. No supplier photographs, logos or catalog copy were reused. B2Sign's site terms do not grant a general redistribution license; its white-label navigation alone was not treated as permission.

`public/downloads/solidsite-signs-catalog.pdf` uses original ReportLab vector drawings, the existing licensed Barlow fonts, and the existing generated storefront concept above, labeled as illustrative. The source generator is `scripts/build-catalog-pdf.py`. Product facts are paraphrased from the internal source notes and shared catalog data; private source URLs and supplier identities are excluded from the public PDF and website.
