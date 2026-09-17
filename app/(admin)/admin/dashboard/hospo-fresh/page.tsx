import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import type { Inquiry } from '@/lib/types';
import AdminTopbar from '@/components/admin/AdminTopbar';
import InquiriesList from '@/components/admin/InquiriesList';

export const revalidate = 0;

const PAGE_SIZE = 25;

export default async function HospoDashboardPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const supabase = createClient();

  // Defense-in-depth: middleware already blocks this route for anonymous
  // visitors, but a page-level check means the guard survives even if the
  // middleware matcher is ever edited or bypassed.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact' })
    .eq('brand', 'hospo_fresh')
    .order('created_at', { ascending: false })
    .range(from, to);

  const inquiries = (data ?? []) as Inquiry[];
  const total = count ?? 0;
  const hasNext = to + 1 < total;

  return (
    <div className="admin-shell">
      <AdminTopbar active="hospo" />
      <main className="admin-main">
        <h1 className="admin-h1">
          Hospo Fresh Enquiries <span className="brand-pill hospo">Hospo Fresh</span>
        </h1>
        <p className="admin-sub">
          Everything submitted through the Hospo Fresh contact form. Download as a spreadsheet
          any time.
        </p>
        <InquiriesList inquiries={inquiries} csvFilePrefix="hospo-fresh" />
        {total > PAGE_SIZE && (
          <div className="pagination">
            <span>
              Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))} · {total} total
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`?page=${page - 1}`}>
                <button disabled={page <= 1}>Previous</button>
              </a>
              <a href={`?page=${page + 1}`}>
                <button disabled={!hasNext}>Next</button>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
