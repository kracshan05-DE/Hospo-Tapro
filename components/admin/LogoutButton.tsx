'use client';

import { logout } from '@/app/actions/auth';

export default function LogoutButton() {
  return (
    <button
      onClick={() => {
        logout();
      }}
    >
      Log Out
    </button>
  );
}
