'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [googleLoading, setGoogleLoading] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await login(formData);
      if (result.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError('Could not start Google sign-in. Please try again.');
      setGoogleLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>Hospo Fresh Group Admin</h1>
        <p className="sub">Sign in to manage Hospo Fresh enquiries or the Tapro collection.</p>

        <button type="button" className="google-btn" onClick={handleGoogleLogin} disabled={googleLoading}>
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className="login-divider"><span>or</span></div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending}>
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}
