import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/admin';
import { RESET_COOKIE } from '@/lib/auth-constants';
import { setPasswordAfterReset } from '@/app/actions/auth';
import PasswordForm from '@/components/admin/PasswordForm';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  const admin = await getAdmin();
  const cookieStore = await cookies();
  if (!admin || cookieStore.get(RESET_COOKIE)?.value !== admin.user.id) {
    redirect('/admin/login?error=link-expired');
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>Choose a new password</h1>
        <p className="sub">For {admin.user.email}</p>
        <PasswordForm action={setPasswordAfterReset} requireCurrent={false} successHref="/admin/dashboard" submitLabel="Save new password" />
      </div>
    </div>
  );
}
