// A Tapro product, as stored in content/products.json and edited in the
// Decap CMS admin (see public/admin/config.yml for the matching fields).
// The order of the list is the display order on the site.
export type Product = {
  name: string;
  volume?: string;
  description?: string;
  /** Site-relative path to the photo, e.g. "/products/red-kochchi.webp". */
  image?: string;
};

export type Brand = 'hospo' | 'tapro';
