'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthResult } from '@/app/actions/auth';

// Shared by "change password" (needs the current password) and "set a new
// password after a reset link" (doesn't).
export default function PasswordForm({
  action,
  requireCurrent,
  successHref,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<AuthResult>;
  requireCurrent: boolean;
  successHref: string;
  submitLabel: string;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) {
        form.reset();
        setDone(true);
        router.push(successHref);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="password-form">
      {requireCurrent && (
        <div className="field">
          <label htmlFor="current_password">Current password</label>
          <input id="current_password" name="current_password" type="password" required autoComplete="current-password" />
        </div>
      )}
      <div className="field">
        <label htmlFor="new_password">New password</label>
        <input id="new_password" name="new_password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" aria-describedby="pw-hint" />
        <small id="pw-hint" className="hint">At least 12 characters. A short phrase is easiest to remember.</small>
      </div>
      <div className="field">
        <label htmlFor="confirm_password">Confirm new password</label>
        <input id="confirm_password" name="confirm_password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" />
      </div>
      <button type="submit" className="submit-btn" disabled={isPending || done}>
        {isPending ? 'Saving…' : done ? 'Password updated' : submitLabel}
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
