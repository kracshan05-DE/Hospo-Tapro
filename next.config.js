// Static export: `next build` writes plain HTML/CSS/JS to `out/`, which
// Netlify serves from its CDN. There is no server, database or API route at
// runtime, so there is nothing to keep alive, patch at runtime, or attack.
//
// Consequences of `output: 'export'` worth knowing:
// - No middleware, server actions, API routes or ISR. Products are read from
//   content/products.json at build time; edits trigger a rebuild on Netlify.
// - `headers()` here is not supported. Response headers live in netlify.toml.
//   The Content-Security-Policy is set per layout via <meta> (see lib/csp.ts).
// - next/image cannot optimise at request time, so images are served as-is.
//   Keep uploads small (the admin warns above 1 MB).

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

module.exports = nextConfig;
