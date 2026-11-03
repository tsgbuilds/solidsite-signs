import { createHash } from 'node:crypto';
import { catalogSchema } from './catalog.mjs';

// These canonical routes also own the sitemap and on-page search metadata.
// Add a substantive, linked page before adding another marketing route here.
export const SEO_PAGES = Object.freeze([
  {
    path: '/', file: 'index.html', label: 'Home', sitemap: true,
    title: 'Houston Banners, Graphics & Sign Installation | SolidSite Signs',
    description: 'Custom banners, window graphics and sign installation for Houston businesses and dealerships. One contact from project planning to delivery or installation.'
  },
  {
    path: '/banners-houston/', file: 'banners-houston.html', label: 'Houston banners', sitemap: true,
    title: 'Custom Banners in Houston | SolidSite Signs',
    description: 'Plan custom banners for Houston promotions, grand openings and events. Get help with size, artwork, finishing, production and local delivery or installation.',
    service: 'Custom banners',
    serviceDescription: 'Project planning and production coordination for promotional, grand-opening and event banners, with delivery or installation reviewed for the location.'
  },
  {
    path: '/window-graphics-houston/', file: 'window-graphics-houston.html', label: 'Houston window graphics', sitemap: true,
    title: 'Window Graphics & Business Lettering in Houston | SolidSite Signs',
    description: 'Window graphics, business lettering and promotional graphics for Houston storefronts. Coordinate artwork, sizing and installation with one project contact.',
    service: 'Window graphics and business lettering',
    serviceDescription: 'Planning and production coordination for window graphics, promotional graphics and business lettering, with surface and installation requirements reviewed before quoting.'
  },
  {
    path: '/sign-installation-houston/', file: 'sign-installation-houston.html', label: 'Houston sign installation', sitemap: true,
    title: 'Sign & Graphic Installation in Houston | SolidSite Signs',
    description: 'Need a banner, sign or graphic installed in Houston? Share photos, dimensions and access details for a scope review and project-specific installation quote.',
    service: 'Sign and graphic installation',
    serviceDescription: 'Sign, banner and graphic installation or local delivery, with the surface, access, sign dimensions and project scope reviewed before availability and pricing are confirmed.'
  },
  {
    path: '/dealership-signage/', file: 'dealership-signage.html', label: 'Dealership signage', sitemap: true,
    title: 'Car Dealership Banners & Graphics in Houston | SolidSite Signs',
    description: 'Banners, showroom graphics and sign installation for Houston car dealerships. Coordinate recurring promotions and location updates with one project contact.',
    service: 'Dealership promotional signage',
    serviceDescription: 'Coordination of banners, showroom graphics and sign installation for automotive dealership promotions and location updates, with scope and timing confirmed for each project.'
  },
  {
    path: '/sign-project-checklist/', file: 'sign-project-checklist.html', label: 'Sign project checklist', sitemap: true,
    title: 'Sign Project Checklist: Size, Artwork & Install | SolidSite Signs',
    description: 'Prepare a useful brief for your banner, window graphic or sign installation. Check dimensions, artwork, surfaces, access and timing before requesting a quote.'
  },
  {
    path: '/catalog/', file: 'catalog.html', label: 'Product catalog', sitemap: true, catalog: true,
    title: 'Signs, Graphics & Display Catalog | SolidSite Signs Houston',
    description: 'Explore banners, rigid signs, window graphics, event displays, printed materials and more. Choose a product and request a quote from SolidSite Signs in Houston.'
  },
  {
    path: '/privacy.html', file: 'privacy.html', label: 'Privacy', sitemap: false,
    title: 'Privacy | SolidSite Signs',
    description: 'How SolidSite Signs collects and uses project inquiries, contact information and website connection details. Contact SolidSite with privacy questions.'
  }
].map(page => Object.freeze(page)));

const pagesByPath = new Map(SEO_PAGES.map(page => [page.path, page]));
const aliases = new Map();
for (const page of SEO_PAGES) {
  const filePath = `/${page.file}`;
  if (filePath !== page.path) aliases.set(filePath, page.path);
  if (page.path !== '/' && page.path.endsWith('/')) aliases.set(page.path.slice(0, -1), page.path);
}

export const findSeoPage = pathname => pagesByPath.get(pathname);
export const canonicalRedirect = pathname => aliases.get(pathname);

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function renderSeoHead(page, origin, catalog) {
  const metadata = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    `<meta property="og:title" content="${escapeHtml(page.title)}">`,
    `<meta property="og:description" content="${escapeHtml(page.description)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="SolidSite Signs">',
    '<meta property="og:locale" content="en_US">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(page.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}">`
  ];
  // Local development can omit SITE_URL without advertising a guessed public host.
  if (!origin) return { head: metadata.join('\n  '), scriptHash: '' };

  const canonical = `${origin}${page.path}`;
  const imageUrl = `${origin}/assets/storefront.webp`;
  const imageAlt = 'Illustrative storefront signage concept with a banner and window graphics; not a completed client project';
  metadata.push(
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}">`,
    '<meta property="og:image:type" content="image/webp">',
    '<meta property="og:image:width" content="1536">',
    '<meta property="og:image:height" content="1024">',
    `<meta property="og:image:alt" content="${imageAlt}">`,
    `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`,
    `<meta name="twitter:image:alt" content="${imageAlt}">`
  );

  const organizationId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  const webpageId = `${canonical}#webpage`;
  const areaServed = { '@type': 'Place', name: 'Greater Houston, Texas' };
  const graph = [
    {
      '@type': 'Organization', '@id': organizationId, name: 'SolidSite Signs', url: `${origin}/`,
      description: 'Banners, graphics and sign installation for businesses and dealerships in Greater Houston.',
      logo: `${origin}/assets/brand/solidsite-wordmark-carbon.svg`,
      telephone: '+17139122151', email: 'erik@gosolidsite.com', areaServed
    },
    {
      '@type': 'WebSite', '@id': websiteId, url: `${origin}/`, name: 'SolidSite Signs',
      inLanguage: 'en-US', publisher: { '@id': organizationId }
    },
    {
      '@type': page.catalog ? 'CollectionPage' : 'WebPage', '@id': webpageId, url: canonical, name: page.title,
      description: page.description, inLanguage: 'en-US', isPartOf: { '@id': websiteId },
      about: { '@id': page.service ? `${canonical}#service` : organizationId },
      ...(catalog ? { mainEntity: { '@id': `${canonical}#products` } } : {}),
      ...(page.path !== '/' ? { breadcrumb: { '@id': `${canonical}#breadcrumb` } } : {})
    }
  ];
  if (catalog) graph.push(catalogSchema(catalog, origin));
  if (page.service) graph.push({
    '@type': 'Service', '@id': `${canonical}#service`, name: page.service, serviceType: page.service,
    description: page.serviceDescription, url: canonical, provider: { '@id': organizationId },
    areaServed, mainEntityOfPage: { '@id': webpageId }
  });
  if (page.path !== '/') graph.push({
    '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: page.label, item: canonical }
    ]
  });
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  metadata.push(`<script type="application/ld+json">${jsonLd}</script>`);
  return { head: metadata.join('\n  '), scriptHash: `sha256-${createHash('sha256').update(jsonLd).digest('base64')}` };
}

export function renderSitemap(origin) {
  const urls = SEO_PAGES.filter(page => page.sitemap).map(page => `<url><loc>${escapeHtml(`${origin}${page.path}`)}</loc></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
