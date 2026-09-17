import { createClient } from '@/lib/supabase-server';
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

export const revalidate = 0;

export default async function TaproHomePage() {
  const supabase = createClient();
  const [{ data: productData }, { data: userData }] = await Promise.all([
    supabase.from('products').select('*').order('sort_order', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const products = (productData ?? []) as Product[];
  const isAdmin = !!userData.user;

  return (
    <>
      <Header isAdmin={isAdmin} />
      <Hero />
      <Manifesto productCount={products.length} />
      <Marquee />
      <ProductGrid products={products} />
      <Heritage />
      <Values />
      <Contact />
      <Footer />
    </>
  );
}
