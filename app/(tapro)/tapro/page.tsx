import { getProducts } from '@/lib/products';
import Header from '@/components/tapro/Header';
import Hero from '@/components/tapro/Hero';
import Manifesto from '@/components/tapro/Manifesto';
import Marquee from '@/components/tapro/Marquee';
import ProductGrid from '@/components/tapro/ProductGrid';
import Heritage from '@/components/tapro/Heritage';
import Values from '@/components/tapro/Values';
import Contact from '@/components/tapro/Contact';
import Footer from '@/components/tapro/Footer';

// Rendered once at build time. Editing products in the admin commits to
// GitHub, which triggers a Netlify rebuild with the new list.
export default function TaproHomePage() {
  const products = getProducts();

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Manifesto productCount={products.length} />
        <Marquee />
        <ProductGrid products={products} />
        <Heritage />
        <Values />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
