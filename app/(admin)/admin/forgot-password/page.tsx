import ForgotPasswordForm from '@/components/admin/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>Reset your password</h1>
        <p className="sub">Enter your admin email. If it has an account, we&apos;ll email you a reset link (valid for a short time). Open it in this same browser.</p>
        <ForgotPasswordForm />
        <p className="login-foot">
          <a href="/admin/login">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
