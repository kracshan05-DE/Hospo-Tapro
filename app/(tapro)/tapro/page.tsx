import { createClient } from '@/lib/supabase-server';
import { logServerError } from '@/lib/log';
import type { Product } from '@/lib/types';
import Header from '@/components/tapro/Header';
import Hero from '@/components/tapro/Hero';
import Manifesto from '@/components/tapro/Manifesto';
import Marquee from '@/components/tapro/Marquee';
import ProductGrid from '@/components/tapro/ProductGrid';
import Heritage from '@/components/tapro/Heritage';
import Values from '@/components/tapro/Values';
import Contact from '@/components/tapro/Contact';
import Footer from '@/components/tapro/Footer';

export const dynamic = 'force-dynamic';

export default async function TaproHomePage() {
  const supabase = await createClient();
  const [{ data: productData, error }, { data: userData }] = await Promise.all([
    supabase.from('products').select('*').order('sort_order', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  // Don't disguise an outage as "no products": log it and say so on the page.
  if (error) logServerError('tapro.products', error);
  const products = (productData ?? []) as Product[];

  return (
    <>
      <Header isAdmin={!!userData.user} />
      <Hero />
      <Manifesto productCount={error ? null : products.length} />
      <Marquee />
      <ProductGrid products={products} unavailable={!!error} />
      <Heritage />
      <Values />
      <Contact />
      <Footer />
    </>
  );
}
