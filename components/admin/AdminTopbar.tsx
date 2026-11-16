import LogoutButton from './LogoutButton';

type Tab = 'inquiries' | 'tapro' | 'account';

const TABS: { id: Tab; href: string; label: string }[] = [
  { id: 'inquiries', href: '/admin/dashboard/inquiries', label: 'Enquiries' },
  { id: 'tapro', href: '/admin/dashboard/tapro', label: 'Tapro Products' },
  { id: 'account', href: '/admin/account', label: 'Account' },
];

export default function AdminTopbar({ active, email }: { active: Tab | null; email?: string }) {
  return (
    <div className="admin-topbar">
      <nav className="brand-switch" aria-label="Admin sections">
        {TABS.map((t) => (
          <a key={t.id} href={t.href} className={active === t.id ? 'active' : ''} aria-current={active === t.id ? 'page' : undefined}>
            {t.label}
          </a>
        ))}
      </nav>
      <div className="actions">
        {email && <span className="admin-who" title="Signed in as">{email}</span>}
        <a href={active === 'tapro' ? '/tapro' : '/'} target="_blank" rel="noopener noreferrer">
          View Site ↗
        </a>
        <LogoutButton />
      </div>
    </div>
  );
}
