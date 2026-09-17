import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import type { Product, Inquiry } from '@/lib/types';
import AdminTopbar from '@/components/admin/AdminTopbar';
import ProductManager from '@/components/admin/ProductManager';
import InquiriesList from '@/components/admin/InquiriesList';

export const revalidate = 0;

export default async function TaproDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const [{ data: productData }, { data: inquiryData }] = await Promise.all([
    supabase.from('products').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('inquiries')
      .select('*')
      .eq('brand', 'tapro')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const products = (productData ?? []) as Product[];
  const inquiries = (inquiryData ?? []) as Inquiry[];

  return (
    <div className="admin-shell">
      <AdminTopbar active="tapro" />
      <main className="admin-main">
        <h1 className="admin-h1">
          Tapro Collection <span className="brand-pill tapro">Tapro</span>
        </h1>
        <p className="admin-sub">Add, edit, or remove products. Changes appear on the live site immediately.</p>
        <ProductManager initialProducts={products} />

        <h2 style={{ fontSize: '1.3rem', margin: '48px 0 6px', color: 'var(--a-green)' }}>Enquiries</h2>
        <p className="admin-sub">Trade and stockist enquiries submitted through the Tapro contact form.</p>
        <InquiriesList inquiries={inquiries} csvFilePrefix="tapro" />
      </main>
    </div>
  );
}
