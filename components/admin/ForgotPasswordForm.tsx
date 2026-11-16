'use client';

import { useState, useTransition } from 'react';
import { requestPasswordReset } from '@/app/actions/auth';

export default function ForgotPasswordForm() {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (sent) {
    return (
      <p className="form-ok" role="status">
        If that email belongs to an admin account, a reset link is on its way. Check your inbox (and spam folder).
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await requestPasswordReset(formData);
          if (result.ok) setSent(true);
          else setError(result.error);
        });
      }}
    >
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" />
      </div>
      <button type="submit" className="submit-btn" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send reset link'}
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
