import { requireAdminPage } from '@/lib/admin';
import { logServerError } from '@/lib/log';
import type { Product } from '@/lib/types';
import AdminTopbar from '@/components/admin/AdminTopbar';
import ProductManager from '@/components/admin/ProductManager';

export const dynamic = 'force-dynamic';

export default async function TaproDashboardPage() {
  const admin = await requireAdminPage();

  const { data, error } = await admin.supabase.from('products').select('*').order('sort_order', { ascending: true });
  if (error) logServerError('admin.products.list', error);
  const products = (data ?? []) as Product[];

  return (
    <div className="admin-shell">
      <AdminTopbar active="tapro" email={admin.user.email} />
      <main className="admin-main">
        <h1 className="admin-h1">
          Tapro Collection <span className="brand-pill tapro">Tapro</span>
        </h1>
        <p className="admin-sub">
          Add, edit, or remove products. Changes appear on the live site immediately. Tapro enquiries are in{' '}
          <a href="/admin/dashboard/inquiries?brand=tapro">Enquiries</a>.
        </p>
        {error ? (
          <div className="empty-admin">Products could not be loaded. Please refresh the page.</div>
        ) : (
          <ProductManager initialProducts={products} />
        )}
      </main>
    </div>
  );
}
