import LogoutButton from './LogoutButton';

export default function AdminTopbar({ active }: { active: 'hospo' | 'tapro' | null }) {
  return (
    <div className="admin-topbar">
      <div className="brand-switch">
        <a href="/admin/dashboard/hospo-fresh" className={active === 'hospo' ? 'active' : ''}>
          Hospo Fresh
        </a>
        <a href="/admin/dashboard/tapro" className={active === 'tapro' ? 'active' : ''}>
          Tapro
        </a>
      </div>
      <div className="actions">
        <a href={active === 'tapro' ? '/tapro' : '/'} target="_blank" rel="noreferrer">
          View Site ↗
        </a>
        <LogoutButton />
      </div>
    </div>
  );
}
