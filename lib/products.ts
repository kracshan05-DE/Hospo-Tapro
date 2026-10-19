import data from '@/content/products.json';
import type { Product } from './types';

// Reads the product list at build time and checks its shape.
//
// The admin (Decap CMS) only writes valid entries, but the file can also be
// edited by hand on GitHub. A malformed entry fails the build with a clear
// message instead of shipping a broken page: Netlify then keeps the previous
// deploy live, so a bad edit can never take the site down.
export function getProducts(): Product[] {
  const list: unknown = (data as { products?: unknown }).products;
  if (!Array.isArray(list)) {
    throw new Error('content/products.json must contain a "products" array.');
  }

  return list.map((raw, i) => {
    const p = raw as Record<string, unknown>;
    const where = `content/products.json, product #${i + 1}`;

    if (typeof p.name !== 'string' || !p.name.trim()) {
      throw new Error(`${where}: "name" is required.`);
    }
    for (const key of ['volume', 'description', 'image'] as const) {
      if (p[key] != null && typeof p[key] !== 'string') {
        throw new Error(`${where}: "${key}" must be text.`);
      }
    }
    const image = (p.image as string | undefined)?.trim() || undefined;
    if (image && !image.startsWith('/products/')) {
      throw new Error(`${where}: "image" must be a path under /products/ (got "${image}").`);
    }

    return {
      name: p.name.trim(),
      volume: (p.volume as string | undefined)?.trim() || undefined,
      description: (p.description as string | undefined)?.trim() || undefined,
      image,
    };
  });
}
