import type { Metadata, Viewport } from 'next';
import '../admin.css';

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export const metadata: Metadata = {
  title: 'Admin — Hospo Fresh Group',
  robots: { index: false, follow: false },
};

// This is an independent Next.js "root layout" (its own <html>/<body>),
// separate from the Hospo Fresh and Tapro public-site layouts. Next.js
// supports multiple root layouts via route groups as long as their URL
// spaces never overlap (/, /tapro/*, /admin/* here) — this is what keeps
// each brand's CSS and fonts fully isolated from the shared admin tool and
// from each other, with zero risk of style bleed on client-side navigation.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="admin-root">{children}</body>
    </html>
  );
}
