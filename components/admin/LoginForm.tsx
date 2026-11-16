'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';

export default function LoginForm({ notice }: { notice: string | null }) {
  const router = useRouter();
  const [error, setError] = useState(notice ?? '');
  const [isPending, startTransition] = useTransition();

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

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <button type="submit" className="submit-btn" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign In'}
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
