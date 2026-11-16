import LoginForm from '@/components/admin/LoginForm';

const NOTICES: Record<string, string> = {
  'not-authorised': 'That account does not have admin access.',
  'link-expired': 'That link has expired or was already used. Please request a new one.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>Hospo Fresh Group Admin</h1>
        <p className="sub">Sign in to manage enquiries and the Tapro collection.</p>
        <LoginForm notice={error ? NOTICES[error] ?? null : null} />
        <p className="login-foot">
          <a href="/admin/forgot-password">Forgot your password?</a>
        </p>
      </div>
    </div>
  );
}
