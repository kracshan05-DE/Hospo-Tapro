import { requireAdminPage } from '@/lib/admin';
import { logServerError } from '@/lib/log';
import { isInquiryStatus, sanitizeSearch } from '@/lib/validation';
import type { Brand, Inquiry, InquiryStatus } from '@/lib/types';
import AdminTopbar from '@/components/admin/AdminTopbar';
import InquiriesList from '@/components/admin/InquiriesList';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const BRANDS: { value: Brand | ''; label: string }[] = [
  { value: '', label: 'All brands' },
  { value: 'hospo_fresh', label: 'Hospo Fresh' },
  { value: 'tapro', label: 'Tapro' },
];
const STATUSES: { value: InquiryStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

type SearchParams = { q?: string; brand?: string; status?: string; page?: string };

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;

  const q = sanitizeSearch(sp.q);
  const brand = sp.brand === 'hospo_fresh' || sp.brand === 'tapro' ? sp.brand : '';
  const status = isInquiryStatus(sp.status) ? sp.status : '';
  const page = Math.max(1, Math.floor(Number(sp.page) || 1));
  const from = (page - 1) * PAGE_SIZE;

  let query = admin.supabase
    .from('inquiries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (brand) query = query.eq('brand', brand);
  if (status) query = query.eq('status', status);
  if (q) {
    const p = `%${q}%`;
    query = query.or(`name.ilike.${p},email.ilike.${p},business.ilike.${p},phone.ilike.${p},message.ilike.${p}`);
  }

  const [{ data, count, error }, { count: newCount }] = await Promise.all([
    query,
    admin.supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);
  if (error) logServerError('admin.inquiries.list', error);

  const inquiries = (data ?? []) as Inquiry[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const link = (overrides: Partial<SearchParams>) => {
    const params = new URLSearchParams();
    const merged = { q, brand, status, page: String(page), ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && !(k === 'page' && v === '1')) params.set(k, v);
    });
    const s = params.toString();
    return s ? `?${s}` : '?';
  };

  return (
    <div className="admin-shell">
      <AdminTopbar active="inquiries" email={admin.user.email} />
      <main className="admin-main">
        <h1 className="admin-h1">
          Enquiries {newCount ? <span className="count-pill">{newCount} new</span> : null}
        </h1>
        <p className="admin-sub">
          Every enquiry from the Hospo Fresh and Tapro contact forms. Each one is saved here even if the
          notification email fails.
        </p>

        <form className="filters" method="get" role="search">
          <label className="sr-only" htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Search name, email, business, phone or message" maxLength={100} />
          <label className="sr-only" htmlFor="brand">Brand</label>
          <select id="brand" name="brand" defaultValue={brand}>
            {BRANDS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Filter</button>
          {(q || brand || status) && (
            <a className="btn-secondary" href="?">Clear</a>
          )}
        </form>

        {error ? (
          <div className="empty-admin">Enquiries could not be loaded. Please refresh the page.</div>
        ) : (
          <InquiriesList inquiries={inquiries} filtered={!!(q || brand || status)} />
        )}

        {total > PAGE_SIZE && (
          <nav className="pagination" aria-label="Pages">
            <span>
              Page {page} of {pages} · {total} enquiries
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {page > 1 ? <a className="page-btn" href={link({ page: String(page - 1) })}>Previous</a> : <span className="page-btn disabled">Previous</span>}
              {page < pages ? <a className="page-btn" href={link({ page: String(page + 1) })}>Next</a> : <span className="page-btn disabled">Next</span>}
            </div>
          </nav>
        )}
      </main>
    </div>
  );
}
