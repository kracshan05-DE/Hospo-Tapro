// Canonical public address of the site. Set NEXT_PUBLIC_SITE_URL in Vercel
// once the custom domain is live; until then this default is used for
// canonical links, the sitemap and email links.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://hospofresh.com.au').replace(/\/$/, '');
