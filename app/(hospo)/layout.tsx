import type { Metadata, Viewport } from 'next';
import { SITE_CSP } from '@/lib/csp';
import './globals.css';

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export const metadata: Metadata = {
  title: 'Hospo Fresh | Foodservice Supplier',
  description:
    'Hospo Fresh - reliable foodservice supply, importing, distribution and manufacturing for hospitality businesses.',
};

// Independent root layout for the Hospo Fresh public site. Hospo Fresh and
// Tapro each have their own root layout (own <html>/<body> and stylesheet) so
// their identically named CSS variables (--green, --gold, ...) never collide.
export default function HospoRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={SITE_CSP} />
      </head>
      <body>{children}</body>
    </html>
  );
}
