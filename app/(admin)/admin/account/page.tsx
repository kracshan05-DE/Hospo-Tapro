import { requireAdminPage } from '@/lib/admin';
import { changePassword } from '@/app/actions/auth';
import AdminTopbar from '@/components/admin/AdminTopbar';
import PasswordForm from '@/components/admin/PasswordForm';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const admin = await requireAdminPage({ allowPendingPasswordChange: true });

  return (
    <div className="admin-shell">
      {!admin.mustChangePassword && <AdminTopbar active="account" email={admin.user.email} />}
      <main className="admin-main narrow">
        <h1 className="admin-h1">Your account</h1>
        {admin.mustChangePassword ? (
          <p className="notice" role="status">
            Welcome. Before you continue, please replace the temporary password you were given with one only you know.
          </p>
        ) : (
          <p className="admin-sub">
            Signed in as <strong>{admin.user.email}</strong> ({admin.role === 'owner' ? 'owner' : 'administrator'}).
          </p>
        )}
        <h2 className="admin-h2">Change password</h2>
        <PasswordForm action={changePassword} requireCurrent successHref="/admin/dashboard" submitLabel="Update password" />
      </main>
    </div>
  );
}
